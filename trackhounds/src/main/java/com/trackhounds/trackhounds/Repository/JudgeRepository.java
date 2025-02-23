package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.JudgeEntity;

/**
 * Repository for the judges.
 */
public interface JudgeRepository extends JpaRepository<JudgeEntity, Integer> {

}
