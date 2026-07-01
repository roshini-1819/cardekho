package com.cardekho.carmatch.dto;

public record MatchReason(String label, Tone tone) {
    public enum Tone { POSITIVE, NEUTRAL, CAUTION }

    public static MatchReason positive(String label) {
        return new MatchReason(label, Tone.POSITIVE);
    }

    public static MatchReason neutral(String label) {
        return new MatchReason(label, Tone.NEUTRAL);
    }

    public static MatchReason caution(String label) {
        return new MatchReason(label, Tone.CAUTION);
    }
}
