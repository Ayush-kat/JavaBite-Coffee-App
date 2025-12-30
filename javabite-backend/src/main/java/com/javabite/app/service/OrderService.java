package com.javabite.app.service;

import com.javabite.app.model.*;
import com.javabite.app.payload.CreateOrderRequest;
import com.javabite.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableBookingRepository bookingRepository;
    private final ChefQueueRepository chefQueueRepository;
    private final WaiterQueueRepository waiterQueueRepository;


    @Transactional
    public Order createOrder(Long customerId, CreateOrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Validate table booking exists
        TableBooking booking = bookingRepository.findById(request.getTableBookingId())
                .orElseThrow(() -> new RuntimeException("Table booking not found. Please book a table first."));

        // Verify booking belongs to customer
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("This booking does not belong to you");
        }

        // Verify booking is active (CONFIRMED or ACTIVE)
        if (booking.getStatus() != BookingStatus.CONFIRMED &&
                booking.getStatus() != BookingStatus.ACTIVE) {
            throw new RuntimeException("Booking is not active. Current status: " + booking.getStatus());
        }

        // Create order
        Order order = Order.builder()
                .customer(customer)
                .tableBooking(booking)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .autoAssigned(false)
                // ✅ Set payment details
                .paymentStatus("PAID")
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                .paidAt(LocalDateTime.now())
                .build();

        // Add order items
        request.getItems().forEach(itemRequest -> {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemRequest.getQuantity())
                    .priceAtOrder(menuItem.getPrice().doubleValue())
                    .build();

            order.addOrderItem(orderItem);
        });

        Order savedOrder = orderRepository.save(order);

        // ✅ Update booking status to ACTIVE on first order
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            booking.setStatus(BookingStatus.ACTIVE);
            bookingRepository.save(booking);
            log.info("✅ Table booking #{} status: CONFIRMED → ACTIVE", booking.getId());
        }

        // ✅✅✅ CRITICAL FIX: Only auto-assign if table ALREADY has staff from previous orders
        // Do NOT auto-assign for first order - let admin assign (or auto-assign after 2 min timeout)
        List<Order> tableOrders = orderRepository.findByTableBooking(booking);
        if (tableOrders.size() > 1) {
            // Table has previous orders - reuse same staff
            Order firstOrder = tableOrders.get(0);

            if (firstOrder.getChef() != null && !firstOrder.getId().equals(savedOrder.getId())) {
                savedOrder.setChef(firstOrder.getChef());
                savedOrder.setChefAssignedAt(LocalDateTime.now());
                savedOrder.setAutoAssigned(true);
                log.info("✅ Auto-assigned Chef {} to Order #{} (same table)",
                        firstOrder.getChef().getName(), savedOrder.getId());
            }

            if (firstOrder.getWaiter() != null && !firstOrder.getId().equals(savedOrder.getId())) {
                savedOrder.setWaiter(firstOrder.getWaiter());
                savedOrder.setWaiterAssignedAt(LocalDateTime.now());
                savedOrder.setAutoAssigned(true);
                log.info("✅ Auto-assigned Waiter {} to Order #{} (same table)",
                        firstOrder.getWaiter().getName(), savedOrder.getId());
            }

            savedOrder = orderRepository.save(savedOrder);
        } else {
            // ✅ This is the FIRST order for this table
            // DO NOT auto-assign - order goes to admin pending dashboard
            // Admin has 2 minutes to assign, then auto-assignment kicks in
            log.info("📋 Order #{} created - waiting for admin assignment (or 2-min auto-assign)",
                    savedOrder.getId());
        }

        log.info("✅ Order created: #{} for Table {} (Booking #{})",
                savedOrder.getId(), booking.getTableNumber(), booking.getId());

        return savedOrder;
    }

    /**
     * ✅ FIXED: Assign CHEF to order (marks as auto-assigned if triggered by system)
     */
    @Transactional
    public Order assignChefToOrder(Long orderId, Long chefId, boolean isAutoAssignment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));

        if (chef.getRole() != Role.CHEF) {
            throw new RuntimeException("Selected user is not a chef");
        }

        if (!chef.isEnabled()) {
            throw new RuntimeException("Chef is disabled");
        }

        TableBooking booking = order.getTableBooking();
        if (booking == null) {
            throw new RuntimeException("Order has no table booking");
        }

        List<Order> tableOrders = orderRepository.findByTableBooking(booking);

        if (!chef.canAcceptOrder()) {
            for (Order tableOrder : tableOrders) {
                if (tableOrder.getChef() == null && !isOrderInChefQueue(tableOrder.getId())) {
                    addToChefQueue(tableOrder, chef);
                }
            }
            log.info("⏳ Table {} orders added to Chef {} queue", booking.getTableNumber(), chef.getName());
            throw new RuntimeException("Chef is busy. Orders added to queue.");
        }

        for (Order tableOrder : tableOrders) {
            if (tableOrder.getChef() == null) {
                tableOrder.setChef(chef);
                tableOrder.setChefAssignedAt(LocalDateTime.now());
                // ✅ FIX: Set auto-assigned flag if this is auto-assignment
                if (isAutoAssignment) {
                    tableOrder.setAutoAssigned(true);
                }
                orderRepository.save(tableOrder);
                log.info("✅ Assigned Chef {} to Order #{}{}",
                        chef.getName(), tableOrder.getId(),
                        isAutoAssignment ? " (AUTO)" : "");
            }
        }

        chef.incrementActiveOrders();
        userRepository.save(chef);

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    /**
     * ✅✅✅ FIXED: Assign WAITER to order (and all orders on same table)
     * Orders are assigned to waiter FIRST, then added to queue if waiter is busy
     */
    /**
     * ✅ FIXED: Assign WAITER to order (marks as auto-assigned if triggered by system)
     */
    @Transactional
    public Order assignWaiterToOrder(Long orderId, Long waiterId, boolean isAutoAssignment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        if (waiter.getRole() != Role.WAITER) {
            throw new RuntimeException("Selected user is not a waiter");
        }

        if (!waiter.isEnabled()) {
            throw new RuntimeException("Waiter is disabled");
        }

        TableBooking booking = order.getTableBooking();
        if (booking == null) {
            throw new RuntimeException("Order has no table booking");
        }

        List<Order> tableOrders = orderRepository.findByTableBooking(booking);

        for (Order tableOrder : tableOrders) {
            if (tableOrder.getWaiter() == null) {
                tableOrder.setWaiter(waiter);
                tableOrder.setWaiterAssignedAt(LocalDateTime.now());
                // ✅ FIX: Set auto-assigned flag if this is auto-assignment
                if (isAutoAssignment) {
                    tableOrder.setAutoAssigned(true);
                }
                orderRepository.save(tableOrder);
                log.info("✅ Assigned Waiter {} to Order #{}{}",
                        waiter.getName(), tableOrder.getId(),
                        isAutoAssignment ? " (AUTO)" : "");
            }
        }

        if (!waiter.canAcceptOrder()) {
            for (Order tableOrder : tableOrders) {
                if (!isOrderInWaiterQueue(tableOrder.getId())) {
                    addToWaiterQueue(tableOrder, waiter);
                }
            }
            log.info("⏳ Table {} orders assigned to Waiter {} and added to queue (waiter busy)",
                    booking.getTableNumber(), waiter.getName());

            return orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
        }

        waiter.incrementActiveOrders();
        userRepository.save(waiter);

        log.info("✅ Waiter {} assigned to all orders on Table {} (immediate capacity)",
                waiter.getName(), booking.getTableNumber());

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // ✅ ALSO ADD: Overloaded methods for backward compatibility
    @Transactional
    public Order assignChefToOrder(Long orderId, Long chefId) {
        return assignChefToOrder(orderId, chefId, false); // Manual assignment by default
    }

    @Transactional
    public Order assignWaiterToOrder(Long orderId, Long waiterId) {
        return assignWaiterToOrder(orderId, waiterId, false); // Manual assignment by default
    }

    /**
     * ✅ Check if order is in chef queue
     */
    public boolean isOrderInChefQueue(Long orderId) {
        return chefQueueRepository.findByOrderId(orderId).isEmpty();
    }

    /**
     * ✅ Check if order is in waiter queue
     */
    public boolean isOrderInWaiterQueue(Long orderId) {
        return waiterQueueRepository.findByOrderId(orderId).isPresent();
    }

    /**
     * ✅ Add to chef queue with validation
     */
    @Transactional
    public void addToChefQueue(Order order, User chef) {
        if (order.getTableBooking() == null) {
            throw new RuntimeException("Cannot add to queue: Order has no table booking");
        }

        Optional<ChefQueue> existing = chefQueueRepository.findByOrderId(order.getId());
        if (existing.isPresent()) {
            log.warn("⚠️ Order #{} already in chef queue, skipping", order.getId());
            return;
        }

        long queuePosition = chefQueueRepository.countByChef(chef) + 1;

        ChefQueue queueEntry = ChefQueue.builder()
                .order(order)
                .chef(chef)
                .queuePosition((int) queuePosition)
                .createdAt(LocalDateTime.now())
                .build();

        chefQueueRepository.save(queueEntry);
        log.info("➕ Added Order #{} to Chef {} queue (position {})",
                order.getId(), chef.getName(), queuePosition);
    }

    /**
     * ✅ Add to waiter queue with validation
     */
    @Transactional
    public void addToWaiterQueue(Order order, User waiter) {
        if (order.getTableBooking() == null) {
            throw new RuntimeException("Cannot add to queue: Order has no table booking");
        }

        Optional<WaiterQueue> existing = waiterQueueRepository.findByOrderId(order.getId());
        if (existing.isPresent()) {
            log.warn("⚠️ Order #{} already in waiter queue, skipping", order.getId());
            return;
        }

        long queuePosition = waiterQueueRepository.countByWaiter(waiter) + 1;

        WaiterQueue queueEntry = WaiterQueue.builder()
                .order(order)
                .waiter(waiter)
                .queuePosition((int) queuePosition)
                .createdAt(LocalDateTime.now())
                .build();

        waiterQueueRepository.save(queueEntry);
        log.info("➕ Added Order #{} to Waiter {} queue (position {})",
                order.getId(), waiter.getName(), queuePosition);
    }

    /**
     * ✅ Get pending orders (no chef assigned)
     */
    public List<Order> getPendingOrders() {
        return orderRepository.findByStatusAndChefIsNull(OrderStatus.PENDING);
    }

    /**
     * ✅ Get customer's orders
     */
    public List<Order> getCustomerOrders(Long customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }

    /**
     * ✅ Get order by ID
     */
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    /**
     * ✅ Cancel order
     */
    @Transactional
    public Order cancelOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Not authorized to cancel this order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Can only cancel PENDING orders");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());

        // Free up staff
        if (order.getChef() != null) {
            order.getChef().decrementActiveOrders();
            userRepository.save(order.getChef());
        }
        if (order.getWaiter() != null) {
            order.getWaiter().decrementActiveOrders();
            userRepository.save(order.getWaiter());
        }

        return orderRepository.save(order);
    }

    // ==================== CHEF METHODS ====================

    /**
     * ✅ Get chef's NEW orders (PENDING with chef assigned)
     */
    public List<Order> getChefNewOrders(Long chefId) {
        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));
        return orderRepository.findByChefAndStatus(chef, OrderStatus.PENDING);
    }

    /**
     * ✅ Get chef's ACTIVE orders (PREPARING status)
     */
    public List<Order> getChefActiveOrders(Long chefId) {
        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));
        return orderRepository.findByChefAndStatus(chef, OrderStatus.PREPARING);
    }

    /**
     * ✅ Get chef's COMPLETED orders TODAY
     */
    public List<Order> getChefCompletedToday(Long chefId) {
        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        return orderRepository.findByChefAndStatusAndCompletedAtBetween(
                chef, OrderStatus.COMPLETED, startOfDay, endOfDay);
    }

    /**
     * ✅ Chef starts preparation: PENDING → PREPARING
     */
    @Transactional
    public Order startPreparation(Long orderId, Long chefId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));

        if (!order.getChef().getId().equals(chefId)) {
            throw new RuntimeException("This order is not assigned to you");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Order must be PENDING to start preparation");
        }

        order.setStatus(OrderStatus.PREPARING);
        order.setPreparationStartedAt(LocalDateTime.now());

        log.info("✅ Chef {} started preparing Order #{}", chef.getName(), orderId);
        return orderRepository.save(order);
    }

    /**
     * ✅ Process chef queue - assign next queued order to available chef
     */
    @Transactional
    public void processChefQueue(Long chefId) {
        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));

        if (!chef.canAcceptOrder()) {
            log.info("⏭️ Chef {} is still busy, skipping queue processing", chef.getName());
            return;
        }

        List<ChefQueue> queue = chefQueueRepository.findByChefOrderByQueuePositionAsc(chef);

        if (queue.isEmpty()) {
            log.info("📭 No orders in queue for Chef {}", chef.getName());
            return;
        }

        ChefQueue nextInQueue = queue.get(0);
        Order order = nextInQueue.getOrder();

        try {
            order.setChef(chef);
            order.setChefAssignedAt(LocalDateTime.now());
            orderRepository.save(order);

            chefQueueRepository.delete(nextInQueue);

            chef.incrementActiveOrders();
            userRepository.save(chef);

            log.info("✅ Auto-assigned queued Order #{} to Chef {} from queue",
                    order.getId(), chef.getName());
        } catch (Exception e) {
            log.error("❌ Failed to assign queued order: {}", e.getMessage());
        }
    }

    /**
     * ✅ Chef marks order ready: PREPARING → READY
     */
    @Transactional
    public Order markOrderReady(Long orderId, Long chefId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef not found"));

        if (!order.getChef().getId().equals(chefId)) {
            throw new RuntimeException("This order is not assigned to you");
        }

        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new RuntimeException("Order must be PREPARING to mark as ready");
        }

        order.setStatus(OrderStatus.READY);
        order.setReadyAt(LocalDateTime.now());

        // ✅ Free up chef capacity when marking ready
        if (order.getChef() != null) {
            order.getChef().decrementActiveOrders();
            userRepository.save(order.getChef());
        }

        orderRepository.save(order);

        log.info("✅ Chef {} marked Order #{} as READY", chef.getName(), orderId);

        // ✅ Process chef queue after marking order ready
        processChefQueue(chefId);

        // ✅✅✅ NEW: Process waiter queue when order becomes READY
        if (order.getWaiter() != null) {
            processWaiterQueueForReadyOrder(order.getWaiter().getId());
        }

        return order;
    }

    // ==================== WAITER METHODS ====================

    /**
     * ✅ Get waiter's READY orders
     */
    public List<Order> getWaiterReadyOrders(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));
        return orderRepository.findByWaiterAndStatus(waiter, OrderStatus.READY);
    }

    /**
     * ✅ Waiter marks order served: READY → COMPLETED
     */
    @Transactional
    public Order waiterMarkServed(Long orderId, Long waiterId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        if (order.getWaiter() != null && !order.getWaiter().getId().equals(waiterId)) {
            throw new RuntimeException("This order is not assigned to you");
        }

        if (order.getStatus() != OrderStatus.READY) {
            throw new RuntimeException("Order must be READY to mark as served");
        }

        order.setStatus(OrderStatus.COMPLETED);
        order.setServedAt(LocalDateTime.now());
        order.setCompletedAt(LocalDateTime.now());

        // Free up staff
        if (order.getChef() != null) {
            order.getChef().decrementActiveOrders();
            userRepository.save(order.getChef());
        }
        if (order.getWaiter() != null) {
            order.getWaiter().decrementActiveOrders();
            userRepository.save(order.getWaiter());
        }

        orderRepository.save(order);

        // ✅ Check if all orders for this table are completed
        TableBooking booking = order.getTableBooking();
        if (booking != null) {
            List<Order> tableOrders = orderRepository.findByTableBooking(booking);
            boolean allCompleted = tableOrders.stream()
                    .allMatch(o -> o.getStatus() == OrderStatus.COMPLETED ||
                            o.getStatus() == OrderStatus.CANCELLED);

            if (allCompleted) {
                booking.setStatus(BookingStatus.COMPLETED);
                bookingRepository.save(booking);
                log.info("✅ All orders completed - Table {} booking COMPLETED",
                        booking.getTableNumber());
            }
        }

        log.info("✅ Waiter {} marked Order #{} as SERVED & COMPLETED", waiter.getName(), orderId);

        // ✅ Process waiter queue after completing order
        processWaiterQueue(waiterId);

        return order;
    }

    /**
     * ✅ Process waiter queue - assign next queued order to available waiter
     */
    @Transactional
    public void processWaiterQueue(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        if (!waiter.canAcceptOrder()) {
            log.info("⏭️ Waiter {} is still busy, skipping queue processing", waiter.getName());
            return;
        }

        List<WaiterQueue> queue = waiterQueueRepository.findByWaiterOrderByQueuePositionAsc(waiter);

        if (queue.isEmpty()) {
            log.info("📭 No orders in queue for Waiter {}", waiter.getName());
            return;
        }

        WaiterQueue nextInQueue = queue.get(0);
        Order order = nextInQueue.getOrder();

        try {
            // ✅ Order already has waiter assigned, just remove from queue and increment capacity
            waiterQueueRepository.delete(nextInQueue);

            waiter.incrementActiveOrders();
            userRepository.save(waiter);

            log.info("✅ Removed Order #{} from Waiter {} queue - now active",
                    order.getId(), waiter.getName());
        } catch (Exception e) {
            log.error("❌ Failed to process queued order: {}", e.getMessage());
        }
    }

    /**
     * ✅✅✅ NEW: Process waiter queue when order becomes READY (not just when order is served)
     * This handles the case where queued orders become READY before waiter has capacity
     */
    @Transactional
    public void processWaiterQueueForReadyOrder(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        // Get queued orders that are now READY
        List<WaiterQueue> queue = waiterQueueRepository.findByWaiterOrderByQueuePositionAsc(waiter);

        for (WaiterQueue queueEntry : queue) {
            Order order = queueEntry.getOrder();

            // If order in queue is now READY and waiter has capacity, activate it
            if (order.getStatus() == OrderStatus.READY && waiter.canAcceptOrder()) {
                waiterQueueRepository.delete(queueEntry);
                waiter.incrementActiveOrders();
                userRepository.save(waiter);

                log.info("✅ Activated READY order #{} from Waiter {} queue",
                        order.getId(), waiter.getName());
                break; // Process one at a time
            }
        }
    }

    /**
     * ✅ Get waiter's ASSIGNED orders (all statuses except COMPLETED/CANCELLED)
     */
    public List<Order> getWaiterAssignedOrders(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        return orderRepository.findByWaiter(waiter).stream()
                .filter(o -> o.getStatus() != OrderStatus.COMPLETED &&
                        o.getStatus() != OrderStatus.CANCELLED)
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * ✅ Get waiter's preparing orders (chef is working on them)
     */
    public List<Order> getWaiterPreparingOrders(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        return orderRepository.findByWaiter(waiter).stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING ||
                        o.getStatus() == OrderStatus.PREPARING)
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Get all orders assigned to a waiter (both preparing and ready)
     */
    public List<Order> getWaiterAllAssignedOrders(Long waiterId) {
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new RuntimeException("Waiter not found"));

        return orderRepository.findByWaiter(waiter).stream()
                .filter(o -> o.getStatus() != OrderStatus.COMPLETED &&
                        o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());
    }

    // ==================== ADMIN METHODS ====================

    /**
     * ✅ Get admin dashboard stats
     */
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING));
        stats.put("preparingOrders", orderRepository.countByStatus(OrderStatus.PREPARING));
        stats.put("readyOrders", orderRepository.countByStatus(OrderStatus.READY));
        stats.put("completedToday", orderRepository.countByStatusAndCompletedAtAfter(
                OrderStatus.COMPLETED, LocalDate.now().atStartOfDay()));

        stats.put("activeChefs", userRepository.countByRoleAndEnabled(Role.CHEF, true));
        stats.put("activeWaiters", userRepository.countByRoleAndEnabled(Role.WAITER, true));
        stats.put("activeBookings", bookingRepository.countByStatus(BookingStatus.ACTIVE));

        return stats;
    }

    /**
     * Get all orders (for admin history page)
     */
    public List<Order> getAllOrders() {
        log.info("Fetching all orders");
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get order by ID (for admin - different from customer getOrderById)
     * Note: If you already have a getOrderById method, keep it and use this one
     * OR rename this to getOrderByIdAdmin()
     */
    public Order getOrderByIdForAdmin(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

    /**
     * Cancel order by admin
     */
    @Transactional
    public void cancelOrderByAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order is already cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());

        // Free up chef and waiter if assigned
        if (order.getChef() != null) {
            User chef = order.getChef();
            chef.decrementActiveOrders();
            userRepository.save(chef);
        }

        if (order.getWaiter() != null) {
            User waiter = order.getWaiter();
            waiter.decrementActiveOrders();
            userRepository.save(waiter);
        }

        orderRepository.save(order);
        log.info("Order {} cancelled by admin", orderId);
    }

    /**
     * Update order notes (admin internal notes)
     */
    @Transactional
    public void updateOrderNotes(Long orderId, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        order.setAdminNotes(notes);
        orderRepository.save(order);
        log.info("Order {} notes updated", orderId);
    }

    /**
     * Refund order
     */
    @Transactional
    public void refundOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new RuntimeException("Only completed orders can be refunded");
        }

        if ("REFUNDED".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Order is already refunded");
        }

        order.setPaymentStatus("REFUNDED");
        orderRepository.save(order);
        log.info("Order {} refunded", orderId);
    }

    /**
     * Reassign staff to order
     */
    @Transactional
    public void reassignStaff(Long orderId, Long chefId, Long waiterId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Remove from current staff if assigned
        if (order.getChef() != null) {
            User currentChef = order.getChef();
            currentChef.decrementActiveOrders();
            userRepository.save(currentChef);
        }

        if (order.getWaiter() != null) {
            User currentWaiter = order.getWaiter();
            currentWaiter.decrementActiveOrders();
            userRepository.save(currentWaiter);
        }

        // Assign new staff
        if (chefId != null) {
            User newChef = userRepository.findById(chefId)
                    .orElseThrow(() -> new RuntimeException("Chef not found"));
            order.setChef(newChef);
            order.setChefAssignedAt(LocalDateTime.now());
            newChef.incrementActiveOrders();
            userRepository.save(newChef);
        }

        if (waiterId != null) {
            User newWaiter = userRepository.findById(waiterId)
                    .orElseThrow(() -> new RuntimeException("Waiter not found"));
            order.setWaiter(newWaiter);
            order.setWaiterAssignedAt(LocalDateTime.now());
            newWaiter.incrementActiveOrders();
            userRepository.save(newWaiter);
        }

        orderRepository.save(order);
        log.info("Order {} staff reassigned", orderId);
    }

    /**
     * Get order statistics - FIXED VERSION (handles BigDecimal)
     */
    public Map<String, Object> getOrderStatistics() {
        List<Order> allOrders = orderRepository.findAll();

        long pending = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING)
                .count();

        long preparing = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PREPARING)
                .count();

        long ready = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.READY)
                .count();

        long completed = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .count();

        long cancelled = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .count();

        LocalDate today = LocalDate.now();

        // FIXED: Convert BigDecimal to double properly
        double todaySales = allOrders.stream()
                .filter(o -> o.getCreatedAt().toLocalDate().equals(today))
                .filter(o -> o.getTotal() != null)
                .mapToDouble(o -> o.getTotal().doubleValue())  // ← FIXED: .doubleValue()
                .sum();

        // FIXED: Convert BigDecimal to double properly
        double avgOrderValue = allOrders.stream()
                .filter(o -> o.getTotal() != null)
                .mapToDouble(o -> o.getTotal().doubleValue())  // ← FIXED: .doubleValue()
                .average()
                .orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", pending);
        stats.put("preparing", preparing);
        stats.put("ready", ready);
        stats.put("completed", completed);
        stats.put("cancelled", cancelled);
        stats.put("total", allOrders.size());
        stats.put("todaySales", todaySales);
        stats.put("avgOrderValue", avgOrderValue);

        return stats;
    }

}