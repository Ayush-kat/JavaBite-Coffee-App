import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chefApi } from '../api/api.js';
import '../styles/Orders.css';

const ChefDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Tabs and Filters
    const [activeTab, setActiveTab] = useState('new'); // 'new', 'progress', 'completed'
    const [viewMode, setViewMode] = useState('large'); // 'large' or 'list'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days'
    const [displayedOrders, setDisplayedOrders] = useState(10);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let fetchedOrders = [];

            if (activeTab === 'new') {
                fetchedOrders = await chefApi.getNewOrders();
            } else if (activeTab === 'progress') {
                fetchedOrders = await chefApi.getActiveOrders();
            } else if (activeTab === 'completed') {
                fetchedOrders = await chefApi.getCompletedToday();
            }

            setOrders(fetchedOrders);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStartPreparation = async (orderId) => {
        if (!window.confirm('Start preparing this order?')) return;

        try {
            setUpdating(true);
            await chefApi.startPreparation(orderId);
            alert('Preparation started successfully!');
            await fetchOrders();
        } catch (err) {
            alert(err.message || 'Failed to start preparation');
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkReady = async (orderId) => {
        if (!window.confirm('Mark this order as ready?')) return;

        try {
            setUpdating(true);
            await chefApi.markOrderReady(orderId);
            alert('Order marked as ready!');
            await fetchOrders();
        } catch (err) {
            alert(err.message || 'Failed to mark order as ready');
        } finally {
            setUpdating(false);
        }
    };

    // Filter orders based on tab
    const getNewOrders = () => {
        return orders.filter(order => order.status === 'PENDING');
    };

    const getProgressOrders = () => {
        return orders.filter(order => order.status === 'PREPARING');
    };

    const getCompletedOrders = () => {
        return orders.filter(order => order.status === 'COMPLETED');
    };

    // Apply date filter
    const applyDateFilter = (ordersList) => {
        if (dateFilter === 'all') return ordersList;

        const now = new Date();
        const filterDate = new Date();

        if (dateFilter === '7days') {
            filterDate.setDate(now.getDate() - 7);
        } else if (dateFilter === '30days') {
            filterDate.setDate(now.getDate() - 30);
        }

        return ordersList.filter(order =>
            new Date(order.createdAt) >= filterDate
        );
    };

    // Group orders by date
    const groupOrdersByDate = (ordersList) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups = {
            today: [],
            yesterday: [],
            lastWeek: [],
            older: []
        };

        ordersList.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

            if (orderDay.getTime() === today.getTime()) {
                groups.today.push(order);
            } else if (orderDay.getTime() === yesterday.getTime()) {
                groups.yesterday.push(order);
            } else if (orderDate >= lastWeek) {
                groups.lastWeek.push(order);
            } else {
                groups.older.push(order);
            }
        });

        return groups;
    };

    const getFilteredOrders = () => {
        let filtered;
        if (activeTab === 'new') {
            filtered = getNewOrders();
        } else if (activeTab === 'progress') {
            filtered = getProgressOrders();
        } else {
            filtered = getCompletedOrders();
        }

        filtered = applyDateFilter(filtered);
        return filtered;
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#ff9800',
            'PREPARING': '#2196f3',
            'READY': '#4caf50',
            'COMPLETED': '#4caf50'
        };
        return colors[status] || '#757575';
    };

    const getStatusText = (status) => {
        const texts = {
            'PENDING': 'New Order',
            'PREPARING': 'Preparing',
            'READY': 'Ready',
            'COMPLETED': 'Completed'
        };
        return texts[status] || status;
    };

    const loadMoreOrders = () => {
        setDisplayedOrders(prev => prev + 10);
    };

    if (loading && orders.length === 0) {
        return (
            <div className="orders-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-page">
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={fetchOrders} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    const filteredOrders = getFilteredOrders();
    const groupedOrders = groupOrdersByDate(filteredOrders);
    const visibleOrders = filteredOrders.slice(0, displayedOrders);
    const hasMoreOrders = filteredOrders.length > displayedOrders;

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <h1>Chef Dashboard</h1>
                    <p className="orders-subtitle">
                        Welcome, {user?.name}! Manage your orders here.
                    </p>
                </div>

                {/* Tabs */}
                <div className="orders-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                        onClick={() => setActiveTab('new')}
                    >
                        New Orders
                        {/*({getNewOrders().length})*/}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('progress')}
                    >
                        In Progress
                        {/*({getProgressOrders().length})*/}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed Today
                        {/*({getCompletedOrders().length})*/}
                    </button>
                </div>

                {/* Filters */}
                <div className="orders-filters">

                    <div className="filter-group">
                        <label>View:</label>
                        <div className="view-toggle">
                            <button
                                className={viewMode === 'large' ? 'active' : ''}
                                onClick={() => setViewMode('large')}
                                title="Large view"
                            >
                                ⊞
                            </button>
                            <button
                                className={viewMode === 'list' ? 'active' : ''}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="no-orders-filtered">
                        <div className="empty-icon">
                            {activeTab === 'new' ? '🎯' : activeTab === 'progress' ? '👨‍🍳' : '✨'}
                        </div>
                        <h3>
                            {activeTab === 'new'
                                ? 'No new orders'
                                : activeTab === 'progress'
                                    ? 'Nothing cooking'
                                    : 'No completed orders today'}
                        </h3>
                        <p>
                            {activeTab === 'new'
                                ? 'Take a break, Chef! New orders will appear here automatically.'
                                : activeTab === 'progress'
                                    ? 'Start preparing orders from the "New Orders" tab.'
                                    : 'Orders you complete today will show up here.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Orders grouped by date */}
                        {Object.entries(groupedOrders).map(([groupKey, groupOrders]) => {
                            if (groupOrders.length === 0) return null;

                            const groupTitle = {
                                today: 'Today',
                                yesterday: 'Yesterday',
                                lastWeek: 'Last Week',
                                older: 'Older'
                            }[groupKey];

                            const ordersToShow = groupOrders.filter(order =>
                                visibleOrders.includes(order)
                            );

                            if (ordersToShow.length === 0) return null;

                            return (
                                <div key={groupKey} className="order-group">
                                    <h3 className="group-title">{groupTitle}</h3>
                                    <div className={`orders-grid ${viewMode}`}>
                                        {ordersToShow.map((order) => (
                                            <div key={order.id} className={`order-card ${viewMode} chef-order-card`}>
                                                <div className="order-card-header">
                                                    <div className="order-info">
                                                        <h3>
                                                            {order.tableNumber && (
                                                                <span className="table-badge-inline">
                                                                    TABLE {order.tableNumber} |
                                                                </span>
                                                            )}
                                                            {' '}Order #{order.id}
                                                        </h3>
                                                        <p className="order-date">
                                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className="order-status"
                                                        style={{
                                                            background: getStatusColor(order.status) + '20',
                                                            color: getStatusColor(order.status)
                                                        }}
                                                    >
                                                        {getStatusText(order.status)}
                                                    </div>
                                                </div>

                                                <div className="order-items">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className={`order-item ${viewMode}`}>
                                                            {viewMode === 'large' && (
                                                                <img
                                                                    src={item.menuItem.imageUrl}
                                                                    alt={item.menuItem.name}
                                                                    className="order-item-image"
                                                                />
                                                            )}
                                                            <div className="order-item-details">
                                                                <p className="order-item-name">{item.quantity}x {item.menuItem.name}</p>
                                                                {item.notes && (
                                                                    <p className="order-item-note">Note: {item.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {order.specialInstructions && viewMode === 'large' && (
                                                    <div className="order-instructions">
                                                        <strong>Special Instructions:</strong>
                                                        <p>{order.specialInstructions}</p>
                                                    </div>
                                                )}

                                                <div className="order-card-footer chef-footer">
                                                    <div className="order-actions chef-actions">
                                                        {activeTab === 'new' && order.status === 'PENDING' && (
                                                            <button
                                                                className="start-preparation-btn"
                                                                onClick={() => handleStartPreparation(order.id)}
                                                                disabled={updating}
                                                            >
                                                                {updating ? 'Starting...' : 'Start Preparation'}
                                                            </button>
                                                        )}
                                                        {activeTab === 'progress' && order.status === 'PREPARING' && (
                                                            <button
                                                                className="mark-ready-btn"
                                                                onClick={() => handleMarkReady(order.id)}
                                                                disabled={updating}
                                                            >
                                                                {updating ? 'Marking...' : 'Mark as Ready'}
                                                            </button>
                                                        )}
                                                        {activeTab === 'completed' && (
                                                            <div className="completed-badge-inline">
                                                                ✓ Completed
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {hasMoreOrders && (
                            <div className="load-more-container">
                                <button className="load-more-btn" onClick={loadMoreOrders}>
                                    Load More Orders
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChefDashboard;