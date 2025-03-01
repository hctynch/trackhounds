package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Days;

/**
 * Repository for Days
 */
public interface DaysRepository extends JpaRepository<Days, Integer> {

}
