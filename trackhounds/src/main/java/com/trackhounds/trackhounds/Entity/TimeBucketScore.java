package com.trackhounds.trackhounds.Entity;

/**
 * Read-only view of a cross and the scoring interval it fell into. Kept for
 * callers (and tests) that used to read the old join table; the data now lives
 * on {@link Score} itself.
 */
public final class TimeBucketScore {

  private final int timeBucket;
  private final Score score;

  public TimeBucketScore(int timeBucket, Score score) {
    this.timeBucket = timeBucket;
    this.score = score;
  }

  public int getTimeBucket() {
    return timeBucket;
  }

  public Score getScore() {
    return score;
  }
}
