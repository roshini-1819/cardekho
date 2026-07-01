package com.cardekho.carmatch.service;

import com.cardekho.carmatch.domain.SavedShortlist;
import com.cardekho.carmatch.dto.SaveShortlistRequest;
import com.cardekho.carmatch.repo.CarRepository;
import com.cardekho.carmatch.repo.ShortlistRepository;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ShortlistService {

    private final ShortlistRepository shortlistRepository;
    private final CarRepository carRepository;

    public ShortlistService(ShortlistRepository shortlistRepository, CarRepository carRepository) {
        this.shortlistRepository = shortlistRepository;
        this.carRepository = carRepository;
    }

    public List<SavedShortlist> list() {
        return shortlistRepository.findAllByOrderByCreatedAtDesc();
    }

    public SavedShortlist save(SaveShortlistRequest request) {
        Set<String> validIds = carRepository.findAll().stream()
                .map(c -> c.getId())
                .collect(Collectors.toSet());

        List<String> carIds = request.carIds().stream()
                .filter(validIds::contains)
                .distinct()
                .toList();

        if (carIds.isEmpty()) {
            throw new IllegalArgumentException("None of the provided car ids exist");
        }

        String label = request.label() == null || request.label().isBlank()
                ? "My shortlist"
                : request.label().trim();

        SavedShortlist shortlist = new SavedShortlist(
                "sl_" + Long.toString(System.currentTimeMillis(), 36),
                Instant.now(), label, carIds);
        return shortlistRepository.save(shortlist);
    }

    public void delete(String id) {
        shortlistRepository.deleteById(id);
    }
}
