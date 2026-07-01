package com.cardekho.carmatch.dto;

import java.util.List;

public record RecommendationResponse(
        List<ScoredCar> matches,
        int totalConsidered,
        boolean empty
) {}
