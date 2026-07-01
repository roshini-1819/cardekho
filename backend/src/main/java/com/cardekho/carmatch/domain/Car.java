package com.cardekho.carmatch.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.List;

/**
 * A car in the catalogue. Persisted in H2 and seeded from cars.json on startup.
 */
@Entity
@Table(name = "cars")
public class Car {

    @Id
    private String id;

    private String make;
    private String model;
    private String variant;

    /** Ex-showroom-ish price in INR lakh. */
    private double priceLakh;

    @Enumerated(EnumType.STRING)
    private BodyType bodyType;

    @Enumerated(EnumType.STRING)
    private FuelType fuelType;

    @Enumerated(EnumType.STRING)
    private Transmission transmission;

    /** km/l for combustion, km/kg for CNG, km/charge for EVs. */
    private double mileage;

    /** Global NCAP safety rating, 0-5 stars. */
    private int safetyStars;

    private int seating;
    private int bootLitres;
    private int powerBhp;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "car_features", joinColumns = @JoinColumn(name = "car_id"))
    @Column(name = "feature")
    private List<String> features;

    private String blurb;

    protected Car() {
        // for JPA
    }

    @JsonCreator
    public Car(@JsonProperty("id") String id,
               @JsonProperty("make") String make,
               @JsonProperty("model") String model,
               @JsonProperty("variant") String variant,
               @JsonProperty("priceLakh") double priceLakh,
               @JsonProperty("bodyType") BodyType bodyType,
               @JsonProperty("fuelType") FuelType fuelType,
               @JsonProperty("transmission") Transmission transmission,
               @JsonProperty("mileage") double mileage,
               @JsonProperty("safetyStars") int safetyStars,
               @JsonProperty("seating") int seating,
               @JsonProperty("bootLitres") int bootLitres,
               @JsonProperty("powerBhp") int powerBhp,
               @JsonProperty("features") List<String> features,
               @JsonProperty("blurb") String blurb) {
        this.id = id;
        this.make = make;
        this.model = model;
        this.variant = variant;
        this.priceLakh = priceLakh;
        this.bodyType = bodyType;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.mileage = mileage;
        this.safetyStars = safetyStars;
        this.seating = seating;
        this.bootLitres = bootLitres;
        this.powerBhp = powerBhp;
        this.features = features;
        this.blurb = blurb;
    }

    public String getId() { return id; }
    public String getMake() { return make; }
    public String getModel() { return model; }
    public String getVariant() { return variant; }
    public double getPriceLakh() { return priceLakh; }
    public BodyType getBodyType() { return bodyType; }
    public FuelType getFuelType() { return fuelType; }
    public Transmission getTransmission() { return transmission; }
    public double getMileage() { return mileage; }
    public int getSafetyStars() { return safetyStars; }
    public int getSeating() { return seating; }
    public int getBootLitres() { return bootLitres; }
    public int getPowerBhp() { return powerBhp; }
    public List<String> getFeatures() { return features; }
    public String getBlurb() { return blurb; }
}
