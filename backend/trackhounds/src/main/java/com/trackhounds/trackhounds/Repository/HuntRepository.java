package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.HuntEntity;

/**
 * Repository for the hunts.
 */
public interface HuntRepository extends JpaRepository<HuntEntity, Long> {

}
