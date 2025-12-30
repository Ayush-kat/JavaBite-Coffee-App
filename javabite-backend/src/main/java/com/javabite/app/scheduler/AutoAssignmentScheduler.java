package com.javabite.app.scheduler;

import com.javabite.app.model.Order;
import com.javabite.app.model.OrderStatus;
import com.javabite.app.model.Role;
import com.javabite.app.model.User;
import com.javabite.app.repository.OrderRepository;
import com.javabite.app.repository.UserRepository;
import com.javabite.app.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoAssignmentScheduler {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    /**
     * ✅✅✅ FIXED: Auto-assign orders that have been pending for more than 2 minutes
     * Runs every minute
     * NOW ASSIGNS BOTH CHEF AND WAITER
     */
    @Scheduled(fixedRate = 60000) // Run every 1 minute
    @Transactional
    public void autoAssignPendingOrders() {
        try {
            // ✅ FIX: Changed from 5 minutes to 2 minutes
            LocalDateTime twoMinutesAgo = LocalDateTime.now().minusMinutes(2);

            // ✅ Find PENDING orders without chef, older than 2 minutes
            List<Order> unassignedOrders = orderRepository
                    .findByStatusAndChefIsNull(OrderStatus.PENDING)
                    .stream()
                    .filter(o -> o.getCreatedAt().isBefore(twoMinutesAgo))
                    .collect(Collectors.toList());

            if (unassignedOrders.isEmpty()) {
                return;
            }

            log.info("🤖 Auto-assignment: Found {} orders pending for 2+ minutes",
                    unassignedOrders.size());

            // ✅ Get available chefs (enabled + can accept orders)
            List<User> availableChefs = userRepository.findByRoleAndEnabled(Role.CHEF, true)
                    .stream()
                    .filter(User::canAcceptOrder)
                    .collect(Collectors.toList());

            // ✅ Get available waiters
            List<User> availableWaiters = userRepository.findByRoleAndEnabled(Role.WAITER, true)
                    .stream()
                    .filter(User::canAcceptOrder)
                    .collect(Collectors.toList());

            if (availableChefs.isEmpty()) {
                log.warn("⚠️ No available chefs for auto-assignment - adding to queue");

                // Add to queue instead
                for (Order order : unassignedOrders) {
                    User anyChef = userRepository.findByRoleAndEnabled(Role.CHEF, true)
                            .stream()
                            .findFirst()
                            .orElse(null);

                    if (anyChef != null && !orderService.isOrderInChefQueue(order.getId())) {
                        orderService.addToChefQueue(order, anyChef);
                        log.info("⏳ Added Order #{} to Chef queue (auto-assignment)", order.getId());
                    }
                }
                return;
            }

            // ✅✅✅ CRITICAL FIX: Auto-assign BOTH chef AND waiter
            int assignedCount = 0;
            int chefIndex = 0;
            int waiterIndex = 0;

            for (Order order : unassignedOrders) {
                if (availableChefs.isEmpty()) {
                    log.warn("⚠️ No more available chefs");
                    break;
                }

                boolean chefAssigned = false;
                boolean waiterAssigned = false;

                // ✅ Assign chef to order
                User chef = availableChefs.get(chefIndex % availableChefs.size());

                order.setChef(chef);
                order.setChefAssignedAt(LocalDateTime.now());
                order.setAutoAssigned(true); // ✅ Mark as auto-assigned

                chef.incrementActiveOrders();
                userRepository.save(chef);
                chefAssigned = true;

                log.info("🤖 Auto-assigned Chef {} to Order #{}", chef.getName(), order.getId());

                // Move to next chef
                chefIndex++;
                if (!chef.canAcceptOrder()) {
                    availableChefs.remove(chef);
                    if (chefIndex >= availableChefs.size() && !availableChefs.isEmpty()) {
                        chefIndex = 0;
                    }
                }

                // ✅✅✅ CRITICAL FIX: Auto-assign waiter if available
                if (!availableWaiters.isEmpty()) {
                    User waiter = availableWaiters.get(waiterIndex % availableWaiters.size());

                    order.setWaiter(waiter);
                    order.setWaiterAssignedAt(LocalDateTime.now());
                    // autoAssigned already set to true above

                    waiter.incrementActiveOrders();
                    userRepository.save(waiter);
                    waiterAssigned = true;

                    log.info("🤖 Auto-assigned Waiter {} to Order #{}", waiter.getName(), order.getId());

                    // Move to next waiter
                    waiterIndex++;
                    if (!waiter.canAcceptOrder()) {
                        availableWaiters.remove(waiter);
                        if (waiterIndex >= availableWaiters.size() && !availableWaiters.isEmpty()) {
                            waiterIndex = 0;
                        }
                    }
                } else {
                    log.warn("⚠️ No available waiters for Order #{}", order.getId());
                }

                // Save order with both assignments
                orderRepository.save(order);
                assignedCount++;

                log.info("✅ Auto-assigned Order #{} → Chef: {}{}, autoAssigned: {}",
                        order.getId(),
                        chef.getName(),
                        waiterAssigned ? ", Waiter: " + order.getWaiter().getName() : " (NO WAITER AVAILABLE)",
                        order.getAutoAssigned());
            }

            if (assignedCount > 0) {
                log.info("✅✅✅ Auto-assignment completed: {} orders assigned", assignedCount);
            }

        } catch (Exception e) {
            log.error("❌ Auto-assignment failed", e);
            e.printStackTrace();
        }
    }

    /**
     * ✅ Process queued orders when staff becomes available
     * Runs every 2 minutes
     */
    @Scheduled(fixedRate = 120000) // Run every 2 minutes
    @Transactional
    public void processQueuedOrders() {
        try {
            // Get all available chefs
            List<User> availableChefs = userRepository.findByRoleAndEnabled(Role.CHEF, true)
                    .stream()
                    .filter(User::canAcceptOrder)
                    .collect(Collectors.toList());

            // Process chef queue
            for (User chef : availableChefs) {
                try {
                    orderService.processChefQueue(chef.getId());
                } catch (Exception e) {
                    log.debug("No orders in queue for chef {}", chef.getName());
                }
            }

            // Get all available waiters
            List<User> availableWaiters = userRepository.findByRoleAndEnabled(Role.WAITER, true)
                    .stream()
                    .filter(User::canAcceptOrder)
                    .collect(Collectors.toList());

            // Process waiter queue
            for (User waiter : availableWaiters) {
                try {
                    orderService.processWaiterQueue(waiter.getId());
                } catch (Exception e) {
                    log.debug("No orders in queue for waiter {}", waiter.getName());
                }
            }

            log.debug("🔄 Queue processing completed");
        } catch (Exception e) {
            log.error("❌ Queue processing failed", e);
        }
    }
}