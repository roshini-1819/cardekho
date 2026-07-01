package com.cardekho.carmatch.dto;

import com.cardekho.carmatch.domain.Car;
import java.util.List;

/**
 * The AI-native response: an LLM picks a few cars from the candidate set and
 * explains, in natural language, why each fits this specific buyer.
 */
public record AiRecommendation(
        String summary,
        List<Pick> picks,
        /** "gemini" when the model answered, "fallback" when we used the local engine. */
        String provider
) {
    public record Pick(
            Car car,
            int matchScore,
            String headline,
            String reasoning
    ) {}
}
