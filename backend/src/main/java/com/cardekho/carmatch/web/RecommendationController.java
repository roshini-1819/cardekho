package com.cardekho.carmatch.web;

import com.cardekho.carmatch.dto.AiRecommendation;
import com.cardekho.carmatch.dto.Preferences;
import com.cardekho.carmatch.dto.RecommendationResponse;
import com.cardekho.carmatch.service.AiService;
import com.cardekho.carmatch.service.RecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final AiService aiService;

    public RecommendationController(RecommendationService recommendationService, AiService aiService) {
        this.recommendationService = recommendationService;
        this.aiService = aiService;
    }

    /** Deterministic, fully transparent ranking. */
    @PostMapping("/recommend")
    public RecommendationResponse recommend(@RequestBody Preferences prefs) {
        return recommendationService.recommend(prefs, 5);
    }

    /** AI-native: LLM picks the top 3 from the ranked candidates and explains. */
    @PostMapping("/recommend/ai")
    public AiRecommendation recommendWithAi(@RequestBody Preferences prefs) {
        return aiService.recommend(prefs);
    }

    /** Lets the frontend show whether real AI reasoning is available. */
    @GetMapping("/ai/status")
    public AiStatus aiStatus() {
        return new AiStatus(aiService.aiEnabled());
    }

    public record AiStatus(boolean enabled) {}
}
