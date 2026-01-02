import React, { useState, useEffect } from 'react';
import { customerApi } from '../api/api';
import BookingDetailsModal from './BookingDetailsModal';

const BookingHistoryPage = () => {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [pastBookings, setPastBookings] = useState([]);
    const [stats, setStats] = useState({});
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchBookings();
        fetchStats();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getBookingHistory();
            setBookings(response);

            // Separate into upcoming and past
            const now = new Date();
            const upcoming = response.filter(b => {
                const bookingDateTime = new Date(`${b.bookingDate}T${b.bookingTime}`);
                return bookingDateTime > now && (b.status === 'CONFIRMED' || b.status === 'ACTIVE');
            });

            const past = response.filter(b => {
                const bookingDateTime = new Date(`${b.bookingDate}T${b.bookingTime}`);
                return bookingDateTime <= now || b.status === 'COMPLETED' || b.status === 'CANCELLED';
            });

            setUpcomingBookings(upcoming);
            setPastBookings(past);
        } catch (err) {
            setError('Failed to load bookings');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const statsData = await customerApi.getBookingStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setShowDetailsModal(true);
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? You may be eligible for a refund.')) {
            return;
        }

        try {
            const reason = prompt('Please provide a reason for cancellation (optional):');
            await customerApi.cancelBooking(bookingId, reason || 'Cancelled by customer');
            setSuccess('Booking cancelled successfully! Refund will be processed.');
            setTimeout(() => setSuccess(''), 3000);
            fetchBookings();
            fetchStats();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel booking');
            setTimeout(() => setError(''), 3000);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50', icon: '✓' };
            case 'ACTIVE':
                return { bg: '#e3f2fd', color: '#1565c0', border: '#2196f3', icon: '🔵' };
            case 'COMPLETED':
                return { bg: '#f3e5f5', color: '#6a1b9a', border: '#9c27b0', icon: '✓' };
            case 'CANCELLED':
                return { bg: '#ffebee', color: '#c62828', border: '#f44336', icon: '✕' };
            default:
                return { bg: '#f5f5f5', color: '#666', border: '#ccc', icon: '○' };
        }
    };

    const getRefundStatusBadge = (refundStatus) => {
        if (refundStatus === 'COMPLETED') {
            return { text: 'REFUNDED', bg: '#e8f5e9', color: '#2e7d32', icon: '💰' };
        } else if (refundStatus === 'PENDING') {
            return { text: 'REFUND PENDING', bg: '#fff3e0', color: '#e65100', icon: '⏳' };
        }
        return null;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        return timeStr;
    };

    const filteredBookings = (bookingList) => {
        if (!searchTerm) return bookingList;
        return bookingList.filter(b =>
            b.id.toString().includes(searchTerm) ||
            b.tableNumber.toString().includes(searchTerm) ||
            b.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            padding: '40px 20px'
        },
        innerContainer: {
            maxWidth: '1400px',
            margin: '0 auto'
        },
        header: {
            textAlign: 'center',
            marginBottom: '48px'
        },
        title: {
            fontSize: '48px',
            fontWeight: '700',
            color: '#3e2723',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
        },
        subtitle: {
            fontSize: '18px',
            color: '#6d4c41'
        },
        searchBar: {
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'center'
        },
        searchInput: {
            width: '100%',
            maxWidth: '600px',
            padding: '16px 24px',
            border: '2px solid #d7ccc8',
            borderRadius: '30px',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        alert: {
            padding: '16px 24px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '16px',
            fontWeight: '600',
            animation: 'slideIn 0.3s ease'
        },
        alertSuccess: {
            background: '#e8f5e9',
            border: '2px solid #4caf50',
            color: '#2e7d32'
        },
        alertError: {
            background: '#ffebee',
            border: '2px solid #f44336',
            color: '#c62828'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '48px'
        },
        statCard: {
            background: 'white',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '3px solid transparent'
        },
        statIcon: {
            fontSize: '40px',
            marginBottom: '12px'
        },
        statValue: {
            fontSize: '42px',
            fontWeight: '700',
            color: '#3e2723',
            marginBottom: '8px'
        },
        statLabel: {
            fontSize: '14px',
            color: '#6d4c41',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        section: {
            marginBottom: '48px'
        },
        sectionHeader: {
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        sectionTitle: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#3e2723',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        badge: {
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700',
            marginLeft: '12px'
        },
        bookingsGrid: {
            display: 'grid',
            gap: '24px'
        },
        bookingCard: {
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            border: '2px solid transparent'
        },
        bookingHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f5f0e8'
        },
        bookingId: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#3e2723',
            marginBottom: '8px'
        },
        bookingDate: {
            fontSize: '16px',
            color: '#6d4c41',
            fontWeight: '600'
        },
        statusBadge: (status) => {
            const colors = getStatusColor(status);
            return {
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                background: colors.bg,
                color: colors.color,
                border: `2px solid ${colors.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.5px'
            };
        },
        bookingDetails: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
        },
        detailItem: {
            padding: '16px',
            background: '#f8f4f0',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
        },
        detailLabel: {
            fontSize: '12px',
            color: '#8d6e63',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
        },
        detailValue: {
            fontSize: '18px',
            color: '#3e2723',
            fontWeight: '700'
        },
        specialRequests: {
            marginTop: '20px',
            padding: '16px 20px',
            background: '#fff3e0',
            borderRadius: '12px',
            borderLeft: '4px solid #ff9800'
        },
        specialRequestsLabel: {
            fontSize: '12px',
            color: '#e65100',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '8px'
        },
        specialRequestsText: {
            fontSize: '14px',
            color: '#6d4c41',
            lineHeight: '1.6'
        },
        refundBadge: (refundStatus) => {
            const badge = getRefundStatusBadge(refundStatus);
            if (!badge) return { display: 'none' };
            return {
                padding: '10px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                background: badge.bg,
                color: badge.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '16px'
            };
        },
        cancellationInfo: {
            marginTop: '16px',
            padding: '16px 20px',
            background: '#ffebee',
            borderRadius: '12px',
            borderLeft: '4px solid #f44336'
        },
        cancellationText: {
            fontSize: '14px',
            color: '#c62828',
            fontWeight: '600'
        },
        actions: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '2px solid #f5f0e8'
        },
        btn: {
            padding: '12px 28px',
            border: 'none',
            borderRadius: '25px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        },
        btnPrimary: {
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
        },
        btnDanger: {
            background: 'white',
            color: '#f44336',
            border: '2px solid #f44336'
        },
        emptyState: {
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        },
        emptyIcon: {
            fontSize: '80px',
            marginBottom: '24px',
            opacity: 0.5
        },
        emptyTitle: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#3e2723',
            marginBottom: '12px'
        },
        emptyText: {
            fontSize: '16px',
            color: '#6d4c41'
        },
        loadingContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 20px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        },
        spinner: {
            width: '60px',
            height: '60px',
            border: '6px solid #f5f0e8',
            borderTop: '6px solid #8b6f47',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        },
        loadingText: {
            marginTop: '24px',
            fontSize: '18px',
            color: '#6d4c41',
            fontWeight: '600'
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.innerContainer}>
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Loading your bookings...</p>
                    </div>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.innerContainer}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>
                        📅 My Table Reservations
                    </h1>
                    <p style={styles.subtitle}>View and manage your booking history</p>
                </div>

                {/* Alerts */}
                {success && (
                    <div style={{...styles.alert, ...styles.alertSuccess}}>
                        <span>✓</span>
                        <span>{success}</span>
                    </div>
                )}

                {error && (
                    <div style={{...styles.alert, ...styles.alertError}}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Search Bar */}
                <div style={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="🔍 Search by booking ID, table number, or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#8b6f47';
                            e.target.style.boxShadow = '0 6px 16px rgba(139, 111, 71, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#d7ccc8';
                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                    />
                </div>

                {/* Statistics */}
                <div style={styles.statsGrid}>
                    <div
                        style={styles.statCard}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = '#8b6f47';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={styles.statIcon}>📚</div>
                        <div style={styles.statValue}>{stats.totalBookings || 0}</div>
                        <div style={styles.statLabel}>Total Bookings</div>
                    </div>
                    <div
                        style={styles.statCard}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = '#4caf50';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={styles.statIcon}>🟢</div>
                        <div style={styles.statValue}>{stats.upcomingBookings || 0}</div>
                        <div style={styles.statLabel}>Upcoming</div>
                    </div>
                    <div
                        style={styles.statCard}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = '#9c27b0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={styles.statIcon}>✅</div>
                        <div style={styles.statValue}>{stats.completedBookings || 0}</div>
                        <div style={styles.statLabel}>Completed</div>
                    </div>
                    <div
                        style={styles.statCard}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = '#4caf50';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={styles.statIcon}>💰</div>
                        <div style={styles.statValue}>{stats.refundedBookings || 0}</div>
                        <div style={styles.statLabel}>Refunded</div>
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>
                            🟢 Upcoming Reservations
                            <span style={{...styles.badge, background: '#e8f5e9', color: '#2e7d32'}}>
                                {filteredBookings(upcomingBookings).length}
                            </span>
                        </h2>
                    </div>

                    {filteredBookings(upcomingBookings).length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📅</div>
                            <h3 style={styles.emptyTitle}>No Upcoming Bookings</h3>
                            <p style={styles.emptyText}>You don't have any upcoming reservations</p>
                        </div>
                    ) : (
                        <div style={styles.bookingsGrid}>
                            {filteredBookings(upcomingBookings).map((booking) => (
                                <div
                                    key={booking.id}
                                    style={styles.bookingCard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = '#8b6f47';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    <div style={styles.bookingHeader}>
                                        <div>
                                            <div style={styles.bookingId}>Booking #{booking.id}</div>
                                            <div style={styles.bookingDate}>
                                                📅 {formatDate(booking.bookingDate)} • 🕐 {formatTime(booking.bookingTime)}
                                            </div>
                                        </div>
                                        <div style={styles.statusBadge(booking.status)}>
                                            {getStatusColor(booking.status).icon} {booking.status}
                                        </div>
                                    </div>

                                    <div style={styles.bookingDetails}>
                                        <div
                                            style={styles.detailItem}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0e6dc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f4f0'}
                                        >
                                            <span style={styles.detailLabel}>Table</span>
                                            <span style={styles.detailValue}>🪑 Table {booking.tableNumber}</span>
                                        </div>
                                        <div
                                            style={styles.detailItem}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0e6dc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f4f0'}
                                        >
                                            <span style={styles.detailLabel}>Guests</span>
                                            <span style={styles.detailValue}>👥 {booking.numberOfGuests} people</span>
                                        </div>
                                    </div>

                                    {booking.specialRequests && (
                                        <div style={styles.specialRequests}>
                                            <div style={styles.specialRequestsLabel}>📝 Special Requests:</div>
                                            <p style={styles.specialRequestsText}>{booking.specialRequests}</p>
                                        </div>
                                    )}

                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => handleViewDetails(booking)}
                                            style={{...styles.btn, ...styles.btnPrimary}}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 8px 20px rgba(139, 111, 71, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                                            }}
                                        >
                                            👁️ View Details
                                        </button>
                                        <button
                                            onClick={() => handleCancelBooking(booking.id)}
                                            style={{...styles.btn, ...styles.btnDanger}}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#f44336';
                                                e.target.style.color = 'white';
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'white';
                                                e.target.style.color = '#f44336';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            ✕ Cancel Booking
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Bookings */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>
                            📖 Past Reservations
                            <span style={{...styles.badge, background: '#f3e5f5', color: '#6a1b9a'}}>
                                {filteredBookings(pastBookings).length}
                            </span>
                        </h2>
                    </div>

                    {filteredBookings(pastBookings).length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📜</div>
                            <h3 style={styles.emptyTitle}>No Past Bookings</h3>
                            <p style={styles.emptyText}>Your booking history will appear here</p>
                        </div>
                    ) : (
                        <div style={styles.bookingsGrid}>
                            {filteredBookings(pastBookings).map((booking) => (
                                <div
                                    key={booking.id}
                                    style={styles.bookingCard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = '#8b6f47';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    <div style={styles.bookingHeader}>
                                        <div>
                                            <div style={styles.bookingId}>Booking #{booking.id}</div>
                                            <div style={styles.bookingDate}>
                                                📅 {formatDate(booking.bookingDate)} • 🕐 {formatTime(booking.bookingTime)}
                                            </div>
                                        </div>
                                        <div style={styles.statusBadge(booking.status)}>
                                            {getStatusColor(booking.status).icon} {booking.status}
                                        </div>
                                    </div>

                                    <div style={styles.bookingDetails}>
                                        <div
                                            style={styles.detailItem}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0e6dc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f4f0'}
                                        >
                                            <span style={styles.detailLabel}>Table</span>
                                            <span style={styles.detailValue}>🪑 Table {booking.tableNumber}</span>
                                        </div>
                                        <div
                                            style={styles.detailItem}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0e6dc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f4f0'}
                                        >
                                            <span style={styles.detailLabel}>Guests</span>
                                            <span style={styles.detailValue}>👥 {booking.numberOfGuests} people</span>
                                        </div>
                                    </div>

                                    {booking.status === 'CANCELLED' && booking.refundStatus && (
                                        <div>
                                            {booking.refundStatus !== 'NONE' && (
                                                <div style={styles.refundBadge(booking.refundStatus)}>
                                                    {getRefundStatusBadge(booking.refundStatus)?.icon} {getRefundStatusBadge(booking.refundStatus)?.text}
                                                </div>
                                            )}
                                            {booking.cancellationReason && (
                                                <div style={styles.cancellationInfo}>
                                                    <span style={styles.cancellationText}>
                                                        📝 Reason: {booking.cancellationReason}
                                                    </span>
                                                </div>
                                            )}
                                            {booking.refundAmount && booking.refundAmount > 0 && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '12px 16px',
                                                    background: '#e8f5e9',
                                                    borderRadius: '12px',
                                                    fontSize: '15px',
                                                    color: '#2e7d32',
                                                    fontWeight: '700'
                                                }}>
                                                    💰 Refund Amount: ${booking.refundAmount.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => handleViewDetails(booking)}
                                            style={{...styles.btn, ...styles.btnPrimary}}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 8px 20px rgba(139, 111, 71, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                                            }}
                                        >
                                            👁️ View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedBooking(null);
                    }}
                    onRefresh={fetchBookings}
                />
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default BookingHistoryPage;