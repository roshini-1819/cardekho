package com.cardekho.carmatch.domain;

public enum BodyType {
    HATCHBACK, SEDAN, SUV, MUV;

    public String display() {
        return switch (this) {
            case HATCHBACK -> "Hatchback";
            case SEDAN -> "Sedan";
            case SUV -> "SUV";
            case MUV -> "MUV";
        };
    }
}
