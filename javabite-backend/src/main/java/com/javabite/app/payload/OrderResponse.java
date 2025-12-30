package com.javabite.app.payload;

import com.javabite.app.model.Order;
import com.javabite.app.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long chefId;
    private String chefName;
    private Long waiterId;
    private String waiterName;
    private Integer tableNumber;
    private List<OrderItemResponse> items;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal total;
    private String specialInstructions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime readyAt;
    private LocalDateTime servedAt;
    private LocalDateTime completedAt;
    private Boolean autoAssigned;

    /**
     * ✅ FIXED: Null-safe conversion from Order entity
     */
    public static OrderResponse fromEntity(Order order) {
        if (order == null) {
            return null;
        }

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                .chefId(order.getChef() != null ? order.getChef().getId() : null)
                .chefName(order.getChef() != null ? order.getChef().getName() : null)
                .waiterId(order.getWaiter() != null ? order.getWaiter().getId() : null)
                .waiterName(order.getWaiter() != null ? order.getWaiter().getName() : null)
                .tableNumber(order.getTableNumber()) // ✅ Uses method from Order
                .items(order.getItems() != null && !order.getItems().isEmpty()
                        ? order.getItems().stream()
                        .map(OrderItemResponse::fromEntity)
                        .collect(Collectors.toList())
                        : new ArrayList<>())
                .status(order.getStatus())
                .autoAssigned(order.getAutoAssigned())
                .subtotal(order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO)
                .tax(order.getTax() != null ? order.getTax() : BigDecimal.ZERO)
                .discount(order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO)
                .total(order.getTotal()) // ✅ Uses calculated method
                .specialInstructions(order.getSpecialInstructions())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .readyAt(order.getReadyAt())
                .servedAt(order.getServedAt())
                .completedAt(order.getCompletedAt())
                .build();
    }
}