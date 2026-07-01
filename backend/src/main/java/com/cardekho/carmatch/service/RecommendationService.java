package com.cardekho.carmatch.service;

import com.cardekho.carmatch.domain.Car;
import com.cardekho.carmatch.domain.FuelType;
import com.cardekho.carmatch.dto.MatchReason;
import com.cardekho.carmatch.dto.Preferences;
import com.cardekho.carmatch.dto.RecommendationResponse;
import com.cardekho.carmatch.dto.ScoredCar;
import com.cardekho.carmatch.dto.ScoredCar.FactorContribution;
import com.cardekho.carmatch.repo.CarRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * The deterministic recommendation engine.
 *
 * Two stages:
 *   1. Hard filters — non-negotiable constraints (budget, seating, fuel/body).
 *   2. Weighted scoring — each surviving car earns a 0-100 score built from
 *      normalised sub-scores blended by the priority weights the buyer set.
 *
 * Everything is explainable: the dominant factors become human-readable reasons,
 * and an explicit safety priority raises a caution on weak cars rather than
 * silently burying them.
 */
@Service
public class RecommendationService {

    private final CarRepository carRepository;

    public RecommendationService(CarRepository carRepository) {
        this.carRepository = carRepository;
    }

    private record Range(double min, double max) {
        double normalize(double value) {
            if (max == min) {
                return 0.5;
            }
            return (value - min) / (max - min);
        }
    }

    private record Factor(String name, double quality, int weight) {}

    public RecommendationResponse recommend(Preferences prefs, int limit) {
        Preferences p = normalizePreferences(prefs);
        List<Car> all = carRepository.findAll();

        List<Car> eligible = all.stream().filter(c -> passesFilters(c, p)).toList();
        List<ScoredCar> scored = eligible.stream()
                .map(c -> scoreCar(c, p, all))
                .sorted(Comparator.comparingInt(ScoredCar::score).reversed())
                .limit(limit)
                .toList();

        return new RecommendationResponse(scored, eligible.size(), eligible.isEmpty());
    }

    private boolean passesFilters(Car car, Preferences p) {
        if (car.getPriceLakh() > p.budgetMaxLakh()) return false;
        if (car.getPriceLakh() < p.budgetMinLakh()) return false;
        if (car.getSeating() < p.minSeating()) return false;
        if (!p.bodyTypes().isEmpty() && !p.bodyTypes().contains(car.getBodyType())) return false;
        if (!p.fuelTypes().isEmpty() && !p.fuelTypes().contains(car.getFuelType())) return false;
        return true;
    }

    private ScoredCar scoreCar(Car car, Preferences p, List<Car> all) {
        var pr = p.priorities();

        // Cheaper-within-budget scores higher, so "value" rewards not overspending.
        double budgetSpan = Math.max(p.budgetMaxLakh() - p.budgetMinLakh(), 1);
        double valueQuality = clamp01((p.budgetMaxLakh() - car.getPriceLakh()) / budgetSpan);

        List<Factor> factors = List.of(
                new Factor("value", valueQuality, pr.value()),
                new Factor("mileage", efficiencyScore(car, all), pr.mileage()),
                new Factor("safety", car.getSafetyStars() / 5.0, pr.safety()),
                new Factor("space", rangeOf(all, Car::getBootLitres).normalize(car.getBootLitres()), pr.space()),
                new Factor("performance", rangeOf(all, Car::getPowerBhp).normalize(car.getPowerBhp()), pr.performance()),
                new Factor("features", rangeOf(all, c -> c.getFeatures().size()).normalize(car.getFeatures().size()), pr.features())
        );

        int totalWeight = Math.max(factors.stream().mapToInt(Factor::weight).sum(), 1);

        List<FactorContribution> breakdown = new ArrayList<>(factors.stream()
                .map(f -> new FactorContribution(f.name(),
                        (int) Math.round(f.quality() * f.weight() * 100.0 / totalWeight)))
                .sorted(Comparator.comparingInt(FactorContribution::contribution).reversed())
                .toList());

        int score = (int) Math.round(
                factors.stream().mapToDouble(f -> f.quality() * f.weight()).sum() * (100.0 / totalWeight));

        return new ScoredCar(car, score, breakdown, buildReasons(car, p, factors));
    }

    /**
     * Mileage lives on wildly different scales across fuel types (24 km/l petrol
     * vs 465 km/charge EV), so we score efficiency relative to same-fuel peers.
     */
    private double efficiencyScore(Car car, List<Car> all) {
        List<Car> peers = all.stream().filter(c -> c.getFuelType() == car.getFuelType()).toList();
        Range range = rangeOf(peers, Car::getMileage);
        return range.normalize(car.getMileage());
    }

    private List<MatchReason> buildReasons(Car car, Preferences p, List<Factor> factors) {
        List<MatchReason> reasons = new ArrayList<>();

        factors.stream()
                .filter(f -> f.weight() > 0 && f.quality() >= 0.6)
                .sorted(Comparator.comparingDouble((Factor f) -> f.weight() * f.quality()).reversed())
                .limit(3)
                .forEach(f -> reasons.add(MatchReason.positive(reasonLabel(f.name(), car))));

        if (p.priorities().safety() >= 2 && car.getSafetyStars() <= 2) {
            reasons.add(MatchReason.caution(car.getSafetyStars() == 0
                    ? "Not crash-tested — a real trade-off given you care about safety"
                    : "Only " + car.getSafetyStars() + "-star safety — worth weighing against the rest"));
        }

        if (reasons.isEmpty()) {
            reasons.add(MatchReason.neutral(car.getBlurb()));
        }
        return reasons;
    }

    private String reasonLabel(String factor, Car car) {
        return switch (factor) {
            case "value" -> "Priced ₹" + trim(car.getPriceLakh()) + "L — comfortably inside your budget";
            case "mileage" -> car.getFuelType() == FuelType.ELECTRIC
                    ? "Strong " + trim(car.getMileage()) + " km range for the segment"
                    : "Strong " + trim(car.getMileage()) + " km/l economy for the segment";
            case "safety" -> car.getSafetyStars() + "-star crash safety";
            case "space" -> "Big " + car.getBootLitres() + "L boot";
            case "performance" -> "Punchy " + car.getPowerBhp() + " bhp";
            case "features" -> "Loaded: " + String.join(", ",
                    car.getFeatures().subList(0, Math.min(2, car.getFeatures().size())));
            default -> car.getBlurb();
        };
    }

    // --- helpers ---

    private static Preferences normalizePreferences(Preferences in) {
        double min = Math.max(0, in.budgetMinLakh() == null ? 0 : in.budgetMinLakh());
        double max = in.budgetMaxLakh() == null ? 30 : in.budgetMaxLakh();
        if (max < min + 1) {
            max = min + 1;
        }
        int seats = in.minSeating() == null ? 5 : Math.max(2, Math.min(7, in.minSeating()));
        var pr = in.priorities() == null
                ? new Preferences.Priorities(2, 2, 2, 1, 1, 1)
                : new Preferences.Priorities(
                        clampWeight(in.priorities().value()),
                        clampWeight(in.priorities().mileage()),
                        clampWeight(in.priorities().safety()),
                        clampWeight(in.priorities().space()),
                        clampWeight(in.priorities().performance()),
                        clampWeight(in.priorities().features()));
        return new Preferences(
                min, max,
                in.bodyTypes() == null ? List.of() : in.bodyTypes(),
                in.fuelTypes() == null ? List.of() : in.fuelTypes(),
                seats, pr);
    }

    private static int clampWeight(int w) {
        return Math.max(0, Math.min(3, w));
    }

    private static Range rangeOf(List<Car> cars, java.util.function.ToDoubleFunction<Car> fn) {
        double min = cars.stream().mapToDouble(fn).min().orElse(0);
        double max = cars.stream().mapToDouble(fn).max().orElse(1);
        return new Range(min, max);
    }

    private static double clamp01(double n) {
        return Math.max(0, Math.min(1, n));
    }

    private static String trim(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }
}
