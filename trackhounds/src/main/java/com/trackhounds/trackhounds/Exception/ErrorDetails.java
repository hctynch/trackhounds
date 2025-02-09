package com.trackhounds.trackhounds.Exception;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Provides details on errors.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ErrorDetails {
	/** Field representing the date and time of the error */
	private LocalDateTime timeStamp;
	/** Field representing the message of the error */
	private String message;
	/** Field representing the details of the error */
	private String details;
	/**
	 * Map representing the frontend fields that have errors. (Key: field, Value:
	 * message)
	 */
	private Map<String, String> fields;
}