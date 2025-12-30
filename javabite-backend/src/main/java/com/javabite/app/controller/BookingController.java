package com.javabite.app.controller;

import com.javabite.app.model.BookingStatus;
import com.javabite.app.model.TableBooking;
import com.javabite.app.payload.ApiResponse;
import com.javabite.app.payload.CreateBookingRequest;
import com.javabite.app.service.CustomUserDetails;
import com.javabite.app.service.TableBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class BookingController {

    private final TableBookingService bookingService;

    // ==================== CUSTOMER ENDPOINTS ====================
    // ✅ CRITICAL: All specific paths MUST come BEFORE /{bookingId}

    /**
     * Create a new table booking
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            TableBooking booking = bookingService.createBooking(userDetails.getId(), request);
            log.info("✅ Booking created: #{} for customer {}", booking.getId(), userDetails.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);
        } catch (RuntimeException e) {
            log.error("❌ Failed to create booking: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get customer's bookings
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<TableBooking> bookings = bookingService.getCustomerBookings(userDetails.getId());
            return ResponseEntity.ok(bookings);
        } catch (RuntimeException e) {
            log.error("❌ Failed to fetch bookings: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * ✅ MOVED UP: Get available tables for specific date and time
     * MUST be before /{bookingId} to avoid route conflict
     */
    @GetMapping("/available-tables")
    public ResponseEntity<?> getAvailableTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String time) {
        try {
            log.info("📡 Checking available tables for {} at {}", date, time);

            List<Integer> availableTables = bookingService.getAvailableTablesForSlot(date, time);

            log.info("✅ Found {} available tables", availableTables.size());

            return ResponseEntity.ok(Map.of(
                    "date", date,
                    "time", time,
                    "availableTables", availableTables,
                    "totalTables", 20
            ));
        } catch (Exception e) {
            log.error("❌ Failed to fetch available tables: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to check availability: " + e.getMessage()));
        }
    }

    /**
     * Check availability for specific date and time (legacy endpoint)
     */
    @GetMapping("/check-availability")
    public ResponseEntity<?> checkAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String time) {
        try {
            boolean isAvailable = bookingService.isSlotAvailable(date, LocalTime.parse(time));
            return ResponseEntity.ok(Map.of(
                    "available", isAvailable,
                    "date", date,
                    "time", time
            ));
        } catch (Exception e) {
            log.error("❌ Failed to check availability: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * ✅ MOVED DOWN: Get booking by ID
     * Path variable routes MUST come AFTER all specific paths
     */
    @GetMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getBooking(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            TableBooking booking = bookingService.getBookingById(bookingId);

            // Check authorization (customer can only see their own, admin/staff can see all)
            if (!userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                            a.getAuthority().equals("ROLE_CHEF") ||
                            a.getAuthority().equals("ROLE_WAITER")) &&
                    !booking.getCustomer().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Access denied"));
            }

            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Cancel booking - Works for both CUSTOMER and ADMIN
     */
    @PutMapping("/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // ✅ FIX: Check if user is actually an admin
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            TableBooking booking = bookingService.cancelBooking(
                    bookingId,
                    userDetails.getId(),
                    isAdmin  // ✅ Pass actual admin status
            );

            log.info("✅ Booking #{} cancelled by {}", bookingId, isAdmin ? "admin" : "customer");
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            log.error("❌ Failed to cancel booking: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }


    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all bookings (admin view)
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookings() {
        try {
            List<TableBooking> bookings = bookingService.getAllBookings();
            log.info("✅ Retrieved {} bookings", bookings.size());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("❌ Failed to fetch all bookings: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get bookings by status
     */
    @GetMapping("/admin/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBookingsByStatus(@PathVariable String status) {
        try {
            BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
            List<TableBooking> bookings = bookingService.getBookingsByStatus(bookingStatus);
            return ResponseEntity.ok(bookings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid status: " + status));
        } catch (Exception e) {
            log.error("❌ Failed to fetch bookings by status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get bookings by date
     */
    @GetMapping("/admin/date/{date}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBookingsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<TableBooking> bookings = bookingService.getBookingsForDate(date);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("❌ Failed to fetch bookings by date: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Update booking status (admin)
     */
    @PutMapping("/admin/{bookingId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            if (statusStr == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Status is required"));
            }

            BookingStatus status = BookingStatus.valueOf(statusStr.toUpperCase());
            TableBooking booking = bookingService.updateBookingStatus(bookingId, status);

            log.info("✅ Booking #{} status updated to {}", bookingId, status);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid status"));
        } catch (RuntimeException e) {
            log.error("❌ Failed to update booking status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get booking statistics
     */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBookingStats() {
        try {
            Map<String, Object> stats = bookingService.getBookingStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ Failed to fetch booking stats: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}