import React, { useState } from 'react';
import { feedbackApi } from '../api/api';

const FeedbackModal = ({ order, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [overallRating, setOverallRating] = useState(0);
    const [foodRating, setFoodRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [ambianceRating, setAmbianceRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);
    const [comment, setComment] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);

    // Hover states for stars
    const [overallHover, setOverallHover] = useState(0);
    const [foodHover, setFoodHover] = useState(0);
    const [serviceHover, setServiceHover] = useState(0);
    const [ambianceHover, setAmbianceHover] = useState(0);
    const [valueHover, setValueHover] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (overallRating === 0) {
            setError('Please provide an overall rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await feedbackApi.createFeedback({
                orderId: order.id,
                overallRating,
                foodRating: foodRating > 0 ? foodRating : null,
                serviceRating: serviceRating > 0 ? serviceRating : null,
                ambianceRating: ambianceRating > 0 ? ambianceRating : null,
                valueRating: valueRating > 0 ? valueRating : null,
                comment: comment.trim() || null,
                wouldRecommend
            });

            if (onSuccess) onSuccess();
            onClose();
            alert('✅ Thank you for your feedback!');

        } catch (err) {
            setError(err.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating, setRating, hover, setHover, label) => {
        return (
            <div style={styles.ratingRow}>
                <label style={styles.ratingLabel}>{label}:</label>
                <div style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            style={{
                                ...styles.star,
                                color: star <= (hover || rating) ? '#ffc107' : '#ddd',
                                transform: star <= (hover || rating) ? 'scale(1.1)' : 'scale(1)'
                            }}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                        >
                            ★
                        </span>
                    ))}
                    <span style={styles.ratingText}>
                        {(hover || rating) > 0 ? `${hover || rating}/5` : 'Not rated'}
                    </span>
                </div>
            </div>
        );
    };

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
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease'
        },
        modal: {
            background: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 32px',
            borderBottom: '2px solid #f0f0f0',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: '20px 20px 0 0'
        },
        headerTitle: {
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#2c3e50'
        },
        closeBtn: {
            background: '#f5f5f5',
            border: 'none',
            fontSize: '28px',
            color: '#7f8c8d',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
        },
        body: {
            padding: '32px'
        },
        orderSummary: {
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            borderLeft: '4px solid #ff9800'
        },
        summaryTitle: {
            margin: '0 0 4px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#333'
        },
        summaryText: {
            margin: 0,
            color: '#666',
            fontSize: '14px'
        },
        errorMessage: {
            background: '#ffebee',
            border: '2px solid #f44336',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '16px',
            marginTop: '24px'
        },
        overallSectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#8b6f47',
            marginBottom: '16px',
            marginTop: 0
        },
        ratingRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #f0f0f0'
        },
        ratingLabel: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#555',
            minWidth: '150px'
        },
        starsContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        star: {
            fontSize: '32px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            userSelect: 'none'
        },
        ratingText: {
            marginLeft: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#666',
            minWidth: '80px'
        },
        divider: {
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
            margin: '24px 0'
        },
        recommendSection: {
            marginTop: '24px'
        },
        recommendOptions: {
            display: 'flex',
            gap: '16px'
        },
        recommendOption: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'white'
        },
        recommendOptionSelected: {
            borderColor: '#4caf50',
            background: '#e8f5e9'
        },
        emoji: {
            fontSize: '48px',
            marginBottom: '8px'
        },
        recommendText: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#666'
        },
        recommendTextSelected: {
            color: '#2e7d32'
        },
        commentSection: {
            marginTop: '24px'
        },
        textarea: {
            width: '100%',
            padding: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'vertical',
            transition: 'border-color 0.3s ease',
            boxSizing: 'border-box'
        },
        charCount: {
            textAlign: 'right',
            fontSize: '12px',
            color: '#999',
            marginTop: '8px'
        },
        footer: {
            display: 'flex',
            gap: '12px',
            marginTop: '32px'
        },
        btnCancel: {
            flex: 1,
            padding: '14px 24px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: '#f5f5f5',
            color: '#666'
        },
        btnSubmit: {
            flex: 1,
            padding: '14px 24px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
        },
        btnDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.headerTitle}>✍️ Rate Your Experience</h2>
                    <button
                        style={styles.closeBtn}
                        onClick={onClose}
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

                {/* Body */}
                <div style={styles.body}>
                    {/* Order Summary */}
                    <div style={styles.orderSummary}>
                        <h3 style={styles.summaryTitle}>Order #{order.id}</h3>
                        <p style={styles.summaryText}>
                            {order.items?.length} items • ${parseFloat(order.total).toFixed(2)}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={styles.errorMessage}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Overall Rating (Required) */}
                        <h3 style={styles.overallSectionTitle}>Overall Experience *</h3>
                        {renderStars(overallRating, setOverallRating, overallHover, setOverallHover, 'Overall')}

                        <div style={styles.divider}></div>

                        {/* Detailed Ratings */}
                        <h3 style={styles.sectionTitle}>Rate by Category (Optional)</h3>
                        {renderStars(foodRating, setFoodRating, foodHover, setFoodHover, '☕ Food Quality')}
                        {renderStars(serviceRating, setServiceRating, serviceHover, setServiceHover, '🤵 Service')}
                        {renderStars(ambianceRating, setAmbianceRating, ambianceHover, setAmbianceHover, '🏠 Ambiance')}
                        {renderStars(valueRating, setValueRating, valueHover, setValueHover, '💰 Value for Money')}

                        <div style={styles.divider}></div>

                        {/* Recommendation */}
                        <div style={styles.recommendSection}>
                            <h3 style={styles.sectionTitle}>Would you recommend us?</h3>
                            <div style={styles.recommendOptions}>
                                <label
                                    style={{
                                        ...styles.recommendOption,
                                        ...(wouldRecommend === true ? styles.recommendOptionSelected : {})
                                    }}
                                    onMouseEnter={(e) => {
                                        if (wouldRecommend !== true) {
                                            e.currentTarget.style.borderColor = '#8b6f47';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (wouldRecommend !== true) {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <input
                                        type="radio"
                                        checked={wouldRecommend === true}
                                        onChange={() => setWouldRecommend(true)}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={styles.emoji}>👍</span>
                                    <span style={{
                                        ...styles.recommendText,
                                        ...(wouldRecommend === true ? styles.recommendTextSelected : {})
                                    }}>
                                        Yes
                                    </span>
                                </label>
                                <label
                                    style={{
                                        ...styles.recommendOption,
                                        ...(wouldRecommend === false ? styles.recommendOptionSelected : {})
                                    }}
                                    onMouseEnter={(e) => {
                                        if (wouldRecommend !== false) {
                                            e.currentTarget.style.borderColor = '#8b6f47';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (wouldRecommend !== false) {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <input
                                        type="radio"
                                        checked={wouldRecommend === false}
                                        onChange={() => setWouldRecommend(false)}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={styles.emoji}>👎</span>
                                    <span style={{
                                        ...styles.recommendText,
                                        ...(wouldRecommend === false ? styles.recommendTextSelected : {})
                                    }}>
                                        No
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div style={styles.divider}></div>

                        {/* Comment */}
                        <div style={styles.commentSection}>
                            <h3 style={styles.sectionTitle}>Additional Comments (Optional)</h3>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us more about your experience..."
                                maxLength={1000}
                                rows={4}
                                style={styles.textarea}
                                onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                            <div style={styles.charCount}>
                                {comment.length}/1000 characters
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div style={styles.footer}>
                            <button
                                type="button"
                                style={styles.btnCancel}
                                onClick={onClose}
                                disabled={loading}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.background = '#e0e0e0';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#f5f5f5';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    ...styles.btnSubmit,
                                    ...(loading || overallRating === 0 ? styles.btnDisabled : {})
                                }}
                                disabled={loading || overallRating === 0}
                                onMouseEnter={(e) => {
                                    if (!loading && overallRating > 0) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(139, 111, 71, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                                }}
                            >
                                {loading ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;