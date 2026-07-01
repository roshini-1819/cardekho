package com.cardekho.carmatch.web;

import com.cardekho.carmatch.domain.Car;
import com.cardekho.carmatch.repo.CarRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cars")
public class CarController {

    private final CarRepository carRepository;

    public CarController(CarRepository carRepository) {
        this.carRepository = carRepository;
    }

    @GetMapping
    public List<Car> all() {
        return carRepository.findAll();
    }
}
