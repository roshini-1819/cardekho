package com.cardekho.carmatch.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;

/** A shortlist the buyer chose to save. */
@Entity
@Table(name = "shortlists")
public class SavedShortlist {

    @Id
    private String id;

    private Instant createdAt;
    private String label;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shortlist_cars", joinColumns = @JoinColumn(name = "shortlist_id"))
    @OrderColumn(name = "position")
    @Column(name = "car_id")
    private List<String> carIds;

    protected SavedShortlist() {
        // for JPA
    }

    public SavedShortlist(String id, Instant createdAt, String label, List<String> carIds) {
        this.id = id;
        this.createdAt = createdAt;
        this.label = label;
        this.carIds = carIds;
    }

    public String getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public String getLabel() { return label; }
    public List<String> getCarIds() { return carIds; }
}
