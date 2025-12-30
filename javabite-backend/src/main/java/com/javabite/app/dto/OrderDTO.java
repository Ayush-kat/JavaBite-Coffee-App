package com.javabite.app.dto;

import com.javabite.app.model.Order;
import com.javabite.app.model.OrderItem;
import com.javabite.app.model.OrderStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class OrderDTO {
    private Long id;
    private OrderStatus status;
    private Boolean autoAssigned;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private LocalDateTime preparationStartedAt;
    private LocalDateTime readyAt;
    private LocalDateTime servedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime chefAssignedAt;
    private LocalDateTime waiterAssignedAt;

    // Payment info
    private String paymentStatus;
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime paidAt;

    // Admin notes
    private String adminNotes;

    // Customer info
    private CustomerDTO customer;

    // Staff info
    private StaffDTO chef;
    private StaffDTO waiter;

    // Booking info
    private BookingDTO tableBooking;

    // Order items
    private List<OrderItemDTO> items;

    public static OrderDTO fromEntity(Order order) {
        if (order == null) return null;

        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setAutoAssigned(order.getAutoAssigned());
        dto.setTotal(order.getTotal());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setPreparationStartedAt(order.getPreparationStartedAt());
        dto.setReadyAt(order.getReadyAt());
        dto.setServedAt(order.getServedAt());
        dto.setCompletedAt(order.getCompletedAt());
        dto.setCancelledAt(order.getCancelledAt());
        dto.setChefAssignedAt(order.getChefAssignedAt());
        dto.setWaiterAssignedAt(order.getWaiterAssignedAt());

        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTransactionId(order.getTransactionId());
        dto.setPaidAt(order.getPaidAt());
        dto.setAdminNotes(order.getAdminNotes());

        if (order.getCustomer() != null) {
            dto.setCustomer(CustomerDTO.fromUser(order.getCustomer()));
        }

        if (order.getChef() != null) {
            dto.setChef(StaffDTO.fromUser(order.getChef()));
        }

        if (order.getWaiter() != null) {
            dto.setWaiter(StaffDTO.fromUser(order.getWaiter()));
        }

        if (order.getTableBooking() != null) {
            dto.setTableBooking(BookingDTO.fromEntity(order.getTableBooking()));
        }

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            dto.setItems(order.getItems().stream()
                    .map(OrderItemDTO::fromEntity)
                    .collect(Collectors.toList()));
        } else {
            dto.setItems(new ArrayList<>());
        }

        return dto;
    }

    @Data
    public static class CustomerDTO {
        private Long id;
        private String name;
        private String email;

        public static CustomerDTO fromUser(com.javabite.app.model.User user) {
            if (user == null) return null;
            CustomerDTO dto = new CustomerDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            return dto;
        }
    }

    @Data
    public static class StaffDTO {
        private Long id;
        private String name;
        private String email;

        public static StaffDTO fromUser(com.javabite.app.model.User user) {
            if (user == null) return null;
            StaffDTO dto = new StaffDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            return dto;
        }
    }

    @Data
    public static class BookingDTO {
        private Long id;
        private Integer tableNumber;
        private String status;
        private Integer numberOfGuests;

        public static BookingDTO fromEntity(com.javabite.app.model.TableBooking booking) {
            if (booking == null) return null;
            BookingDTO dto = new BookingDTO();
            dto.setId(booking.getId());
            dto.setTableNumber(booking.getTableNumber());
            dto.setStatus(booking.getStatus().toString());
            dto.setNumberOfGuests(booking.getNumberOfGuests());
            return dto;
        }
    }

    @Data
    public static class OrderItemDTO {
        private Long id;
        private Integer quantity;
        private BigDecimal priceAtOrder;
        private MenuItemDTO menuItem;

        public static OrderItemDTO fromEntity(OrderItem item) {
            if (item == null) return null;
            OrderItemDTO dto = new OrderItemDTO();
            dto.setId(item.getId());
            dto.setQuantity(item.getQuantity());
            dto.setPriceAtOrder(BigDecimal.valueOf(item.getPriceAtOrder()));
            if (item.getMenuItem() != null) {
                dto.setMenuItem(MenuItemDTO.fromEntity(item.getMenuItem()));
            }
            return dto;
        }
    }

    @Data
    public static class MenuItemDTO {
        private Long id;
        private String name;
        private String category;

        public static MenuItemDTO fromEntity(com.javabite.app.model.MenuItem menuItem) {
            if (menuItem == null) return null;
            MenuItemDTO dto = new MenuItemDTO();
            dto.setId(menuItem.getId());
            dto.setName(menuItem.getName());
            dto.setCategory(menuItem.getCategory().toString());
            return dto;
        }
    }
}