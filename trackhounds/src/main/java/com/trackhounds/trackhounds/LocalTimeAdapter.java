package com.trackhounds.trackhounds;

import java.lang.reflect.Type;
import java.time.LocalTime;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

/**
 * LocalTimeAdapter for GSON
 */
public class LocalTimeAdapter implements JsonSerializer<LocalTime>, JsonDeserializer<LocalTime> {
  @Override
  public JsonElement serialize(LocalTime time, Type type, JsonSerializationContext context) {
    return new JsonPrimitive(time.toString()); // Converts to "HH:mm:ss"
  }

  @Override
  public LocalTime deserialize(JsonElement json, Type type, JsonDeserializationContext context)
      throws JsonParseException {
    return LocalTime.parse(json.getAsString());
  }
}
