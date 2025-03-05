package com.trackhounds.trackhounds.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Days;

/**
 * Repository for Days
 */
public interface DaysRepository extends JpaRepository<Days, Integer> {

    Optional<Days> findByDay(int day);

}
