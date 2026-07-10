package com.getmytix.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class CreateEventRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String venue;

    @NotNull
    @Future
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private LocalDateTime eventDate;

    private String description;

    @Size(max = 512)
    private String imageUrl;

    @Min(1)
    @Max(500000)
    private int totalSeats = 100;

    public CreateEventRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }
}
