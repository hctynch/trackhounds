package com.trackhounds.trackhounds.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@CrossOrigin("*")
@RequestMapping("/hunt")
public class HuntController {
    /**
     * The service for the hunts.
     */
    @Autowired
    private HuntService huntService;

    @GetMapping()
    public HuntEntity getHunt() {
        return huntService.getHunt();
    }

    @PostMapping()
    public HuntEntity postHunt(@RequestBody HuntEntity entity) {
        return huntService.createHunt(entity);
    }

    @PutMapping()
    public HuntEntity editHunt(@RequestBody Map<String, String> fields) {
        return huntService.editHunt(fields);
    }

    @PutMapping("/stakes")
    public void putStakes(@RequestBody HuntEntity entity) {
        huntService.setStakes(entity);
    }

}
