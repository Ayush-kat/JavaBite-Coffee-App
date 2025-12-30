import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi, bookingApi } from '../api/api.js';
import '../styles/Checkout.css';

const CheckoutPage = ({ cart = [], setCart }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [saveCard, setSaveCard] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [couponCode, setCouponCode] = useState('');

    // ✅ NEW: Table booking validation states
    const [checkingBooking, setCheckingBooking] = useState(true);
    const [activeBooking, setActiveBooking] = useState(null);
    const [bookingError, setBookingError] = useState('');

    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });

    const [billingInfo, setBillingInfo] = useState({
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: ''
    });

    const [specialInstructions, setSpecialInstructions] = useState('');

    // ✅ Check authentication
    useEffect(() => {
        if (!isAuthenticated) {
            alert('Please login to place an order');
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // ✅ CRITICAL: Check for active table booking on mount
    useEffect(() => {
        const checkActiveBooking = async () => {
            if (!isAuthenticated) return;

            setCheckingBooking(true);
            try {
                const bookings = await bookingApi.getMyBookings();

                // Find active or confirmed booking for today or future
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const active = bookings.find(booking => {
                    const bookingDate = new Date(booking.bookingDate);
                    const isValidStatus = booking.status === 'CONFIRMED' || booking.status === 'ACTIVE';
                    const isValidDate = bookingDate >= today;
                    return isValidStatus && isValidDate;
                });

                if (active) {
                    setActiveBooking(active);
                    setBookingError('');
                } else {
                    setBookingError('No active table booking found. Please book a table before placing an order.');
                    setActiveBooking(null);
                }
            } catch (err) {
                console.error('Failed to check booking:', err);
                setBookingError('Failed to verify table booking. Please try again.');
            } finally {
                setCheckingBooking(false);
            }
        };

        checkActiveBooking();
    }, [isAuthenticated]);

    // Group items by ID to show quantity
    const groupedCart = cart.reduce((acc, item) => {
        const existingItem = acc.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            acc.push({ ...item, quantity: 1 });
        }
        return acc;
    }, []);

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + item.price, 0);
    };

    const getTax = () => {
        return getSubtotal() * 0.08;
    };

    const getTotal = () => {
        return getSubtotal() + getTax();
    };

    const handleCardInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') {
            value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
            value = value.substring(0, 19);
        } else if (name === 'expiryDate') {
            value = value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
        } else if (name === 'cvv') {
            value = value.replace(/\D/g, '').substring(0, 3);
        }
        setCardDetails({ ...cardDetails, [name]: value });
    };

    const handleBillingChange = (e) => {
        setBillingInfo({ ...billingInfo, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (!isAuthenticated) {
            alert('Please login to place an order');
            navigate('/login');
            return;
        }

        // ✅ CRITICAL: Validate active booking before order
        if (!activeBooking) {
            setError('You must have an active table booking to place an order. Please book a table first.');
            return;
        }

        // ✅ Validate card details if payment method is card
        if (paymentMethod === 'card') {
            if (!cardDetails.cardNumber || !cardDetails.cardName ||
                !cardDetails.expiryDate || !cardDetails.cvv) {
                setError('Please fill in all card details');
                return;
            }

            // Basic card validation
            if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
                setError('Invalid card number');
                return;
            }

            if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
                setError('Invalid expiry date format (MM/YY)');
                return;
            }

            if (cardDetails.cvv.length !== 3) {
                setError('Invalid CVV');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            // Prepare order data
            const orderData = {
                items: groupedCart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity,
                    notes: null
                })),
                specialInstructions: specialInstructions || null,
                couponCode: couponCode || null,
                tableBookingId: activeBooking.id,  // ✅ Link to booking
                paymentMethod: paymentMethod.toUpperCase() // ✅ FIX: Send payment method ("CASH" or "CARD")
            };

            console.log('Creating order with booking:', orderData);

            // Create order via API
            const order = await orderApi.createOrder(orderData);
            setOrderDetails(order);
            setOrderPlaced(true);

            // Clear cart after successful order
            setTimeout(() => {
                setCart([]);
                navigate('/customer/orders');
            }, 3000);
        } catch (err) {
            console.error('Order placement failed:', err);
            setError(err.message || 'Failed to place order. Please ensure you have an active table booking.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Show loading while checking booking
    if (checkingBooking) {
        return (
            <div className="checkout-page">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: '20px'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #d7ccc8',
                        borderTopColor: '#6d5739',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontSize: '1.2rem', color: '#6d5739' }}>Verifying table booking...</p>
                </div>
            </div>
        );
    }

    // ✅ Show booking error with action button
    if (bookingError && !activeBooking) {
        return (
            <div className="checkout-page">
                <div className="booking-required-message">
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '600px',
                        margin: '0 auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '16px'
                        }}>
                            Table Booking Required
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: '#6d4c41',
                            marginBottom: '32px',
                            lineHeight: '1.6'
                        }}>
                            {bookingError}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button
                                onClick={() => navigate('/book-table')}
                                style={{
                                    padding: '14px 32px',
                                    background: '#6d5739',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Book a Table Now
                            </button>
                            <button
                                onClick={() => navigate('/menu')}
                                style={{
                                    padding: '14px 32px',
                                    background: 'white',
                                    color: '#6d5739',
                                    border: '2px solid #6d5739',
                                    borderRadius: '30px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0 && !orderPlaced) {
        return (
            <div className="checkout-page">
                <div className="empty-checkout">
                    <div className="empty-checkout-content">
                        <div className="empty-checkout-icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Add items to proceed with checkout</p>
                        <button className="return-btn" onClick={() => navigate('/menu')}>
                            Browse Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="checkout-page">
                <div className="order-success">
                    <div className="success-animation">
                        <div className="success-checkmark">✓</div>
                    </div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Thank you for your order. Your delicious items will be ready soon!</p>
                    <div className="order-details">
                        <p><strong>Order Number:</strong> #{orderDetails?.id}</p>
                        <p><strong>Table Number:</strong> {activeBooking?.tableNumber || 'Assigned'}</p>
                        <p><strong>Order Total:</strong> ${orderDetails?.total || getTotal().toFixed(2)}</p>
                        <p><strong>Status:</strong> {orderDetails?.status || 'Pending'}</p>
                    </div>
                    <p className="redirect-message">Redirecting to your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                {/* Payment Section */}
                <div className="payment-section">
                    <div className="checkout-header">
                        <h1>Payment</h1>
                        <p className="checkout-subtitle">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* ✅ Show active booking info */}
                    {activeBooking && (
                        <div style={{
                            background: '#e8f5e9',
                            border: '2px solid #4caf50',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '24px' }}>✓</span>
                            <div>
                                <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: '4px' }}>
                                    Table Booking Confirmed
                                </div>
                                <div style={{ fontSize: '14px', color: '#1b5e20' }}>
                                    Table {activeBooking.tableNumber} • {new Date(activeBooking.bookingDate).toLocaleDateString()} at {activeBooking.bookingTime}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #ef5350'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePlaceOrder} className="checkout-form">
                        {/* Billing Information */}
                        <div className="form-section">
                            <h3 className="section-heading">Billing Information</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={billingInfo.email}
                                        onChange={handleBillingChange}
                                        placeholder="you@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Special Instructions (Optional)</label>
                                    <textarea
                                        value={specialInstructions}
                                        onChange={(e) => setSpecialInstructions(e.target.value)}
                                        placeholder="Any special requests for your order?"
                                        rows="3"
                                        disabled={loading}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #d7ccc8',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Coupon Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter coupon code"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="form-section">
                            <h3 className="section-heading">Payment Method</h3>
                            <div className="payment-option">
                                <label className="payment-method-label">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>Credit/Debit Card</span>
                                </label>
                                {paymentMethod === 'card' && (
                                    <div className="card-form">
                                        <div className="form-group full-width">
                                            <label>Card Number *</label>
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                value={cardDetails.cardNumber}
                                                onChange={handleCardInputChange}
                                                placeholder="1234 5678 9012 3456"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Name on Card *</label>
                                            <input
                                                type="text"
                                                name="cardName"
                                                value={cardDetails.cardName}
                                                onChange={handleCardInputChange}
                                                placeholder="John Doe"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Expiry Date *</label>
                                                <input
                                                    type="text"
                                                    name="expiryDate"
                                                    value={cardDetails.expiryDate}
                                                    onChange={handleCardInputChange}
                                                    placeholder="MM/YY"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>CVV *</label>
                                                <input
                                                    type="text"
                                                    name="cvv"
                                                    value={cardDetails.cvv}
                                                    onChange={handleCardInputChange}
                                                    placeholder="123"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="place-order-btn"
                            disabled={loading || !activeBooking}
                        >
                            {loading ? 'Processing...' : `Place Order & Pay · $${getTotal().toFixed(2)}`}
                        </button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="order-summary-sidebar">
                    <div className="summary-card">
                        <h3>Order Summary</h3>
                        <div className="summary-items">
                            {groupedCart.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="summary-item-info">
                                        <p className="summary-item-name">{item.name}</p>
                                        <p className="summary-item-quantity">{item.quantity}x</p>
                                    </div>
                                    <p className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>${getSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax & Fees (8%)</span>
                                <span>${getTax().toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default CheckoutPage;