import React from 'react';

const BookingDetailsModal = ({ booking, onClose, onRefresh }) => {
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

    const formatDateTime = (dateStr, timeStr) => {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} at ${timeStr}`;
    };

    const statusStyle = getStatusColor(booking.status);

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(62, 39, 35, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
        },
        modal: {
            background: 'white',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.4s ease'
        },
        header: {
            padding: '32px 40px',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #d7ccc8'
        },
        titleSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#3e2723',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        statusBadge: {
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        },
        closeBtn: {
            background: 'white',
            border: '2px solid #d7ccc8',
            fontSize: '28px',
            color: '#6d4c41',
            cursor: 'pointer',
            padding: '8px',
            width: '44px',
            height: '44px',
            lineHeight: '1',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        body: {
            padding: '40px'
        },
        section: {
            marginBottom: '36px'
        },
        sectionTitle: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#3e2723',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '3px solid #f5f0e8',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        detailsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
        },
        detailRow: {
            padding: '20px',
            background: '#f8f4f0',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            border: '2px solid transparent'
        },
        detailLabel: {
            fontSize: '12px',
            color: '#8d6e63',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '10px',
            letterSpacing: '0.5px'
        },
        detailValue: {
            fontSize: '20px',
            color: '#3e2723',
            fontWeight: '700'
        },
        infoBox: {
            padding: '24px',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderRadius: '16px',
            borderLeft: '5px solid #ff9800',
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.1)'
        },
        infoText: {
            fontSize: '15px',
            color: '#e65100',
            fontWeight: '600',
            lineHeight: '1.8'
        },
        refundBox: {
            padding: '24px',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '16px',
            borderLeft: '5px solid #4caf50',
            marginTop: '20px',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)'
        },
        refundTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#2e7d32',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        refundDetail: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            fontSize: '15px',
            padding: '12px 0',
            borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
        },
        refundLabel: {
            color: '#555',
            fontWeight: '600'
        },
        refundValue: {
            color: '#2e7d32',
            fontWeight: '700'
        },
        cancellationBox: {
            padding: '24px',
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            borderRadius: '16px',
            borderLeft: '5px solid #f44336',
            marginTop: '20px',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
        },
        cancellationTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#c62828',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        cancellationText: {
            fontSize: '15px',
            color: '#d32f2f',
            lineHeight: '1.6',
            fontWeight: '600'
        },
        footer: {
            padding: '24px 40px',
            borderTop: '3px solid #f5f0e8',
            display: 'flex',
            justifyContent: 'center',
            background: '#fafafa',
            borderRadius: '0 0 24px 24px'
        },
        btnClose: {
            padding: '14px 40px',
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
        },
        specialRequestBox: {
            padding: '20px 24px',
            background: '#fff3e0',
            borderRadius: '12px',
            borderLeft: '4px solid #ff9800'
        },
        specialRequestLabel: {
            fontSize: '12px',
            color: '#e65100',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '8px'
        },
        specialRequestText: {
            fontSize: '15px',
            color: '#6d4c41',
            lineHeight: '1.7'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.titleSection}>
                        <h2 style={styles.title}>
                            📋 Booking Details
                        </h2>
                        <div
                            style={{
                                ...styles.statusBadge,
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `2px solid ${statusStyle.border}`
                            }}
                        >
                            {statusStyle.icon} {booking.status}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={styles.closeBtn}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#8b6f47';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'rotate(90deg)';
                            e.target.style.borderColor = '#8b6f47';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#6d4c41';
                            e.target.style.transform = 'rotate(0deg)';
                            e.target.style.borderColor = '#d7ccc8';
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    {/* Booking Details */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                            📅 Reservation Information
                        </h3>
                        <div style={styles.detailsGrid}>
                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>📋 Booking ID</div>
                                <div style={styles.detailValue}>#{booking.id}</div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>🪑 Table Number</div>
                                <div style={{...styles.detailValue, color: '#8b6f47'}}>
                                    Table {booking.tableNumber}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>👥 Number of Guests</div>
                                <div style={styles.detailValue}>{booking.numberOfGuests} people</div>
                            </div>

                            <div
                                style={{...styles.detailRow, gridColumn: '1 / -1'}}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>📅 Date & Time</div>
                                <div style={styles.detailValue}>
                                    {formatDateTime(booking.bookingDate, booking.bookingTime)}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>📆 Booked On</div>
                                <div style={styles.detailValue}>
                                    {new Date(booking.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = '#8b6f47';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={styles.detailLabel}>🔖 Status</div>
                                <div style={styles.detailValue}>{booking.status}</div>
                            </div>
                        </div>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                📝 Special Requests
                            </h3>
                            <div style={styles.specialRequestBox}>
                                <div style={styles.specialRequestLabel}>Your Notes:</div>
                                <p style={styles.specialRequestText}>{booking.specialRequests}</p>
                            </div>
                        </div>
                    )}

                    {/* Cancellation & Refund Info */}
                    {booking.status === 'CANCELLED' && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                ❌ Cancellation Details
                            </h3>

                            <div style={styles.cancellationBox}>
                                <div style={styles.cancellationTitle}>
                                    ✕ Booking Cancelled
                                </div>
                                {booking.cancellationReason && (
                                    <p style={styles.cancellationText}>
                                        <strong>Reason:</strong> {booking.cancellationReason}
                                    </p>
                                )}
                                {booking.cancelledAt && (
                                    <p style={styles.cancellationText}>
                                        <strong>Cancelled On:</strong>{' '}
                                        {new Date(booking.cancelledAt).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            {booking.refundStatus && booking.refundStatus !== 'NONE' && (
                                <div style={styles.refundBox}>
                                    <div style={styles.refundTitle}>
                                        💰 Refund Status
                                    </div>
                                    <div style={styles.refundDetail}>
                                        <span style={styles.refundLabel}>Status:</span>
                                        <span style={styles.refundValue}>
                                            {booking.refundStatus === 'COMPLETED' ? '✅ Completed' : '⏳ Pending'}
                                        </span>
                                    </div>
                                    {booking.refundAmount && booking.refundAmount > 0 && (
                                        <div style={styles.refundDetail}>
                                            <span style={styles.refundLabel}>Amount:</span>
                                            <span style={styles.refundValue}>
                                                ${booking.refundAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {booking.refundedAt && (
                                        <div style={styles.refundDetail}>
                                            <span style={styles.refundLabel}>Processed On:</span>
                                            <span style={styles.refundValue}>
                                                {new Date(booking.refundedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {booking.refundStatus === 'PENDING' && (
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '12px',
                                            background: 'rgba(46, 125, 50, 0.1)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            color: '#2e7d32',
                                            fontStyle: 'italic'
                                        }}>
                                            ℹ️ Your refund is being processed. It will be credited within 3-5 business days.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Booking Info */}
                    {(booking.status === 'CONFIRMED' || booking.status === 'ACTIVE') && (
                        <div style={styles.section}>
                            <div style={styles.infoBox}>
                                <p style={styles.infoText}>
                                    ℹ️ <strong>Important:</strong> Please arrive on time for your reservation.
                                    If you need to cancel, do so at least 24 hours in advance for a full refund.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.footer}>
                    <button
                        onClick={onClose}
                        style={styles.btnClose}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(139, 111, 71, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                        }}
                    >
                        Close Details
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default BookingDetailsModal;