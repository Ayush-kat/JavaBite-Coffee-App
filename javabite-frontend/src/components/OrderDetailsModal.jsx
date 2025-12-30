import React, { useState } from 'react';
import { adminApi } from '../api/api';

const OrderDetailsModal = ({ order, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [notes, setNotes] = useState(order.adminNotes || '');

    const handleDownloadReceipt = () => {
        const receiptContent = generateReceiptHTML(order);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handleSaveNotes = async () => {
        try {
            setLoading(true);
            await adminApi.updateOrderNotes(order.id, notes);
            setSuccess('Notes saved successfully');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to save notes');
        } finally {
            setLoading(false);
        }
    };

    const handleRefundOrder = async () => {
        if (!window.confirm('Are you sure you want to refund this order?')) return;

        try {
            setLoading(true);
            await adminApi.refundOrder(order.id);
            setSuccess('Order refunded successfully');
            await onRefresh();
            setTimeout(() => {
                setSuccess('');
                onClose();
            }, 2000);
        } catch (err) {
            setError('Failed to refund order');
        } finally {
            setLoading(false);
        }
    };

    const generateReceiptHTML = (order) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Receipt #${order.id}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        max-width: 400px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .logo { font-size: 24px; font-weight: bold; }
                    .item { 
                        display: flex; 
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .total {
                        border-top: 2px dashed #000;
                        margin-top: 10px;
                        padding-top: 10px;
                        font-weight: bold;
                        font-size: 18px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">☕ JavaBite Coffee</div>
                    <div>Receipt</div>
                </div>
                
                <div><strong>Order #${order.id}</strong></div>
                <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
                <div>Customer: ${order.customer?.name}</div>
                <div>Table: ${order.tableBooking?.tableNumber || 'N/A'}</div>
                
                <div style="margin: 20px 0; border-bottom: 1px dashed #000; padding-bottom: 10px;">
                    <strong>Items:</strong>
                </div>
                
                ${order.items?.map(item => `
                    <div class="item">
                        <span>${item.menuItem?.name} x${item.quantity}</span>
                        <span>$${((item.priceAtOrder || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                
                <div class="total">
                    <div class="item">
                        <span>TOTAL:</span>
                        <span>$${(order.total || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <div>Thank you for your visit!</div>
                    <div>Visit us again soon!</div>
                </div>
            </body>
            </html>
        `;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return { bg: '#fff3e0', color: '#e65100', border: '#ff9800' };
            case 'PREPARING':
                return { bg: '#e3f2fd', color: '#1565c0', border: '#2196f3' };
            case 'READY':
                return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50' };
            case 'COMPLETED':
                return { bg: '#f3e5f5', color: '#6a1b9a', border: '#9c27b0' };
            case 'CANCELLED':
                return { bg: '#ffebee', color: '#c62828', border: '#f44336' };
            default:
                return { bg: '#f5f5f5', color: '#666', border: '#ccc' };
        }
    };

    const statusStyle = getStatusColor(order.status);

    const styles = {
        modalOverlay: {
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
        modalContainer: {
            background: 'white',
            borderRadius: '20px',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.4s ease'
        },
        modalHeader: {
            padding: '28px 36px',
            borderBottom: '2px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        },
        modalTitleSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        modalTitle: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: 0
        },
        statusBadgeLarge: {
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease'
        },
        modalClose: {
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
        modalBody: {
            padding: '36px'
        },
        alert: {
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'slideInLeft 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        },
        alertError: {
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            border: '2px solid #f44336',
            color: '#c62828'
        },
        alertSuccess: {
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            border: '2px solid #4caf50',
            color: '#2e7d32'
        },
        alertClose: {
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.7,
            transition: 'opacity 0.2s'
        },
        quickActions: {
            display: 'flex',
            gap: '12px',
            marginBottom: '28px',
            flexWrap: 'wrap'
        },
        actionBtn: {
            padding: '12px 24px',
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        },
        actionBtnDanger: {
            padding: '12px 24px',
            background: 'white',
            border: '2px solid #f44336',
            color: '#f44336',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)'
        },
        detailsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px'
        },
        detailsSection: {
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        },
        fullWidth: {
            gridColumn: '1 / -1'
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e0e0e0'
        },
        detailRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '10px',
            borderBottom: '1px solid #e8e8e8'
        },
        detailLabel: {
            color: '#666',
            fontSize: '14px',
            fontWeight: '600'
        },
        detailValue: {
            color: '#333',
            fontSize: '14px',
            fontWeight: '700'
        },
        detailValueHighlighted: {
            color: '#8b6f47',
            fontSize: '18px',
            fontWeight: '700'
        },
        staffInfo: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        },
        staffMember: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s ease'
        },
        staffAvatar: {
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        },
        staffRole: {
            fontSize: '12px',
            color: '#666',
            textTransform: 'uppercase',
            fontWeight: '700',
            letterSpacing: '0.5px'
        },
        staffName: {
            fontSize: '17px',
            color: '#333',
            fontWeight: '700',
            marginTop: '4px'
        },
        staffEmail: {
            fontSize: '13px',
            color: '#999',
            marginTop: '2px'
        },
        itemsTable: {
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        itemsHeader: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px',
            padding: '16px 20px',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        itemsRow: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px',
            padding: '14px 20px',
            alignItems: 'center',
            borderBottom: '1px solid #f5f5f5',
            fontSize: '14px',
            transition: 'background 0.2s ease'
        },
        itemName: {
            color: '#333',
            fontWeight: '600'
        },
        itemSubtotal: {
            color: '#2e7d32',
            fontWeight: '700',
            fontSize: '15px'
        },
        pricingBreakdown: {
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        },
        priceRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            fontSize: '15px',
            fontWeight: '500'
        },
        priceRowTotal: {
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '3px solid #e0e0e0',
            marginTop: '12px',
            paddingTop: '16px',
            fontSize: '22px',
            fontWeight: '700',
            color: '#2e7d32'
        },
        paymentStatusBadge: (status) => ({
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            background: status === 'paid' ? '#e8f5e9' : status === 'refunded' ? '#f3e5f5' : '#ffebee',
            color: status === 'paid' ? '#2e7d32' : status === 'refunded' ? '#6a1b9a' : '#c62828',
            border: `2px solid ${status === 'paid' ? '#4caf50' : status === 'refunded' ? '#9c27b0' : '#f44336'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }),
        timelineVisual: {
            position: 'relative',
            paddingLeft: '50px',
            paddingTop: '10px'
        },
        timelineLine: {
            position: 'absolute',
            left: '19px',
            top: '20px',
            bottom: '20px',
            width: '3px',
            background: 'linear-gradient(180deg, #4caf50 0%, #e0e0e0 100%)'
        },
        timelineItem: {
            position: 'relative',
            marginBottom: '28px'
        },
        timelineDot: (type) => ({
            position: 'absolute',
            left: '-38px',
            top: '6px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: type === 'completed' ? '#9c27b0' : type === 'cancelled' ? '#f44336' : type === 'active' ? '#4caf50' : 'white',
            border: `4px solid ${type === 'completed' ? '#9c27b0' : type === 'cancelled' ? '#f44336' : type === 'active' ? '#4caf50' : '#8b6f47'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1
        }),
        timelineContent: {
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s ease'
        },
        timelineLabel: {
            fontSize: '15px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '6px'
        },
        timelineTime: {
            fontSize: '13px',
            color: '#666',
            fontWeight: '500'
        },
        notesTextarea: {
            width: '100%',
            padding: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '16px',
            boxSizing: 'border-box',
            transition: 'border-color 0.3s ease',
            minHeight: '120px'
        },
        btnSaveNotes: {
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)',
            transition: 'all 0.3s ease'
        },
        specialRequestsBox: {
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            borderLeft: '5px solid #ff9800',
            fontSize: '14px',
            color: '#333',
            lineHeight: '1.8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        },
        modalFooter: {
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            borderTop: '2px solid #f5f5f5',
            background: '#fafafa'
        },
        btnSecondary: {
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
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <div style={styles.modalTitleSection}>
                        <h2 style={styles.modalTitle}>Order #{order.id}</h2>
                        <div
                            style={{
                                ...styles.statusBadgeLarge,
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `2px solid ${statusStyle.border}`
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            {order.status}
                        </div>

                        {/*  NEW: Auto-Assigned Badge */}
                        {order.autoAssigned && (
                            <div
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '25px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                    color: '#1565c0',
                                    border: '2px solid #2196f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                🤖 AUTO-ASSIGNED
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={styles.modalClose}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e0e0e0';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f5f5f5';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
                    >×</button>
                </div>

                <div style={styles.modalBody}>
                    {/* Alerts */}
                    {error && (
                        <div style={{...styles.alert, ...styles.alertError}}>
                            <span>⚠️ {error}</span>
                            <button
                                onClick={() => setError('')}
                                style={styles.alertClose}
                                onMouseEnter={(e) => e.target.style.opacity = '1'}
                                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                            >×</button>
                        </div>
                    )}

                    {success && (
                        <div style={{...styles.alert, ...styles.alertSuccess}}>
                            <span>✓ {success}</span>
                            <button
                                onClick={() => setSuccess('')}
                                style={styles.alertClose}
                                onMouseEnter={(e) => e.target.style.opacity = '1'}
                                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                            >×</button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={styles.quickActions}>
                        <button
                            onClick={handleDownloadReceipt}
                            style={styles.actionBtn}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#8b6f47';
                                e.target.style.color = 'white';
                                e.target.style.borderColor = '#8b6f47';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 16px rgba(139, 111, 71, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.color = 'inherit';
                                e.target.style.borderColor = '#e0e0e0';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            🖨️ Print Receipt
                        </button>
                        {order.status === 'PAID' && (
                            <button
                                onClick={handleRefundOrder}
                                style={styles.actionBtnDanger}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f44336';
                                    e.target.style.color = 'white';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 16px rgba(244, 67, 54, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.color = '#f44336';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.2)';
                                }}
                            >
                                💸 Refund Order
                            </button>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div style={styles.detailsGrid}>
                        {/* Customer Information */}
                        <div
                            style={styles.detailsSection}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                        >
                            <h3 style={styles.sectionTitle}>👤 Customer Information</h3>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Name:</span>
                                <span style={styles.detailValue}>{order.customer?.name || 'N/A'}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Email:</span>
                                <span style={styles.detailValue}>{order.customer?.email || 'N/A'}</span>
                            </div>
                            <div style={{...styles.detailRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0}}>
                                <span style={styles.detailLabel}>Customer ID:</span>
                                <span style={styles.detailValue}>#{order.customer?.id}</span>
                            </div>
                        </div>

                        {/* Table & Booking */}
                        {order.tableBooking && (
                            <div
                                style={styles.detailsSection}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                }}
                            >
                                <h3 style={styles.sectionTitle}>🪑 Table & Booking</h3>
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>Table Number:</span>
                                    <span style={styles.detailValueHighlighted}>
                                        Table {order.tableBooking.tableNumber}
                                    </span>
                                </div>
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>Booking ID:</span>
                                    <span style={styles.detailValue}>#{order.tableBooking.id}</span>
                                </div>
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>Booking Status:</span>
                                    <span style={styles.detailValue}>{order.tableBooking.status}</span>
                                </div>
                                <div style={{...styles.detailRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0}}>
                                    <span style={styles.detailLabel}>Guests:</span>
                                    <span style={styles.detailValue}>{order.tableBooking.numberOfGuests} people</span>
                                </div>
                            </div>
                        )}

                        {/* Staff Assigned */}
                        <div
                            style={styles.detailsSection}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                        >
                            <h3 style={styles.sectionTitle}>
                                👥 Staff Assigned
                                {order.autoAssigned && (
                                    <span style={{
                                        marginLeft: '12px',
                                        fontSize: '12px',
                                        padding: '4px 12px',
                                        background: '#e3f2fd',
                                        color: '#1565c0',
                                        borderRadius: '12px',
                                        fontWeight: '600'
                                    }}>
                🤖 AUTO
            </span>
                                )}
                            </h3>
                            <div style={styles.staffInfo}>
                                <div
                                    style={{
                                        ...styles.staffMember,
                                        border: order.chef ? '2px solid #4caf50' : '2px dashed #e0e0e0'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={styles.staffAvatar}>👨‍🍳</div>
                                    <div>
                                        <div style={styles.staffRole}>
                                            Chef
                                            {order.autoAssigned && order.chef && (
                                                <span style={{
                                                    marginLeft: '6px',
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    background: '#e3f2fd',
                                                    color: '#1565c0',
                                                    borderRadius: '8px'
                                                }}>
                            AUTO
                        </span>
                                            )}
                                        </div>
                                        <div style={styles.staffName}>{order.chef?.name || 'Not assigned'}</div>
                                        {order.chef && <div style={styles.staffEmail}>{order.chef.email}</div>}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        ...styles.staffMember,
                                        border: order.waiter ? '2px solid #4caf50' : '2px dashed #e0e0e0'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={styles.staffAvatar}>🤵</div>
                                    <div>
                                        <div style={styles.staffRole}>
                                            Waiter
                                            {order.autoAssigned && order.waiter && (
                                                <span style={{
                                                    marginLeft: '6px',
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    background: '#e3f2fd',
                                                    color: '#1565c0',
                                                    borderRadius: '8px'
                                                }}>
                            AUTO
                        </span>
                                            )}
                                        </div>
                                        <div style={styles.staffName}>{order.waiter?.name || 'Not assigned'}</div>
                                        {order.waiter && <div style={styles.staffEmail}>{order.waiter.email}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div style={{...styles.detailsSection, ...styles.fullWidth}}>
                            <h3 style={styles.sectionTitle}>🛒 Order Items</h3>
                            <div style={styles.itemsTable}>
                                <div style={styles.itemsHeader}>
                                    <span>Item</span>
                                    <span>Qty</span>
                                    <span>Price</span>
                                    <span>Subtotal</span>
                                </div>
                                {order.items?.map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={styles.itemsRow}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={styles.itemName}>{item.menuItem?.name || 'Item'}</span>
                                        <span>{item.quantity}</span>
                                        <span>${(item.priceAtOrder || 0).toFixed(2)}</span>
                                        <span style={styles.itemSubtotal}>
                                            ${((item.priceAtOrder || 0) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div style={styles.detailsSection}>
                            <h3 style={styles.sectionTitle}>💰 Pricing</h3>
                            <div style={styles.pricingBreakdown}>
                                <div style={styles.priceRow}>
                                    <span>Subtotal:</span>
                                    <span>${(order.total || 0).toFixed(2)}</span>
                                </div>
                                <div style={styles.priceRow}>
                                    <span>Tax (0%):</span>
                                    <span>$0.00</span>
                                </div>
                                <div style={styles.priceRowTotal}>
                                    <span>Total:</span>
                                    <span>${(order.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div style={styles.detailsSection}>
                            <h3 style={styles.sectionTitle}>💳 Payment Details</h3>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Payment Status:</span>
                                <span style={styles.paymentStatusBadge(order.paymentStatus?.toLowerCase() || 'unpaid')}>
                                    {order.paymentStatus || 'UNPAID'}
                                </span>
                            </div>
                            {order.paymentMethod && (
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>Payment Method:</span>
                                    <span style={styles.detailValue}>{order.paymentMethod}</span>
                                </div>
                            )}
                            {order.transactionId && (
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>Transaction ID:</span>
                                    <span style={{...styles.detailValue, fontFamily: 'monospace', fontSize: '12px'}}>
                                        {order.transactionId}
                                    </span>
                                </div>
                            )}
                            {order.paidAt && (
                                <div style={{...styles.detailRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0}}>
                                    <span style={styles.detailLabel}>Paid At:</span>
                                    <span style={styles.detailValue}>
                                        {new Date(order.paidAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Order Timeline - COMPLETE */}
                        <div style={{...styles.detailsSection, ...styles.fullWidth}}>
                            <h3 style={styles.sectionTitle}>📝 Order Timeline</h3>
                            <div style={styles.timelineVisual}>
                                <div style={styles.timelineLine}></div>

                                {/* Order Created */}
                                <div style={styles.timelineItem}>
                                    <div style={styles.timelineDot('active')}></div>
                                    <div
                                        style={styles.timelineContent}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        <div style={styles.timelineLabel}>📝 Order Created</div>
                                        <div style={styles.timelineTime}>{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Chef Assigned */}
                                {order.chefAssignedAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('active')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>👨‍🍳 Chef Assigned</div>
                                            <div style={styles.timelineTime}>{new Date(order.chefAssignedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Waiter Assigned */}
                                {order.waiterAssignedAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('active')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>🤵 Waiter Assigned</div>
                                            <div style={styles.timelineTime}>{new Date(order.waiterAssignedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Preparation Started */}
                                {order.preparationStartedAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('active')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>🔥 Preparation Started</div>
                                            <div style={styles.timelineTime}>{new Date(order.preparationStartedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Ready */}
                                {order.readyAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('active')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>✅ Order Ready</div>
                                            <div style={styles.timelineTime}>{new Date(order.readyAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Served */}
                                {order.servedAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('active')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>🍽️ Order Served</div>
                                            <div style={styles.timelineTime}>{new Date(order.servedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Completed */}
                                {order.completedAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('completed')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>🎉 Order Completed</div>
                                            <div style={styles.timelineTime}>{new Date(order.completedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Cancelled */}
                                {order.cancelledAt && (
                                    <div style={styles.timelineItem}>
                                        <div style={styles.timelineDot('cancelled')}></div>
                                        <div
                                            style={styles.timelineContent}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={styles.timelineLabel}>❌ Order Cancelled</div>
                                            <div style={styles.timelineTime}>{new Date(order.cancelledAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Notes */}
                        <div style={{...styles.detailsSection, ...styles.fullWidth}}>
                            <h3 style={styles.sectionTitle}>📝 Admin Notes</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add internal notes about this order..."
                                style={styles.notesTextarea}
                                rows="4"
                                onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={loading}
                                style={{...styles.btnSaveNotes, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 20px rgba(139, 111, 71, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                                }}
                            >
                                {loading ? '💾 Saving...' : '💾 Save Notes'}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={styles.modalFooter}>
                    <button
                        onClick={onClose}
                        style={styles.btnSecondary}
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
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderDetailsModal;