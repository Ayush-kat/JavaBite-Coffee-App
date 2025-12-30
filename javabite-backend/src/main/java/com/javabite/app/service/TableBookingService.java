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
     * Create a new table booking
     */
    @Transactional
    public TableBooking createBooking(Long customerId, CreateBookingRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Validate table availability
        if (!isTableAvailable(request.getTableNumber(), request.getBookingDate(), request.getBookingTime())) {
            throw new RuntimeException("Table " + request.getTableNumber() + " is not available for the selected time");
        }

        TableBooking booking = TableBooking.builder()
                .customer(customer)
                .user(customer) // ✅ Set both customer and user to same value
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
     * Get available tables for a specific date and time slot
     */
    public List<Integer> getAvailableTablesForSlot(LocalDate date, String time) {
        List<Integer> allTables = new ArrayList<>();
        for (int i = 1; i <= TOTAL_TABLES; i++) {
            allTables.add(i);
        }

        // Get booked tables for this slot
        List<TableBooking> bookedSlots = bookingRepository.findByTableNumberAndBookingDateAndStatus(
                null, date, BookingStatus.CONFIRMED
        );

        Set<Integer> bookedTables = bookedSlots.stream()
                .filter(b -> b.getBookingTime().equals(time))
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.ACTIVE)
                .map(TableBooking::getTableNumber)
                .collect(Collectors.toSet());

        // Return available tables
        return allTables.stream()
                .filter(table -> !bookedTables.contains(table))
                .collect(Collectors.toList());
    }

    /**
     * Check if a specific table is available for a date/time slot
     */
    public boolean isTableAvailable(Integer tableNumber, LocalDate date, String time) {
        List<Integer> availableTables = getAvailableTablesForSlot(date, time);
        return availableTables.contains(tableNumber);
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
        // ✅ FIXED: Use correct repository method name
        return bookingRepository.findByCustomer_IdOrderByBookingDateDescBookingTimeDesc(customerId);
    }

    /**
     * Cancel booking
     */

// ✅ ALSO UPDATE: Regular cancelBooking to allow admin
    @Transactional
    public TableBooking cancelBooking(Long bookingId, Long userId, boolean isAdmin) {
        TableBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ✅ FIX: Allow admin to cancel any booking
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

    /**
     * Get all bookings
     */
    public List<TableBooking> getAllBookings() {
        return bookingRepository.findAll();
    }

    /**
     * Get bookings by status
     */
    public List<TableBooking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    /**
     * Get bookings for a specific date
     */
    public List<TableBooking> getBookingsForDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date);
    }

    /**
     * Get booking by ID
     */
    public TableBooking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    /**
     * Update booking status
     */
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

    /**
     * Get booking statistics
     */
    public Map<String, Object> getBookingStats() {
        List<TableBooking> allBookings = bookingRepository.findAll();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", allBookings.size());
        stats.put("confirmedBookings", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.put("activeBookings", bookingRepository.countByStatus(BookingStatus.ACTIVE));
        stats.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));
        stats.put("cancelledBookings", bookingRepository.countByStatus(BookingStatus.CANCELLED));

        // Today's bookings
        LocalDate today = LocalDate.now();
        long todayBookings = allBookings.stream()
                .filter(b -> b.getBookingDate().equals(today))
                .count();
        stats.put("todayBookings", todayBookings);

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