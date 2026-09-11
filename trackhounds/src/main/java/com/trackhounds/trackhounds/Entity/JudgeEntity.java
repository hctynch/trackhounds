package com.trackhounds.trackhounds.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
/**
 * Entity class for Judge's. This class is used to store the information of a
 * judge in the database.
 */
public class JudgeEntity {
    /**
     * The number of the judge.
     */
    @Id
    private int number;

    /**
     * The member pin of the judge.
     */
    private String memberPin;

    /**
     * The name of the judge.
     */
    private String name;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof JudgeEntity)) {
            return false;
        }
        JudgeEntity judge = (JudgeEntity) o;
        // The number is the identity; the PIN is optional and must not be dereferenced.
        return judge.getNumber() == this.getNumber();
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(number);
    }
}
