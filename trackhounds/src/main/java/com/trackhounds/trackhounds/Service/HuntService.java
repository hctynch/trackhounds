package com.trackhounds.trackhounds.Service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.HuntRepository;

import lombok.AllArgsConstructor;

/**
 * Service class for Hunt's. This class is used to interact with the database.
 */
@Service
@Transactional
@AllArgsConstructor
public class HuntService {
    /**
     * The repository for the hunts.
     */
    @Autowired
    private HuntRepository huntRepository;

    @Autowired
    private DogService dogService;

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
        if (hunt.getPointStep() < 0) {
            errs.put("pointStep", "The point step cannot be negative.");
        }
        validateDaysAndPoints(hunt, errs);
        int[] stakeRange = hunt.getStakeRange();
        for (int i = 1; i < 4; i++) {
            if (stakeRange[i] < stakeRange[i - 1])
                errs.put(String.format("startingNumber%d", i + 1), "Value cannot be less than previous.");
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
    /** Maximum number of days a hunt can have. */
    public static final int MAX_DAYS = 4;

    private void validateDaysAndPoints(HuntEntity hunt, Map<String, String> errs) {
        if (hunt.getHuntDays() < 1 || hunt.getHuntDays() > MAX_DAYS) {
            errs.put("huntDays", "A hunt has between 1 and " + MAX_DAYS + " days.");
        }
        if (hunt.getFirstDogPoints() < 0) {
            errs.put("firstDogPoints", "The first-dog points cannot be negative.");
        }
    }

    private void clearOldHunt() {
        huntRepository.deleteAll();
        dogService.clear();
    }

    /**
     * Return the current hunt.
     * 
     * @throws TrackHoundsAPIException if no current hunt exists
     * @return current hunt.
     */
    public HuntEntity getHunt() {
        if (huntRepository.count() == 0) {
            throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "No hunt has been created yet.",
                    Map.of("hunt", "Create a hunt from the Home page to get started."));
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
    public HuntEntity editHunt(HuntEntity entity) {
        if (huntRepository.count() == 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "No Hunt has been created to edit.", null);
        Map<String, String> errs = new HashMap<>();
        if (entity.getTitle() == null || entity.getTitle().isEmpty()) {
            errs.put("title", "Title cannot be empty.");
        }
        if (entity.getHuntInterval() < 0) {
            errs.put("interval", "Interval must be greater than 0.");
        }
        if (entity.getPointStep() < 0) {
            errs.put("pointStep", "The point step cannot be negative.");
        }
        validateDaysAndPoints(entity, errs);
        int[] stakeRange = entity.getStakeRange();
        for (int i = 1; i < 4; i++) {
            if (stakeRange[i] < stakeRange[i - 1])
                errs.put(String.format("startingNumber%d", i + 1), "Value cannot be less than previous.");
        }
        if (errs.size() > 0)
            throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Edit Fields", errs);
        HuntEntity hunt = huntRepository.findAll().get(0);
        hunt.setTitle(entity.getTitle());
        hunt.setDates(entity.getDates());
        hunt.setStake(entity.getStake());
        hunt.setHuntInterval(entity.getHuntInterval());
        hunt.setPointStep(entity.getPointStep());
        hunt.setFirstDogPoints(entity.getFirstDogPoints());
        hunt.setHuntDays(entity.getHuntDays());
        hunt.setStakeRange(entity.getStakeRange());
        hunt.setStakeTypeRange(entity.getStakeTypeRange());
        return huntRepository.save(hunt);
    }
}
