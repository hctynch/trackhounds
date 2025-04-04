package com.trackhounds.trackhounds.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Service.HuntService;

/**
 * Controller for the hunts. This class is used to handle the requests for the
 * hunts.
 */
@RestController
@RequestMapping("/api/hunt")
public class HuntController {
    /**
     * The service for the hunts.
     */
    @Autowired
    private HuntService huntService;

    /**
     * Get the current hunt
     * 
     * @return Current Hunt
     */
    @GetMapping()
    public HuntEntity getHunt() {
        return huntService.getHunt();
    }

    /**
     * Post a new hunt
     * 
     * @param entity Hunt entity to post
     * @return the newly posted hunt
     */
    @PostMapping()
    public HuntEntity postHunt(@RequestBody HuntEntity entity) {
        return huntService.createHunt(entity);
    }

    /**
     * Edit the current hunt
     * 
     * @param entity Hunt entity to edit to
     * @return the newly edited hunt
     */
    @PutMapping()
    public HuntEntity editHunt(@RequestBody HuntEntity entity) {
        return huntService.editHunt(entity);
    }

}
