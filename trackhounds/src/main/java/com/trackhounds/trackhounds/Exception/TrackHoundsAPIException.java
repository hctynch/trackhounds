package com.trackhounds.trackhounds.Exception;

import java.util.Map;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrackHoundsAPIException extends RuntimeException {

  /** Field representing the serial version UID of the Exception */
	private static final long serialVersionUID = 1L;
	/** Field representing the HttpStatus of the Exception */
	private HttpStatus status;
	/** Field representing the message of the Exception */
	private String message;
	/**
	 * Map representing the frontend fields that have errors. (Key: field, Value:
	 * message)
	 */
	private Map<String, String> fields;
  
}
