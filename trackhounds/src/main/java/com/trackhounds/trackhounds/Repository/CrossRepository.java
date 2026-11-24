package com.trackhounds.trackhounds.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.CrossEntity;

/**
 * Repository for crosses (one judge's entry at one time on one day).
 */
public interface CrossRepository extends JpaRepository<CrossEntity, Long> {

  /** Every cross in hunt order: by day, then cross time, then order of entry. */
  List<CrossEntity> findAllByOrderByDayAscTimeAscIdAsc();
}
