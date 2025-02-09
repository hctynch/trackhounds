package com.trackhounds.trackhounds.Exception;

import java.time.LocalDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

/**
 * Handles global errors.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(TrackHoundsAPIException.class)
	public ResponseEntity<ErrorDetails> handleAPIException(final TrackHoundsAPIException exception, final WebRequest webRequest) {
		final ErrorDetails errorDetails = new ErrorDetails(
				LocalDateTime.now(),
				exception.getMessage(),
				webRequest.getDescription(false),
				exception.getFields()
				);

		return new ResponseEntity<>(errorDetails, exception.getStatus());
	}
}
