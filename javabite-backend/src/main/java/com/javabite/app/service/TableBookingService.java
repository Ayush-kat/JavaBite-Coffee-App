package com.javabite.app.service;

import com.javabite.app.model.BookingStatus;
import com.javabite.app.model.TableBooking;
import com.javabite.app.model.User;
import com.javabite.app.payload.CreateBookingRequest;
import com.javabite.app.repository.TableBookingRepository;
import com.javabite.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TableBookingService {

    private final TableBookingRepository bookingRepository;
    private final UserRepository userRepository;

    private static final int TOTAL_TABLES = 20;

    // ==================== BOOKING CREATION ====================

    /**
     * ✅ FIXED: Create a new table booking with duplicate prevention
     */
    @Transactional
    public TableBooking createBooking(Long customerId, CreateBookingRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ✅ CRITICAL FIX: Check for duplicate booking BEFORE creating
        // Use optimized query instead of loading all bookings
        List<TableBooking> existingBookings = bookingRepository.findByBookingDate(request.getBookingDate());

        boolean isDuplicate = existingBookings.stream()
                .anyMatch(b ->
                        b.getTableNumber().equals(request.getTableNumber()) &&
                                b.getBookingTime().equals(request.getBookingTime()) &&
                                (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.ACTIVE)
                );

        if (isDuplicate) {
            log.error("❌ Duplicate booking attempt - Table {} already booked for {} at {}",
                    request.getTableNumber(), request.getBookingDate(), request.getBookingTime());
            throw new RuntimeException(
                    String.format("Table %d is already booked for %s at %s. Please select a different table or time.",
                            request.getTableNumber(), request.getBookingDate(), request.getBookingTime())
            );
        }

        // Double-check availability using optimized method
        if (!isTableAvailable(request.getTableNumber(), request.getBookingDate(), request.getBookingTime())) {
            throw new RuntimeException(
                    String.format("Table %d is not available for the selected time. Please refresh and try again.",
                            request.getTableNumber())
            );
        }

        TableBooking booking = TableBooking.builder()
                .customer(customer)
                .user(customer)
                .bookingDate(request.getBookingDate())
                .bookingTime(request.getBookingTime())
                .numberOfGuests(request.getNumberOfGuests())
                .tableNumber(request.getTableNumber())
                .specialRequests(request.getSpecialRequests())
                .status(BookingStatus.CONFIRMED)
                .build();

        TableBooking savedBooking = bookingRepository.save(booking);
        log.info("✅ Booking created: #{} for customer {} at table {} on {} at {}",
                savedBooking.getId(), customer.getEmail(), request.getTableNumber(),
                request.getBookingDate(), request.getBookingTime());

        return savedBooking;
    }

    // ==================== AVAILABILITY CHECKING ====================

    /**
     * ✅ FIXED: Get available tables for a specific date and time slot
     * Optimized to only fetch bookings for specific date
     */
    public List<Integer> getAvailableTablesForSlot(LocalDate date, String time) {
        log.info("🔍 Checking availability for date: {}, time: {}", date, time);

        // All table numbers
        List<Integer> allTables = new ArrayList<>();
        for (int i = 1; i <= TOTAL_TABLES; i++) {
            allTables.add(i);
        }

        // ✅ FIXED: Only get bookings for this specific date (optimized)
        List<TableBooking> bookingsForDate = bookingRepository.findByBookingDate(date);

        // Filter for specific time and active statuses
        Set<Integer> bookedTables = bookingsForDate.stream()
                .filter(b -> b.getBookingTime().equals(time))
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.ACTIVE)
                .map(TableBooking::getTableNumber)
                .collect(Collectors.toSet());

        log.info("📊 Date: {}, Time: {} - Booked tables: {}", date, time, bookedTables);

        // Return available tables (all tables minus booked tables)
        List<Integer> availableTables = allTables.stream()
                .filter(table -> !bookedTables.contains(table))
                .collect(Collectors.toList());

        log.info("✅ Available tables: {} out of {}", availableTables.size(), TOTAL_TABLES);

        return availableTables;
    }

    /**
     * ✅ FIXED: Check if a specific table is available for a date/time slot
     * Optimized to only query specific date
     */
    public boolean isTableAvailable(Integer tableNumber, LocalDate date, String time) {
        // Only get bookings for this specific date
        List<TableBooking> bookingsForDate = bookingRepository.findByBookingDate(date);

        // Check if this specific table has an active booking for this time
        boolean isBooked = bookingsForDate.stream()
                .anyMatch(b ->
                        b.getTableNumber().equals(tableNumber) &&
                                b.getBookingTime().equals(time) &&
                                (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.ACTIVE)
                );

        return !isBooked;
    }

    /**
     * Check if any table is available for a date/time slot
     */
    public boolean isSlotAvailable(LocalDate date, LocalTime time) {
        Long bookedCount = bookingRepository.countBookingsForSlot(date, time.toString());
        return bookedCount < TOTAL_TABLES;
    }

    // ==================== CUSTOMER METHODS ====================

    /**
     * Get customer's bookings
     */
    public List<TableBooking> getCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomer_IdOrderByBookingDateDescBookingTimeDesc(customerId);
    }

    /**
     * Cancel booking
     */
    @Transactional
    public TableBooking cancelBooking(Long bookingId, Long userId, boolean isAdmin) {
        TableBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!isAdmin && !booking.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed bookings");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());

        TableBooking savedBooking = bookingRepository.save(booking);
        log.info("✅ Booking #{} cancelled", bookingId);

        return savedBooking;
    }

    // ==================== ADMIN METHODS ====================

    public List<TableBooking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<TableBooking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    public List<TableBooking> getBookingsForDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date);
    }

    public TableBooking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    @Transactional
    public TableBooking updateBookingStatus(Long bookingId, BookingStatus newStatus) {
        TableBooking booking = getBookingById(bookingId);
        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.CANCELLED) {
            booking.setCancelledAt(java.time.LocalDateTime.now());
        }

        TableBooking savedBooking = bookingRepository.save(booking);
        log.info("✅ Booking #{} status updated to {}", bookingId, newStatus);

        return savedBooking;
    }

    public Map<String, Object> getBookingStats() {
        Map<String, Object> stats = new HashMap<>();

        // Use count queries instead of loading all bookings
        stats.put("totalBookings", bookingRepository.count());
        stats.put("confirmedBookings", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.put("activeBookings", bookingRepository.countByStatus(BookingStatus.ACTIVE));
        stats.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));
        stats.put("cancelledBookings", bookingRepository.countByStatus(BookingStatus.CANCELLED));

        // Today's bookings - only load today's data
        LocalDate today = LocalDate.now();
        List<TableBooking> todayBookings = bookingRepository.findByBookingDate(today);
        stats.put("todayBookings", (long) todayBookings.size());

        return stats;
    }

    /**
     * Cancel booking by admin (no ownership check)
     */
    @Transactional
    public TableBooking cancelBookingAdmin(Long bookingId) {
        TableBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed bookings");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());

        TableBooking savedBooking = bookingRepository.save(booking);
        log.info("✅ Admin cancelled Booking #{}", bookingId);

        return savedBooking;
    }
}