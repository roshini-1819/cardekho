package com.cardekho.carmatch.dto;

import com.cardekho.carmatch.domain.BodyType;
import com.cardekho.carmatch.domain.FuelType;
import java.util.List;

/**
 * What the buyer tells us through the guided questionnaire.
 * Fields are nullable-tolerant; the service normalises them before scoring.
 */
public record Preferences(
        Double budgetMinLakh,
        Double budgetMaxLakh,
        List<BodyType> bodyTypes,
        List<FuelType> fuelTypes,
        Integer minSeating,
        Priorities priorities
) {
    /** Each weight is 0 (skip) .. 3 (must have). */
    public record Priorities(
            int value,
            int mileage,
            int safety,
            int space,
            int performance,
            int features
    ) {}
}
