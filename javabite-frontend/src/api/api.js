// src/api/api.js - COMPLETE WITH AVAILABILITY CHECK

const API_BASE_URL = 'http://localhost:8080/api';

// Get auth headers with token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const apiCall = async (endpoint, options = {}) => {
    const defaultOptions = {
        credentials: 'include',
        headers: getAuthHeaders(),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
};

// ============= AUTH API =============
export const authApi = {
    login: async (email, password) => {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.data?.token) {
            localStorage.setItem('token', data.data.token);
        }
        return data.data;
    },

    register: async (name, email, password) => {
        const data = await apiCall('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        return data;
    },

    logout: async () => {
        try {
            await apiCall('/auth/logout', { method: 'POST' });
        } finally {
            localStorage.removeItem('token');
        }
    },

    getCurrentUser: async () => {
        const data = await apiCall('/auth/me');
        return data.data;
    },
};

// ============= MENU API =============
export const menuApi = {
    getAllMenuItems: async () => {
        const data = await apiCall('/menu');
        return data.data;
    },

    getMenuItemById: async (id) => {
        const data = await apiCall(`/menu/${id}`);
        return data.data;
    },

    getMenuItemsByCategory: async (category) => {
        const data = await apiCall(`/menu/category/${category}`);
        return data.data;
    },
};

// ============= ORDER API =============
export const orderApi = {
    createOrder: async (orderData) => {
        const data = await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
        return data.data;
    },

    getMyOrders: async () => {
        const data = await apiCall('/orders/my-orders');
        return data.data;
    },

    getOrderById: async (orderId) => {
        const data = await apiCall(`/orders/${orderId}`);
        return data.data;
    },

    cancelOrder: async (orderId) => {
        const data = await apiCall(`/orders/${orderId}/cancel`, {
            method: 'PUT',
        });
        return data.data;
    },
};

// ============= BOOKING API =============
export const bookingApi = {
    createBooking: async (bookingData) => {
        const data = await apiCall('/bookings/create', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
        return data;
    },

    getMyBookings: async () => {
        const data = await apiCall('/bookings/my-bookings');
        return data;
    },

    // ✅ NEW: Get available tables for specific date and time
    getAvailableTables: async (date, time) => {
        try {
            console.log('📡 API: Fetching available tables for', date, time);
            const data = await apiCall(
                `/bookings/available-tables?date=${date}&time=${time}`
            );
            console.log('✅ API: Received availability data:', data);
            return data;
        } catch (error) {
            console.error('❌ API: Failed to fetch available tables:', error);
            throw error;
        }
    },

    checkAvailability: async (date, time) => {
        const data = await apiCall(
            `/bookings/check-availability?date=${date}&time=${time}`
        );
        return data;
    },

    cancelBooking: async (bookingId) => {
        const data = await apiCall(`/bookings/${bookingId}/cancel`, {
            method: 'PUT',
        });
        return data;
    },

    getBooking: async (bookingId) => {
        const data = await apiCall(`/bookings/${bookingId}`);
        return data;
    },
};

// ============= ADMIN API =============
export const adminApi = {
    // Dashboard Stats
    getDashboardStats: async () => {
        const data = await apiCall('/admin/dashboard/stats');
        return data.data;
    },

    // Orders
    getPendingOrders: async () => {
        const data = await apiCall('/admin/orders/pending');
        return data.data;
    },

    assignStaff: async (orderId, staffData) => {
        const data = await apiCall(`/admin/orders/${orderId}/assign`, {
            method: 'POST',
            body: JSON.stringify(staffData),
        });
        return data.data;
    },

    assignChef: async (orderId, chefId) => {
        const data = await apiCall(`/admin/orders/${orderId}/assign-chef`, {
            method: 'POST',
            body: JSON.stringify({ chefId }),
        });
        return data.data;
    },

    assignWaiter: async (orderId, waiterId) => {
        const data = await apiCall(`/admin/orders/${orderId}/assign-waiter`, {
            method: 'POST',
            body: JSON.stringify({ waiterId }),
        });
        return data.data;
    },

    // Staff Management
    createChef: async (chefData) => {
        const data = await apiCall('/admin/create-chef', {
            method: 'POST',
            body: JSON.stringify(chefData),
        });
        return data.data;
    },

    createWaiter: async (waiterData) => {
        const data = await apiCall('/admin/create-waiter', {
            method: 'POST',
            body: JSON.stringify(waiterData),
        });
        return data.data;
    },

    getAllChefs: async () => {
        const data = await apiCall('/admin/staff/chefs');
        return data.data;
    },

    getAllWaiters: async () => {
        const data = await apiCall('/admin/staff/waiters');
        return data.data;
    },

    toggleStaffStatus: async (userId) => {
        const data = await apiCall(`/admin/staff/${userId}/toggle`, {
            method: 'PUT',
        });
        return data.data;
    },

    deleteStaff: async (userId) => {
        const data = await apiCall(`/admin/staff/${userId}`, {
            method: 'DELETE',
        });
        return data;
    },

    // Menu Management
    getAllMenuItems: async () => {
        const data = await apiCall('/admin/menu');
        return data.data;
    },

    getMenuItemById: async (itemId) => {
        const data = await apiCall(`/admin/menu/${itemId}`);
        return data.data;
    },

    createMenuItem: async (itemData) => {
        const data = await apiCall('/admin/menu', {
            method: 'POST',
            body: JSON.stringify(itemData),
        });
        return data.data;
    },

    updateMenuItem: async (itemId, itemData) => {
        const data = await apiCall(`/admin/menu/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(itemData),
        });
        return data.data;
    },

    deleteMenuItem: async (itemId) => {
        const data = await apiCall(`/admin/menu/${itemId}`, {
            method: 'DELETE',
        });
        return data;
    },

    // Booking Management
    getAllBookings: async () => {
        try {
            const data = await apiCall('/bookings/admin/all');
            console.log('Raw booking data from backend:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            throw error;
        }
    },

    getBookingsByStatus: async (status) => {
        const data = await apiCall(`/bookings/admin/status/${status}`);
        return Array.isArray(data) ? data : [];
    },

    getBookingsByDate: async (date) => {
        const data = await apiCall(`/bookings/admin/date/${date}`);
        return Array.isArray(data) ? data : [];
    },

    updateBookingStatus: async (bookingId, status) => {
        const data = await apiCall(`/bookings/admin/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        return data;
    },

    cancelBookingAdmin: async (bookingId) => {
        const data = await apiCall(`/bookings/${bookingId}/cancel`, {
            method: 'PUT',
        });
        return data;
    },
};

// ============= CHEF API =============
export const chefApi = {
    getNewOrders: async () => {
        const data = await apiCall('/chef/orders/new');
        return data.data;
    },

    getActiveOrders: async () => {
        const data = await apiCall('/chef/orders/active');
        return data.data;
    },

    getCompletedToday: async () => {
        const data = await apiCall('/chef/orders/completed-today');
        return data.data;
    },

    startPreparation: async (orderId) => {
        const data = await apiCall(`/chef/orders/${orderId}/start`, {
            method: 'POST',
        });
        return data.data;
    },

    markOrderReady: async (orderId) => {
        const data = await apiCall(`/chef/orders/${orderId}/ready`, {
            method: 'PUT',
        });
        return data.data;
    },
};

// ============= WAITER API =============
export const waiterApi = {
    getPreparingOrders: async () => {
        const data = await apiCall('/waiter/orders/preparing');
        return data.data || [];
    },

    getReadyOrders: async () => {
        const data = await apiCall('/waiter/orders/ready');
        return data.data || [];
    },

    getAssignedOrders: async () => {
        const data = await apiCall('/waiter/orders/assigned');
        return data.data || [];
    },

    markAsServed: async (orderId) => {
        const data = await apiCall(`/waiter/orders/${orderId}/serve`, {
            method: 'PUT',
        });
        return data.data;
    },
};

export default {
    authApi,
    menuApi,
    orderApi,
    adminApi,
    chefApi,
    waiterApi,
    bookingApi,
};