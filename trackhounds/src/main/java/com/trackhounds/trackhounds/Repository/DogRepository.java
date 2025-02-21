package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.DogEntity;

/**
 * Repository for Dogs
 */
public interface DogRepository extends JpaRepository<DogEntity, Integer> {

}
