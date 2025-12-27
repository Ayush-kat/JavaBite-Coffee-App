package com.javabite.app.repository;

import com.javabite.app.model.BookingStatus;
import com.javabite.app.model.TableBooking;
import com.javabite.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TableBookingRepository extends JpaRepository<TableBooking, Long> {

    List<TableBooking> findByCustomerOrderByBookingDateDescBookingTimeDesc(User customer);
    List<TableBooking> findByBookingDate(LocalDate date);
    List<TableBooking> findByStatus(BookingStatus status);
    Long countByStatus(BookingStatus status);

    // ✅ FIXED: Query using string comparison since bookingTime is stored as String
    @Query("SELECT COUNT(b) FROM TableBooking b WHERE b.bookingDate = :date AND b.bookingTime = :time " +
            "AND (b.status = 'CONFIRMED' OR b.status = 'ACTIVE')")
    Long countBookingsForSlot(
            @Param("date") LocalDate date,
            @Param("time") String time);  // Changed to String
}