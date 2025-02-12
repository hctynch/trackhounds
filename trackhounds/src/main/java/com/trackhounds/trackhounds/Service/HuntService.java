package com.trackhounds.trackhounds.Service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
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
    @Autowired
    private HuntRepository huntRepository;

    /**
     * Create a new Hunt, calls clearOldHunt if another Hunt is in the repository.
     * 
     * @param hunt Hunt to create
     * @throws TrackHoundsAPIException if the fields of the new hunt are invalid
     * @return newly created Hunt
     */
    public HuntEntity createHunt(HuntEntity hunt) {
        Map<String, String> errs = new HashMap<String, String>();
        if (hunt.getTitle() == null || hunt.getTitle().isEmpty()) {
            errs.put("title", "Title cannot be empty.");
        }
        if (hunt.getHuntInterval() < 0) {
            errs.put("interval", "Interval cannot be negative.");
        }
        if (errs.size() > 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
        if (huntRepository.count() > 0) {
            clearOldHunt();
        }
        return huntRepository.save(hunt);
    }

    /**
     * Private method used to clear everything neccessary from old hunts.
     */
    private void clearOldHunt() {
        huntRepository.deleteAll();
    }

    /**
     * Return the current hunt.
     * 
     * @throws TrackHoundsAPIException if no current hunt exists
     * @return current hunt.
     */
    public HuntEntity getHunt() {
        if (huntRepository.count() == 0) {
            throw new TrackHoundsAPIException(HttpStatus.CONTINUE, null, null);
        }
        return huntRepository.findAll().get(0);
    }

    /**
     * Update the current hunt using the fields map.
     * 
     * @param fields Map containing the field names and values
     * @throws TrackHoundsAPIException if the edited fields are invalid
     * @return updated Hunt
     */
    public HuntEntity editHunt(Map<String, String> fields) {
        if (huntRepository.count() == 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "No Hunt has been created to edit.", null);
        Map<String, String> errs = new HashMap<>();
        if (fields.containsKey("title")) {
            String title = fields.get("title");
            if (title == null || title.isEmpty())
                errs.put("title", "Title cannot be empty.");
        }
        int interval = -1;
        if (fields.containsKey("interval")) {
            String s_interval = fields.get("interval");
            try {
                interval = Integer.parseInt(s_interval);
                if (interval < 0)
                    errs.put("interval", "Interval must be positive.");
            } catch (Exception e) {
                errs.put("interval", "Interval must be an Integer.");
            }
        }
        if (errs.size() > 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Edit Fields", errs);
        HuntEntity hunt = huntRepository.findAll().get(0);
        if (fields.containsKey("title"))
            hunt.setTitle(fields.get("title"));
        if (fields.containsKey("dates"))
            hunt.setDates(fields.get("dates"));
        if (fields.containsKey("stake")) {
            String s_stake = fields.get("stake");
            StakeType stake = StakeType.ALL_AGE;
            if (s_stake.equalsIgnoreCase("derby"))
                stake = StakeType.DERBY;
            hunt.setStake(stake);
        }
        if (interval >= 0)
            hunt.setHuntInterval(interval);
        return huntRepository.save(hunt);
    }

    /**
     * Set the stakes for the current hunt.
     * 
     * @param stakeTypeRange Stake Type Range
     * @param stakeRange     Stake Range
     * @throws TrackHoundsAPIException if the stake fields are invalid
     */
    @SuppressWarnings("null")
    public void setStakes(HuntEntity huntEntity) {
        Map<String, String> errs = new HashMap<>();
        StakeType[] stakeTypeRange = huntEntity.getStakeTypeRange();
        int[] stakeRange = huntEntity.getStakeRange();
        boolean nullCheck = false;
        if (stakeTypeRange == null) {
            errs.put("stake_type_range", "Value cannot be null.");
            nullCheck = true;
        }
        if (stakeRange == null) {
            errs.put("stake_range", "Value cannot be null.");
            nullCheck = true;
        }
        if (nullCheck)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Stake Fields", errs);
        if (stakeRange[0] < 0)
            errs.put("stake_range_1", "Value must be positive.");
        for (int i = 1; i < stakeRange.length; i++) {
            if (stakeRange[i] < 0) {
                errs.put(String.format("stake_range_%d", i), "Value must be positive.");
            } else if (stakeRange[i] < stakeRange[i - 1]) {
                stakeTypeRange[i] = StakeType.ALL_AGE;
                errs.put(String.format("stake_range_%d", i + 1), "Value must be greater than previous value.");
            }
        }
        if (errs.size() > 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Stake Fields", errs);
        HuntEntity hunt = huntRepository.findAll().get(0);
        hunt.setStakeTypeRange(stakeTypeRange);
        hunt.setStakeRange(stakeRange);
        huntRepository.save(hunt);
    }
}
