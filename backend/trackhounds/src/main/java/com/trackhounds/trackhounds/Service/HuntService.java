package com.trackhounds.trackhounds.Service;

import org.springframework.stereotype.Service;

import com.trackhounds.trackhounds.Repository.HuntRepository;

import lombok.AllArgsConstructor;

/**
 * Service class for Hunt's. This class is used to interact with the database.
 */
@Service
@AllArgsConstructor
public class HuntService {
    /**
     * The repository for the hunts.
     */
    private HuntRepository huntRepository;
}
