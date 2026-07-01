package com.cardekho.carmatch.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SaveShortlistRequest(
        String label,
        @NotEmpty(message = "Provide at least one car id") List<String> carIds
) {}
