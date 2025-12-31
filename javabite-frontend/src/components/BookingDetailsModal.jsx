import React from 'react';

const BookingDetailsModal = ({ booking, onClose, onRefresh }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50' };
            case 'ACTIVE':
                return { bg: '#e3f2fd', color: '#1565c0', border: '#2196f3' };
            case 'COMPLETED':
                return { bg: '#f3e5f5', color: '#6a1b9a', border: '#9c27b0' };
            case 'CANCELLED':
                return { bg: '#ffebee', color: '#c62828', border: '#f44336' };
            default:
                return { bg: '#f5f5f5', color: '#666', border: '#ccc' };
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
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
        },
        modal: {
            background: 'white',
            borderRadius: '20px',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.4s ease'
        },
        header: {
            padding: '28px 36px',
            borderBottom: '2px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        },
        titleSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: 0
        },
        statusBadge: {
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
        closeBtn: {
            background: '#f5f5f5',
            border: 'none',
            fontSize: '28px',
            color: '#7f8c8d',
            cursor: 'pointer',
            padding: '8px',
            width: '40px',
            height: '40px',
            lineHeight: '1',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
        },
        body: {
            padding: '36px'
        },
        section: {
            marginBottom: '32px'
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        detailsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
        },
        detailRow: {
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '12px',
            transition: 'transform 0.2s ease'
        },
        detailLabel: {
            fontSize: '12px',
            color: '#7f8c8d',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
        },
        detailValue: {
            fontSize: '18px',
            color: '#2c3e50',
            fontWeight: '700'
        },
        fullWidth: {
            gridColumn: '1 / -1'
        },
        infoBox: {
            padding: '20px',
            background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
            borderRadius: '12px',
            borderLeft: '5px solid #fbc02d'
        },
        infoText: {
            fontSize: '14px',
            color: '#f57f17',
            fontWeight: '600',
            lineHeight: '1.6'
        },
        refundBox: {
            padding: '20px',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '12px',
            borderLeft: '5px solid #4caf50',
            marginTop: '16px'
        },
        refundTitle: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#2e7d32',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        refundDetail: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px'
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
            padding: '20px',
            background: '#ffebee',
            borderRadius: '12px',
            borderLeft: '5px solid #f44336',
            marginTop: '16px'
        },
        cancellationTitle: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#c62828',
            marginBottom: '8px'
        },
        cancellationText: {
            fontSize: '14px',
            color: '#d32f2f',
            lineHeight: '1.6'
        },
        footer: {
            padding: '24px 36px',
            borderTop: '2px solid #f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            background: '#fafafa'
        },
        btnClose: {
            padding: '12px 32px',
            background: 'white',
            color: '#333',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.titleSection}>
                        <h2 style={styles.title}>Booking #{booking.id}</h2>
                        <div
                            style={{
                                ...styles.statusBadge,
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `2px solid ${statusStyle.border}`
                            }}
                        >
                            {booking.status}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={styles.closeBtn}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e0e0e0';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f5f5f5';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    {/* Booking Details */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>📅 Booking Details</h3>
                        <div style={styles.detailsGrid}>
                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Date & Time</div>
                                <div style={styles.detailValue}>
                                    {formatDateTime(booking.bookingDate, booking.bookingTime)}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Table Number</div>
                                <div style={{...styles.detailValue, color: '#8b6f47'}}>
                                    Table {booking.tableNumber}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Number of Guests</div>
                                <div style={styles.detailValue}>{booking.numberOfGuests} people</div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Booking ID</div>
                                <div style={styles.detailValue}>#{booking.id}</div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Created On</div>
                                <div style={styles.detailValue}>
                                    {new Date(booking.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div
                                style={styles.detailRow}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={styles.detailLabel}>Status</div>
                                <div style={styles.detailValue}>{booking.status}</div>
                            </div>
                        </div>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>📝 Special Requests</h3>
                            <div style={styles.infoBox}>
                                <p style={styles.infoText}>{booking.specialRequests}</p>
                            </div>
                        </div>
                    )}

                    {/*/!* Cancellation & Refund Info *!/*/}
                    {/*{booking.status === 'CANCELLED' && (*/}
                    {/*    <div style={styles.section}>*/}
                    {/*        <h3 style={styles.sectionTitle}>❌ Cancellation Information</h3>*/}

                    {/*        <div style={styles.cancellationBox}>*/}
                    {/*            <div style={styles.cancellationTitle}>*/}
                    {/*                Booking Cancelled*/}
                    {/*            </div>*/}
                    {/*            {booking.cancellationReason && (*/}
                    {/*                <p style={styles.cancellationText}>*/}
                    {/*                    <strong>Reason:</strong> {booking.cancellationReason}*/}
                    {/*                </p>*/}
                    {/*            )}*/}
                    {/*            {booking.cancelledAt && (*/}
                    {/*                <p style={styles.cancellationText}>*/}
                    {/*                    <strong>Cancelled On:</strong>{' '}*/}
                    {/*                    {new Date(booking.cancelledAt).toLocaleString()}*/}
                    {/*                </p>*/}
                    {/*            )}*/}
                    {/*        </div>*/}

                    {/*        {booking.refundStatus && booking.refundStatus !== 'NONE' && (*/}
                    {/*            <div style={styles.refundBox}>*/}
                    {/*                <div style={styles.refundTitle}>*/}
                    {/*                    💰 Refund Information*/}
                    {/*                </div>*/}
                    {/*                <div style={styles.refundDetail}>*/}
                    {/*                    <span style={styles.refundLabel}>Refund Status:</span>*/}
                    {/*                    <span style={styles.refundValue}>*/}
                    {/*                        {booking.refundStatus === 'COMPLETED' ? '✅ Completed' : '⏳ Pending'}*/}
                    {/*                    </span>*/}
                    {/*                </div>*/}
                    {/*                {booking.refundAmount && booking.refundAmount > 0 && (*/}
                    {/*                    <div style={styles.refundDetail}>*/}
                    {/*                        <span style={styles.refundLabel}>Refund Amount:</span>*/}
                    {/*                        <span style={styles.refundValue}>*/}
                    {/*                            ${booking.refundAmount.toFixed(2)}*/}
                    {/*                        </span>*/}
                    {/*                    </div>*/}
                    {/*                )}*/}
                    {/*                {booking.refundedAt && (*/}
                    {/*                    <div style={styles.refundDetail}>*/}
                    {/*                        <span style={styles.refundLabel}>Refunded On:</span>*/}
                    {/*                        <span style={styles.refundValue}>*/}
                    {/*                            {new Date(booking.refundedAt).toLocaleString()}*/}
                    {/*                        </span>*/}
                    {/*                    </div>*/}
                    {/*                )}*/}
                    {/*                {booking.refundStatus === 'PENDING' && (*/}
                    {/*                    <div style={{marginTop: '12px', fontSize: '13px', color: '#555', fontStyle: 'italic'}}>*/}
                    {/*                        Your refund is being processed. It will be credited to your account within 3-5 business days.*/}
                    {/*                    </div>*/}
                    {/*                )}*/}
                    {/*            </div>*/}
                    {/*        )}*/}
                    {/*    </div>*/}
                    {/*)}*/}

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
                            e.target.style.background = '#f5f5f5';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        }}
                    >
                        Close
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