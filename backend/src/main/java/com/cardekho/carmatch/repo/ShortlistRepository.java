package com.cardekho.carmatch.repo;

import com.cardekho.carmatch.domain.SavedShortlist;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShortlistRepository extends JpaRepository<SavedShortlist, String> {
    List<SavedShortlist> findAllByOrderByCreatedAtDesc();
}
