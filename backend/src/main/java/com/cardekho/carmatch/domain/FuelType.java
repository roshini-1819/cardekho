package com.cardekho.carmatch.domain;

public enum FuelType {
    PETROL, DIESEL, CNG, HYBRID, ELECTRIC;

    public String display() {
        return switch (this) {
            case PETROL -> "Petrol";
            case DIESEL -> "Diesel";
            case CNG -> "CNG";
            case HYBRID -> "Hybrid";
            case ELECTRIC -> "Electric";
        };
    }
}
