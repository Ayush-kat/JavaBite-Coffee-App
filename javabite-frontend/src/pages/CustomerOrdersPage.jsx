import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api/api';
import '../styles/Orders.css';

const CustomerOrdersPage = ({ setCart }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);

    // Tabs and Filters
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'past'
    const [viewMode, setViewMode] = useState('large'); // 'large' or 'list'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days'
    const [displayedOrders, setDisplayedOrders] = useState(10);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const loadOrders = async () => {
            await fetchOrders();
        };
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, navigate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const fetchedOrders = await orderApi.getMyOrders();
            setOrders(fetchedOrders);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to load orders. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Empty State Component
    const EmptyOrdersState = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '40px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                width: '200px',
                height: '200px',
                marginBottom: '32px',
                opacity: 0.6
            }}>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="#f5f0e8" />
                    <path d="M70 85 Q100 70 130 85" stroke="#8b6f47" strokeWidth="3" fill="none" />
                    <circle cx="80" cy="90" r="5" fill="#8b6f47" />
                    <circle cx="120" cy="90" r="5" fill="#8b6f47" />
                    <text x="100" y="140" textAnchor="middle" fontSize="60" fill="#8b6f47">🛒</text>
                </svg>
            </div>
            <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#3e2723',
                marginBottom: '12px'
            }}>
                Your Cart is Empty
            </h2>
            <p style={{
                fontSize: '18px',
                color: '#6d4c41',
                marginBottom: '32px',
                textAlign: 'center',
                maxWidth: '400px'
            }}>
                Add some delicious items to get started!
            </p>
            <button
                onClick={() => navigate('/menu')}
                style={{
                    padding: '16px 48px',
                    background: '#8b6f47',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    fontSize: '18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(139, 111, 71, 0.3)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 111, 71, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(139, 111, 71, 0.3)';
                }}
            >
                Browse Menu
            </button>
        </div>
    );

    // Filter orders based on tab
    const getCurrentOrders = () => {
        return orders.filter(order =>
            ['PENDING', 'PREPARING', 'READY'].includes(order.status)
        );
    };

    const getPastOrders = () => {
        return orders.filter(order =>
            ['COMPLETED', 'CANCELLED'].includes(order.status)
        );
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
        let filtered = activeTab === 'current' ? getCurrentOrders() : getPastOrders();
        filtered = applyDateFilter(filtered);
        return filtered;
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#ff9800',
            'PREPARING': '#2196f3',
            'READY': '#4caf50',
            'COMPLETED': '#4caf50',
            'CANCELLED': '#f44336'
        };
        return colors[status] || '#757575';
    };

    const getStatusText = (status) => {
        const texts = {
            'PENDING': 'Pending',
            'PREPARING': 'Being Prepared',
            'READY': 'Being Served',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Cancelled'
        };
        return texts[status] || status;
    };

    const getPaymentStatus = (order) => {
        // Payment happens at checkout, so all orders are paid except cancelled ones
        if (order.status === 'CANCELLED') return 'Refunded';
        // All other statuses (PENDING, PREPARING, READY, COMPLETED) mean payment was made
        return 'Paid';
    };

    const handleReorder = (order) => {
        const cartItems = order.items.flatMap(item =>
            Array(item.quantity).fill({
                id: item.menuItem.id,
                name: item.menuItem.name,
                description: item.menuItem.description,
                price: parseFloat(item.priceAtOrder),
                image: item.menuItem.imageUrl
            })
        );

        setCart(cartItems);
        navigate('/cart');
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            await orderApi.cancelOrder(orderId);
            alert('Order cancelled successfully');
            fetchOrders();
        } catch (err) {
            alert(err.message || 'Failed to cancel order');
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const loadMoreOrders = () => {
        setDisplayedOrders(prev => prev + 10);
    };

    if (loading) {
        return (
            <div className="orders-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your orders...</p>
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
                    <h1>My Orders</h1>
                    <p className="orders-subtitle">
                        Welcome back, {user?.name}! Track your orders here.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <div className="no-orders-icon">📦</div>
                        <h2>No orders yet</h2>
                        <p>Start ordering your favorite coffee and pastries!</p>
                        <button className="browse-menu-btn" onClick={() => navigate('/menu')}>
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="orders-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                                onClick={() => setActiveTab('current')}
                            >
                                Current Orders ({getCurrentOrders().length})
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                                onClick={() => setActiveTab('past')}
                            >
                                Past Orders ({getPastOrders().length})
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="orders-filters">
                            <div className="filter-group">
                                <label>Date Range:</label>
                                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                                    <option value="all">All Time</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                </select>
                            </div>

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
                                <p>No orders found with current filters</p>
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

                                    // Only show orders up to displayedOrders limit
                                    const ordersToShow = groupOrders.filter(order =>
                                        visibleOrders.includes(order)
                                    );

                                    if (ordersToShow.length === 0) return null;

                                    return (
                                        <div key={groupKey} className="order-group">
                                            <h3 className="group-title">{groupTitle}</h3>
                                            <div className={`orders-grid ${viewMode}`}>
                                                {ordersToShow.map((order) => (
                                                    <div key={order.id} className={`order-card ${viewMode}`}>
                                                        <div className="order-card-header">
                                                            <div className="order-info">
                                                                <h3>
                                                                    Order #{order.id}
                                                                    <span className="payment-badge" style={{
                                                                        background: getPaymentStatus(order) === 'Paid' ? '#4caf5020' :
                                                                            getPaymentStatus(order) === 'Refunded' ? '#f4433620' : '#ff980020',
                                                                        color: getPaymentStatus(order) === 'Paid' ? '#4caf50' :
                                                                            getPaymentStatus(order) === 'Refunded' ? '#f44336' : '#ff9800'
                                                                    }}>
                                    {getPaymentStatus(order)}
                                  </span>
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
                                                                        <p className="order-item-name">{item.menuItem.name}</p>
                                                                        <p className="order-item-quantity">Qty: {item.quantity}</p>
                                                                    </div>
                                                                    <p className="order-item-price">
                                                                        ${(parseFloat(item.priceAtOrder) * item.quantity).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {order.specialInstructions && viewMode === 'large' && (
                                                            <div className="order-instructions">
                                                                <strong>Special Instructions:</strong>
                                                                <p>{order.specialInstructions}</p>
                                                            </div>
                                                        )}

                                                        <div className="order-card-footer">
                                                            <div className="order-total">
                                                                <span>Total:</span>
                                                                <span className="total-amount">${parseFloat(order.total).toFixed(2)}</span>
                                                            </div>
                                                            <div className="order-actions">
                                                                {order.status === 'PENDING' && (
                                                                    <button
                                                                        className="cancel-order-btn"
                                                                        onClick={() => handleCancelOrder(order.id)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                                {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                                                                    <button
                                                                        className="reorder-btn"
                                                                        onClick={() => handleReorder(order)}
                                                                    >
                                                                        Reorder
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="view-details-btn"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setShowInvoice(false);
                                                                    }}
                                                                >
                                                                    Details
                                                                </button>
                                                                <button
                                                                    className="invoice-btn"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setShowInvoice(true);
                                                                    }}
                                                                >
                                                                    Invoice
                                                                </button>
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
                    </>
                )}

                {/* Order Details Modal */}
                {selectedOrder && !showInvoice && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Order #{selectedOrder.id} Details</h2>
                                <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>×</button>
                            </div>

                            <div className="modal-body">
                                <div className="detail-row">
                                    <span>Status:</span>
                                    <span style={{ color: getStatusColor(selectedOrder.status), fontWeight: '600' }}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                                </div>

                                <div className="detail-row">
                                    <span>Payment Status:</span>
                                    <span style={{ fontWeight: '600' }}>{getPaymentStatus(selectedOrder)}</span>
                                </div>

                                <div className="detail-row">
                                    <span>Order Date:</span>
                                    <span>
                    {new Date(selectedOrder.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                  </span>
                                </div>

                                {selectedOrder.completedAt && (
                                    <div className="detail-row">
                                        <span>Completed At:</span>
                                        <span>
                      {new Date(selectedOrder.completedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}
                    </span>
                                    </div>
                                )}

                                {selectedOrder.chefName && (
                                    <div className="detail-row">
                                        <span>Prepared by:</span>
                                        <span>{selectedOrder.chefName}</span>
                                    </div>
                                )}

                                <hr />

                                <h3>Items:</h3>
                                <div className="modal-items">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="modal-item">
                                            <span>{item.quantity}x {item.menuItem.name}</span>
                                            <span>${(parseFloat(item.priceAtOrder) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {selectedOrder.specialInstructions && (
                                    <>
                                        <hr />
                                        <div className="detail-row">
                                            <strong>Special Instructions:</strong>
                                        </div>
                                        <p style={{ marginTop: '8px', color: '#666' }}>
                                            {selectedOrder.specialInstructions}
                                        </p>
                                    </>
                                )}

                                <hr />

                                <div className="detail-row">
                                    <span>Subtotal:</span>
                                    <span>${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Tax (8%):</span>
                                    <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                                </div>
                                {parseFloat(selectedOrder.discount) > 0 && (
                                    <div className="detail-row" style={{ color: '#4caf50' }}>
                                        <span>Discount:</span>
                                        <span>-${parseFloat(selectedOrder.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="detail-row" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '10px' }}>
                                    <span>Total:</span>
                                    <span>${parseFloat(selectedOrder.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Modal */}
                {selectedOrder && showInvoice && (
                    <div className="modal-overlay" onClick={() => {
                        setShowInvoice(false);
                        setSelectedOrder(null);
                    }}>
                        <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header no-print">
                                <h2>Order Invoice</h2>
                                <div>
                                    <button className="print-btn" onClick={handlePrintInvoice}>🖨️ Print</button>
                                    <button className="close-modal-btn" onClick={() => {
                                        setShowInvoice(false);
                                        setSelectedOrder(null);
                                    }}>×</button>
                                </div>
                            </div>

                            <div className="invoice-content">
                                <div className="invoice-header">
                                    <h1>☕ JavaBite Coffee</h1>
                                    <p>123 Coffee Street, Downtown</p>
                                    <p>Phone: (555) 123-4567</p>
                                </div>

                                <div className="invoice-details">
                                    <div className="invoice-row">
                                        <div>
                                            <strong>Invoice #:</strong> {selectedOrder.id}
                                        </div>
                                        <div>
                                            <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="invoice-row">
                                        <div>
                                            <strong>Customer:</strong> {selectedOrder.customerName}
                                        </div>
                                        <div>
                                            <strong>Payment:</strong> {getPaymentStatus(selectedOrder)}
                                        </div>
                                    </div>
                                    <div className="invoice-row">
                                        <div>
                                            <strong>Table : </strong> {selectedOrder.tableNumber}
                                        </div>

                                    </div>
                                </div>

                                <table className="invoice-table">
                                    <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedOrder.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.menuItem.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>${parseFloat(item.priceAtOrder).toFixed(2)}</td>
                                            <td>${(parseFloat(item.priceAtOrder) * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                <div className="invoice-totals">
                                    <div className="invoice-total-row">
                                        <span>Subtotal:</span>
                                        <span>${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="invoice-total-row">
                                        <span>Tax (8%):</span>
                                        <span>${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                                    </div>
                                    {parseFloat(selectedOrder.discount) > 0 && (
                                        <div className="invoice-total-row discount">
                                            <span>Discount:</span>
                                            <span>-${parseFloat(selectedOrder.discount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="invoice-total-row grand-total">
                                        <span>Total:</span>
                                        <span>${parseFloat(selectedOrder.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="invoice-footer">
                                    <p>Thank you for your order!</p>
                                    <p>Visit us again soon ☕</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrdersPage;