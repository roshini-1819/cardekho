package com.cardekho.carmatch.config;

import com.cardekho.carmatch.domain.Car;
import com.cardekho.carmatch.repo.CarRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Seeds the car catalogue from cars.json on every startup. Cars are reference
 * data, so we refresh them each boot (dataset edits propagate); saved shortlists
 * persist independently in their own table.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CarRepository carRepository;
    private final ObjectMapper mapper;

    public DataSeeder(CarRepository carRepository, ObjectMapper mapper) {
        this.carRepository = carRepository;
        this.mapper = mapper;
    }

    @Override
    public void run(String... args) throws Exception {
        try (InputStream in = new ClassPathResource("cars.json").getInputStream()) {
            List<Car> cars = mapper.readValue(in, new com.fasterxml.jackson.core.type.TypeReference<List<Car>>() {});
            carRepository.deleteAll();
            carRepository.saveAll(cars);
            log.info("Seeded {} cars into the catalogue", cars.size());
        }
    }
}
