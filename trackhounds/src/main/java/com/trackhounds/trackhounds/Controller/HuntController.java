package com.trackhounds.trackhounds.Controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    private HuntService huntService;
}
