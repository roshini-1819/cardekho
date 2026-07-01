package com.cardekho.carmatch.domain;

public enum Transmission {
    MANUAL, AUTOMATIC;

    public String display() {
        return switch (this) {
            case MANUAL -> "Manual";
            case AUTOMATIC -> "Automatic";
        };
    }
}
