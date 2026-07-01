package com.cardekho.carmatch.service;

import com.cardekho.carmatch.domain.Car;
import com.cardekho.carmatch.dto.AiRecommendation;
import com.cardekho.carmatch.dto.MatchReason;
import com.cardekho.carmatch.dto.Preferences;
import com.cardekho.carmatch.dto.RecommendationResponse;
import com.cardekho.carmatch.dto.ScoredCar;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * The AI-native layer.
 *
 * Design choice: the LLM never sees the whole catalogue and never invents cars.
 * The deterministic engine first filters + ranks the dataset to a small
 * candidate set, and Gemini's only job is to pick the best 3 from *those real
 * rows* and explain the fit in natural language. This grounds the model in our
 * data, so it can't hallucinate a car or a spec.
 *
 * If no GEMINI_API_KEY is configured, or the call fails for any reason, we fall
 * back to the deterministic engine's own reasons — the feature degrades, the app
 * never breaks.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final int CANDIDATE_POOL = 8;
    private static final int PICKS = 3;

    private final RecommendationService recommendationService;
    private final ObjectMapper mapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public AiService(RecommendationService recommendationService,
                     ObjectMapper mapper,
                     @Value("${gemini.base-url}") String baseUrl,
                     @Value("${gemini.api-key}") String apiKey,
                     @Value("${gemini.model}") String model) {
        this.recommendationService = recommendationService;
        this.mapper = mapper;
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public boolean aiEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public AiRecommendation recommend(Preferences prefs) {
        RecommendationResponse ranked = recommendationService.recommend(prefs, CANDIDATE_POOL);
        List<ScoredCar> candidates = ranked.matches();

        if (candidates.isEmpty()) {
            return new AiRecommendation(
                    "No cars matched those constraints — try widening the budget or clearing the body/fuel filters.",
                    List.of(), aiEnabled() ? "gemini" : "fallback");
        }

        if (!aiEnabled()) {
            return fallback(candidates);
        }

        try {
            return callGemini(prefs, candidates);
        } catch (Exception e) {
            log.warn("Gemini call failed, using deterministic fallback: {}", e.getMessage());
            return fallback(candidates);
        }
    }

    // --- Gemini ---

    private AiRecommendation callGemini(Preferences prefs, List<ScoredCar> candidates) throws Exception {
        Map<String, ScoredCar> byId = new LinkedHashMap<>();
        for (ScoredCar sc : candidates) {
            byId.put(sc.car().getId(), sc);
        }

        String prompt = buildPrompt(prefs, candidates);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.4,
                        // This is a simple pick-and-explain task; disabling the model's
                        // "thinking" budget cuts latency from ~17s to a few seconds.
                        "thinkingConfig", Map.of("thinkingBudget", 0)));

        String raw = restClient.post()
                .uri("/models/{model}:generateContent?key={key}", model, apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = mapper.readTree(raw);
        String text = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text").asText();
        JsonNode parsed = mapper.readTree(text);

        List<AiRecommendation.Pick> picks = new ArrayList<>();
        for (JsonNode p : parsed.path("picks")) {
            String carId = p.path("carId").asText();
            ScoredCar sc = byId.get(carId);
            if (sc == null) {
                continue; // ignore anything the model invented outside the candidate set
            }
            picks.add(new AiRecommendation.Pick(
                    sc.car(),
                    sc.score(),
                    p.path("headline").asText(""),
                    p.path("reasoning").asText("")));
            if (picks.size() >= PICKS) {
                break;
            }
        }

        if (picks.isEmpty()) {
            return fallback(candidates); // model returned nothing usable
        }

        String summary = parsed.path("summary").asText("");
        return new AiRecommendation(summary, picks, "gemini");
    }

    private String buildPrompt(Preferences prefs, List<ScoredCar> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert, no-nonsense car-buying advisor for the Indian market. ")
          .append("A buyer has these preferences:\n")
          .append(describePreferences(prefs))
          .append("\nHere are the ONLY cars you may recommend (pre-filtered to fit their budget and hard needs). ")
          .append("Each has a matchScore (0-100) from our internal engine:\n\n");

        for (ScoredCar sc : candidates) {
            Car c = sc.car();
            sb.append("- carId: ").append(c.getId())
              .append(" | ").append(c.getMake()).append(' ').append(c.getModel()).append(' ').append(c.getVariant())
              .append(" | ₹").append(c.getPriceLakh()).append("L")
              .append(" | ").append(c.getBodyType().display())
              .append(" | ").append(c.getFuelType().display())
              .append(" | ").append(c.getTransmission().display())
              .append(" | mileage/range ").append(c.getMileage())
              .append(" | safety ").append(c.getSafetyStars()).append("★")
              .append(" | ").append(c.getSeating()).append(" seats")
              .append(" | boot ").append(c.getBootLitres()).append("L")
              .append(" | ").append(c.getPowerBhp()).append("bhp")
              .append(" | features: ").append(String.join(", ", c.getFeatures()))
              .append(" | matchScore ").append(sc.score())
              .append('\n');
        }

        sb.append("\nPick the ").append(PICKS).append(" best cars for THIS buyer. ")
          .append("Rank them best-first. Ground every claim in the specs above — do not invent cars, prices, or specs, ")
          .append("and only use carId values from the list. Be specific about the trade-offs that matter to this buyer.\n\n")
          .append("Respond with strict JSON in exactly this shape:\n")
          .append("{\"summary\": \"one or two sentences addressed to the buyer\", ")
          .append("\"picks\": [{\"carId\": \"...\", \"headline\": \"short punchy tag, max 8 words\", ")
          .append("\"reasoning\": \"2-3 sentences on why this fits them and any caveat\"}]}");
        return sb.toString();
    }

    private String describePreferences(Preferences p) {
        var pr = p.priorities();
        String priorities = new StringBuilder()
                .append("value=").append(pr == null ? 0 : pr.value())
                .append(", running-cost=").append(pr == null ? 0 : pr.mileage())
                .append(", safety=").append(pr == null ? 0 : pr.safety())
                .append(", space=").append(pr == null ? 0 : pr.space())
                .append(", performance=").append(pr == null ? 0 : pr.performance())
                .append(", features=").append(pr == null ? 0 : pr.features())
                .toString();
        return "  budget: ₹" + p.budgetMinLakh() + "L to ₹" + p.budgetMaxLakh() + "L\n"
                + "  min seats: " + p.minSeating() + "\n"
                + "  body preference: " + (p.bodyTypes() == null || p.bodyTypes().isEmpty() ? "any" : p.bodyTypes()) + "\n"
                + "  fuel preference: " + (p.fuelTypes() == null || p.fuelTypes().isEmpty() ? "any" : p.fuelTypes()) + "\n"
                + "  priorities (0=skip .. 3=must): " + priorities + "\n";
    }

    // --- fallback ---

    private AiRecommendation fallback(List<ScoredCar> candidates) {
        List<AiRecommendation.Pick> picks = candidates.stream()
                .limit(PICKS)
                .map(sc -> new AiRecommendation.Pick(
                        sc.car(),
                        sc.score(),
                        sc.reasons().isEmpty() ? "Strong all-round match" : sc.reasons().get(0).label(),
                        sc.reasons().stream().map(MatchReason::label).reduce((a, b) -> a + ". " + b).orElse("")))
                .toList();
        return new AiRecommendation(
                "Ranked by our scoring engine. Add a GEMINI_API_KEY to get AI-written reasoning.",
                picks, "fallback");
    }
}
