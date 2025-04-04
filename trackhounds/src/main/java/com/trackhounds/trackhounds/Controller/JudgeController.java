package com.trackhounds.trackhounds.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Service.JudgeService;

/**
 * Controller for the judges. This class is used to handle the requests for the
 * judges.
 */
@RestController
@RequestMapping("/api/judges")
public class JudgeController {

    /**
     * The service for the judges.
     */
    @Autowired
    private JudgeService judgeService;

    /**
     * Get all judges from the database.
     * 
     * @return List of all judges
     */
    @GetMapping
    public List<JudgeEntity> getAllJudges() {
        return judgeService.getAllJudges();
    }

    /**
     * Add a new judge to the database.
     * 
     * @param entity Judge to add
     * @return newly created Judge
     */
    @PostMapping
    public JudgeEntity postJudge(@RequestBody JudgeEntity entity) {
        return judgeService.addJudge(entity);
    }

    /**
     * Delete a judge from the database.
     * 
     * @param number Number of the judge to delete
     */
    @DeleteMapping("/{number}")
    public void deleteJudge(@PathVariable("number") int number) {
        judgeService.deleteJudge(number);
    }

    /**
     * Update a judge in the database.
     * 
     * @param entity Judge to update
     * @return updated Judge
     */
    @PutMapping
    public JudgeEntity updateJudge(@RequestBody JudgeEntity entity) {
        return judgeService.updateJudge(entity);
    }

    /**
     * Get the total number of judges in the database.
     * 
     * @return total number of judges
     */
    @GetMapping("/total")
    public int getJudgeCount() {
        return judgeService.getJudgeCount();
    }

}
