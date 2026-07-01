package com.cardekho.carmatch.repo;

import com.cardekho.carmatch.domain.Car;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarRepository extends JpaRepository<Car, String> {
}
