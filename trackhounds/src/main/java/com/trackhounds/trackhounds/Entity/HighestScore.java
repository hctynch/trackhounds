package com.trackhounds.trackhounds.Entity;

/**
 * Read-only view of a counted cross (the dog's highest in its scoring
 * interval). Kept for callers (and tests) that used to read the old join
 * table; the data now lives on {@link Score#isCounted()}.
 */
public final class HighestScore {

  private final int timeBucket;
  private final Score score;

  public HighestScore(int timeBucket, Score score) {
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
