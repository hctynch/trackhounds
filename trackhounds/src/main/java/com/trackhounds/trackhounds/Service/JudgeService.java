package com.trackhounds.trackhounds.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
/**
 * Service class for Judges. This class is used to interact with the database.
 */
public class JudgeService {
    /**
     * The repository for the judges.
     */
    @Autowired
    private JudgeRepository judgeRepository;

    /**
     * Get all judges from the database.
     * 
     * @return List of all judges
     */
    public List<JudgeEntity> getAllJudges() {
        return judgeRepository.findAll();
    }

    /**
     * Add a new judge to the database.
     * 
     * @param judge Judge to add
     * @return newly created Judge
     */
    public JudgeEntity addJudge(JudgeEntity judge) {
        Map<String, String> errs = new HashMap<String, String>();
        if (judge.getNumber() < 0) {
            errs.put("number", "Number cannot be negative.");
        }
        if (judge.getNumber() > 0 && judgeRepository.existsById(judge.getNumber())) {
            errs.put("number", "Number already exists.");
        }
        if (judge.getName() == null || judge.getName().isEmpty()) {
            errs.put("name", "Name cannot be empty.");
        }
        if (errs.size() > 0) {
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
        }
        return judgeRepository.save(judge);
    }

    /**
     * Update a judge in the database.
     * 
     * @param judge Judge to update
     * @return updated Judge
     */
    public JudgeEntity updateJudge(JudgeEntity judge) {
        Map<String, String> errs = new HashMap<String, String>();
        JudgeEntity oldJudge = judgeRepository.findById(judge.getNumber())
                .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "Judge not found.",
                        Map.of("number", "Judge not found.")));
        if (judge.getName() == null || judge.getName().isEmpty()) {
            errs.put("name", "Name cannot be empty.");
        }
        if (errs.size() > 0) {
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
        }
        oldJudge.setName(judge.getName());
        oldJudge.setMemberPin(judge.getMemberPin());
        return judgeRepository.save(oldJudge);
    }

    /**
     * Delete a judge from the database.
     * 
     * @param number Number of the judge to delete
     */
    public void deleteJudge(int number) {
        judgeRepository.deleteById(number);
    }

    /**
     * Get the number of judges in the database.
     * 
     * @return number of judges
     */
    public int getJudgeCount() {
        return (int) judgeRepository.count();
    }
}
