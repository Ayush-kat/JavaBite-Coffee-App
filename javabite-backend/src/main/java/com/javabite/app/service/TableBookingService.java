package com.javabite.app.service;

import com.javabite.app.model.BookingStatus;
import com.javabite.app.model.Role;
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

    private static final int MAX_TABLES = 20;
    private static final int MAX_BOOKINGS_PER_SLOT = 10;

    public boolean isSlotAvailable(LocalDate date, LocalTime time) {
        try {
            String timeStr = time.toString();
            Long count = bookingRepository.countBookingsForSlot(date, timeStr);
            log.info("✅ Slot availability check: {} at {} - {} bookings (max: {})",
                    date, timeStr, count, MAX_BOOKINGS_PER_SLOT);
            return count < MAX_BOOKINGS_PER_SLOT;
        } catch (Exception e) {
            log.error("❌ Error checking slot availability: {}", e.getMessage());
            return false;
        }
    }

    public Map<String, Boolean> getAvailableSlots(LocalDate date) {
        List<String> allSlots = Arrays.asList(
                "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
                "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                "20:00", "20:30", "21:00"
        );

        Map<String, Boolean> availability = new HashMap<>();

        for (String timeStr : allSlots) {
            try {
                Long count = bookingRepository.countBookingsForSlot(date, timeStr);
                availability.put(timeStr, count < MAX_BOOKINGS_PER_SLOT);
            } catch (Exception e) {
                log.error("Error checking slot {}: {}", timeStr, e.getMessage());
                availability.put(timeStr, false);
            }
        }

        return availability;
    }

    public List<Integer> getAvailableTablesForSlot(LocalDate date, String time) {
        List<TableBooking> bookedSlots = bookingRepository.findByBookingDate(date).stream()
                .filter(b -> b.getBookingTime().equals(time) &&
                        (b.getStatus() == BookingStatus.CONFIRMED ||
                                b.getStatus() == BookingStatus.ACTIVE))
                .collect(Collectors.toList());

        Set<Integer> bookedTables = bookedSlots.stream()
                .map(TableBooking::getTableNumber)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Integer> availableTables = new ArrayList<>();
        for (int table = 1; table <= MAX_TABLES; table++) {
            if (!bookedTables.contains(table)) {
                availableTables.add(table);
            }
        }

        log.info("✅ Available tables for {} at {}: {} out of {}",
                date, time, availableTables.size(), MAX_TABLES);

        return availableTables;
    }

    @Transactional
    public TableBooking createBooking(Long customerId, CreateBookingRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String bookingTimeStr = request.getBookingTime();

        log.info("📥 Received booking request - TableNumber from request: {}", request.getTableNumber());

        // Check if slot is available
        Long existingCount = bookingRepository.countBookingsForSlot(
                request.getBookingDate(), bookingTimeStr);

        if (existingCount >= MAX_BOOKINGS_PER_SLOT) {
            throw new RuntimeException("This time slot is fully booked. Please choose another time.");
        }

        // Check if customer already has booking for this slot
        List<TableBooking> customerExisting = bookingRepository
                .findByCustomerOrderByBookingDateDescBookingTimeDesc(customer).stream()
                .filter(b -> b.getBookingDate().equals(request.getBookingDate()) &&
                        b.getBookingTime().equals(bookingTimeStr) &&
                        (b.getStatus() == BookingStatus.CONFIRMED ||
                                b.getStatus() == BookingStatus.ACTIVE))
                .collect(Collectors.toList());

        if (!customerExisting.isEmpty()) {
            throw new RuntimeException("You already have a booking for this time slot");
        }

        // ✅✅✅ CRITICAL FIX: Get tableNumber from request FIRST
        Integer tableNumber = request.getTableNumber();

        log.info("🔍 Table number after extraction: {}", tableNumber);

        if (tableNumber != null && tableNumber > 0) {
            // Customer selected a specific table
            log.info("🪑 Customer selected table: {}", tableNumber);

            // Validate that the selected table is actually available
            final Integer selectedTable = tableNumber; // ✅ Make effectively final for lambda
            List<TableBooking> tableBookings = bookingRepository.findByBookingDate(request.getBookingDate()).stream()
                    .filter(b -> b.getBookingTime().equals(bookingTimeStr) &&
                            b.getTableNumber() != null &&
                            b.getTableNumber().equals(selectedTable) &&
                            (b.getStatus() == BookingStatus.CONFIRMED ||
                                    b.getStatus() == BookingStatus.ACTIVE))
                    .collect(Collectors.toList());

            if (!tableBookings.isEmpty()) {
                throw new RuntimeException("Table " + tableNumber + " is already booked for this time slot. Please select another table.");
            }
        } else {
            // No table selected or invalid, auto-assign
            tableNumber = assignTableNumber(request.getBookingDate(), bookingTimeStr);
            log.info("🔄 Auto-assigned table: {}", tableNumber);
        }

        log.info("✅ Final table number to be saved: {}", tableNumber);

        TableBooking booking = TableBooking.builder()
                .customer(customer)
                .bookingDate(request.getBookingDate())
                .bookingTime(bookingTimeStr)
                .numberOfGuests(request.getNumberOfGuests())
                .tableNumber(tableNumber)
                .status(BookingStatus.CONFIRMED)
                .specialRequests(request.getSpecialRequests())
                .build();

        TableBooking saved = bookingRepository.save(booking);
        log.info("✅✅✅ Booking created: #{} for customer: {} - Table {} on {} at {}",
                saved.getId(), customer.getName(), saved.getTableNumber(), request.getBookingDate(), bookingTimeStr);

        return saved;
    }

    private Integer assignTableNumber(LocalDate date, String time) {
        List<TableBooking> bookedSlots = bookingRepository.findByBookingDate(date).stream()
                .filter(b -> b.getBookingTime().equals(time) &&
                        (b.getStatus() == BookingStatus.CONFIRMED ||
                                b.getStatus() == BookingStatus.ACTIVE))
                .collect(Collectors.toList());

        Set<Integer> bookedTables = bookedSlots.stream()
                .map(TableBooking::getTableNumber)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (int table = 1; table <= MAX_TABLES; table++) {
            if (!bookedTables.contains(table)) {
                return table;
            }
        }

        return 1;
    }

    public List<TableBooking> getCustomerBookings(Long customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return bookingRepository.findByCustomerOrderByBookingDateDescBookingTimeDesc(customer);
    }

    public List<TableBooking> getBookingsForDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                        b.getStatus() == BookingStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    @Transactional
    public TableBooking cancelBooking(Long bookingId, Long userId) {
        TableBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("🔍 Cancel booking attempt - User: {} ({}), Role: {}, Booking customer: {}",
                user.getName(), user.getId(), user.getRole(), booking.getCustomer().getId());

        // ✅✅✅ CRITICAL FIX: Check role correctly
        boolean isAdmin = (user.getRole() == Role.ADMIN);
        boolean isOwner = booking.getCustomer().getId().equals(userId);

        log.info("🔍 Authorization check - isAdmin: {}, isOwner: {}", isAdmin, isOwner);

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED &&
                booking.getStatus() != BookingStatus.ACTIVE) {
            throw new RuntimeException("Booking cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        TableBooking updated = bookingRepository.save(booking);

        if (isAdmin) {
            log.info("✅✅✅ Booking #{} cancelled by ADMIN {} ({})", bookingId, user.getName(), user.getEmail());
        } else {
            log.info("✅ Booking #{} cancelled by customer {}", bookingId, userId);
        }

        return updated;
    }

    public List<TableBooking> getAllBookings() {
        return bookingRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<TableBooking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public TableBooking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    @Transactional
    public TableBooking updateBookingStatus(Long bookingId, BookingStatus status) {
        TableBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);
        TableBooking updated = bookingRepository.save(booking);

        log.info("✅ Booking #{} status updated to {}", bookingId, status);
        return updated;
    }

    public Map<String, Object> getBookingStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("confirmed", bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.put("active", bookingRepository.countByStatus(BookingStatus.ACTIVE));
        stats.put("completed", bookingRepository.countByStatus(BookingStatus.COMPLETED));
        stats.put("cancelled", bookingRepository.countByStatus(BookingStatus.CANCELLED));

        LocalDate today = LocalDate.now();
        List<TableBooking> todayBookings = bookingRepository.findByBookingDate(today);
        stats.put("todayTotal", todayBookings.size());
        stats.put("todayActive", todayBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                        b.getStatus() == BookingStatus.ACTIVE)
                .count());

        LocalDate nextWeek = today.plusDays(7);
        long upcomingCount = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().isAfter(today) &&
                        b.getBookingDate().isBefore(nextWeek))
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .count();
        stats.put("upcomingWeek", upcomingCount);

        return stats;
    }
}