package com.trackhounds.trackhounds;

import java.time.LocalTime;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * Gson Class with LocalTimeAdapter
 */
public class GsonUtil {
  public static final Gson GSON = new GsonBuilder()
      .registerTypeAdapter(LocalTime.class, new LocalTimeAdapter())
      .create();
}
