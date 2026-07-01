package com.cardekho.carmatch.web;

import com.cardekho.carmatch.domain.SavedShortlist;
import com.cardekho.carmatch.dto.SaveShortlistRequest;
import com.cardekho.carmatch.service.ShortlistService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shortlists")
public class ShortlistController {

    private final ShortlistService shortlistService;

    public ShortlistController(ShortlistService shortlistService) {
        this.shortlistService = shortlistService;
    }

    @GetMapping
    public List<SavedShortlist> list() {
        return shortlistService.list();
    }

    @PostMapping
    public ResponseEntity<SavedShortlist> save(@Valid @RequestBody SaveShortlistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shortlistService.save(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        shortlistService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
