package com.trackhounds.trackhounds.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Award;

/**
 * Repository for special awards.
 */
public interface AwardRepository extends JpaRepository<Award, Long> {

  List<Award> findByDogNumber(String dogNumber);
}
