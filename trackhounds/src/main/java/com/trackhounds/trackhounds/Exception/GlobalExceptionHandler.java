package com.trackhounds.trackhounds.Exception;

import java.time.LocalDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Handles global errors.
 */
@ControllerAdvice
@RestControllerAdvice
public class GlobalExceptionHandler {

	/**
	 * Handles API exceptions.
	 * 
	 * @param exception  Exception type
	 * @param webRequest Web request
	 * @return Response entity with error details and status
	 */
	@ExceptionHandler(TrackHoundsAPIException.class)
	public ResponseEntity<ErrorDetails> handleAPIException(final TrackHoundsAPIException exception,
			final WebRequest webRequest) {
		final ErrorDetails errorDetails = new ErrorDetails(
				LocalDateTime.now(),
				exception.getMessage(),
				webRequest.getDescription(false),
				exception.getFields());

		return new ResponseEntity<>(errorDetails, exception.getStatus());
	}
}
