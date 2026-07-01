package com.cardekho.carmatch.dto;

import com.cardekho.carmatch.domain.Car;
import java.util.List;

public record ScoredCar(
        Car car,
        int score,
        List<FactorContribution> breakdown,
        List<MatchReason> reasons
) {
    public record FactorContribution(String factor, int contribution) {}
}
