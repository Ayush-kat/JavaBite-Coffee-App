package com.javabite.app.payload;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotNull(message = "Table booking ID is required")
    private Long tableBookingId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String specialInstructions;

    // ✅ NEW: Payment method field
    private String paymentMethod; // "CASH" or "CARD"

    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Menu item ID is required")
        private Long menuItemId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}