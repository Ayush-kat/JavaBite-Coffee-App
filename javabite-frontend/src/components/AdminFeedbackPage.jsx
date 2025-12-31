import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../api/api';

const AdminFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [ratingFilter, setRatingFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [feedbackData, statsData] = await Promise.all([
                feedbackApi.getAllFeedback(),
                feedbackApi.getFeedbackStats()
            ]);
            setFeedbacks(feedbackData);
            setStats(statsData);
            setError('');
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
            setError('Failed to load feedback data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (feedbackId) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) {
            return;
        }

        try {
            await feedbackApi.deleteFeedback(feedbackId);
            alert('Feedback deleted successfully');
            fetchData();
        } catch (err) {
            alert('Failed to delete feedback: ' + err.message);
        }
    };

    const getFilteredFeedbacks = () => {
        let filtered = [...feedbacks];

        if (ratingFilter !== 'all') {
            filtered = filtered.filter(f => f.overallRating === parseInt(ratingFilter));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                f.customerName?.toLowerCase().includes(query) ||
                f.orderId?.toString().includes(query) ||
                f.comment?.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const renderStars = (rating) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        style={{
                            fontSize: '20px',
                            color: star <= rating ? '#ffc107' : '#ddd'
                        }}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return '#4caf50';
        if (rating >= 3.5) return '#8bc34a';
        if (rating >= 2.5) return '#ff9800';
        if (rating >= 1.5) return '#ff5722';
        return '#f44336';
    };

    const styles = {
        page: {
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '100vh',
            background: '#f5f7fa'
        },
        container: {
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        },
        header: {
            marginBottom: '32px'
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 8px 0'
        },
        subtitle: {
            color: '#7f8c8d',
            fontSize: '16px',
            margin: 0
        },
        statsDashboard: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
        },
        statCard: {
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '2px solid #e9ecef',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.3s ease',
            cursor: 'default'
        },
        statCardOverall: {
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderColor: '#ff9800'
        },
        statIcon: {
            fontSize: '48px',
            lineHeight: 1
        },
        statContent: {
            flex: 1
        },
        statLabel: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#7f8c8d',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        statValue: {
            fontSize: '36px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: 0,
            lineHeight: 1
        },
        statUnit: {
            fontSize: '18px',
            color: '#7f8c8d',
            fontWeight: '400'
        },
        statSubtext: {
            fontSize: '12px',
            color: '#95a5a6',
            margin: '4px 0 0 0'
        },
        ratingDistribution: {
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
        },
        sectionTitle: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 20px 0'
        },
        distributionRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
        },
        ratingLabel: {
            minWidth: '50px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50'
        },
        progressBar: {
            flex: 1,
            height: '24px',
            background: '#e9ecef',
            borderRadius: '12px',
            overflow: 'hidden'
        },
        progressFill: {
            height: '100%',
            transition: 'width 0.5s ease',
            borderRadius: '12px'
        },
        countLabel: {
            minWidth: '40px',
            textAlign: 'right',
            fontSize: '14px',
            fontWeight: '600',
            color: '#7f8c8d'
        },
        filtersSection: {
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        filterLabel: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50'
        },
        select: {
            padding: '10px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
            cursor: 'pointer',
            background: 'white'
        },
        input: {
            padding: '10px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
            minWidth: '300px'
        },
        refreshBtn: {
            padding: '10px 20px',
            background: '#8b6f47',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        feedbacksGrid: {
            display: 'grid',
            gap: '20px'
        },
        feedbackCard: {
            background: 'white',
            border: '2px solid #e9ecef',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease'
        },
        feedbackHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
        },
        feedbackInfo: {
            flex: 1
        },
        customerName: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 4px 0'
        },
        orderInfo: {
            fontSize: '14px',
            color: '#7f8c8d',
            margin: 0
        },
        ratingBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: '700'
        },
        ratingNumber: {
            fontSize: '24px'
        },
        ratingStar: {
            fontSize: '20px'
        },
        feedbackRatings: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
        },
        ratingItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#f8f9fa',
            borderRadius: '8px'
        },
        ratingItemLabel: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50',
            minWidth: '80px'
        },
        feedbackComment: {
            background: '#f8f9fa',
            borderLeft: '4px solid #8b6f47',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
        },
        commentText: {
            fontSize: '15px',
            color: '#495057',
            margin: 0,
            fontStyle: 'italic',
            lineHeight: 1.6
        },
        feedbackFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
        },
        recommendBadge: {
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600'
        },
        recommendYes: {
            background: '#e8f5e9',
            color: '#2e7d32'
        },
        recommendNo: {
            background: '#ffebee',
            color: '#c62828'
        },
        feedbackActions: {
            display: 'flex',
            gap: '8px'
        },
        viewBtn: {
            padding: '8px 16px',
            background: '#8b6f47',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        deleteBtn: {
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
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
            backdropFilter: 'blur(4px)'
        },
        modalContent: {
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 32px',
            borderBottom: '2px solid #e9ecef'
        },
        modalTitle: {
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
        modalBody: {
            padding: '32px'
        },
        detailSection: {
            marginBottom: '24px'
        },
        detailSectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 16px 0'
        },
        detailText: {
            margin: '8px 0',
            fontSize: '15px',
            color: '#495057'
        },
        detailStrong: {
            color: '#2c3e50',
            fontWeight: '600'
        },
        ratingsDetail: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        ratingRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px'
        },
        ratingRowLabel: {
            minWidth: '100px',
            fontWeight: '600',
            color: '#2c3e50'
        },
        ratingRowValue: {
            marginLeft: 'auto',
            fontWeight: '600',
            color: '#7f8c8d'
        },
        divider: {
            height: '1px',
            background: '#e9ecef',
            margin: '24px 0',
            border: 'none'
        },
        commentDetail: {
            background: '#f8f9fa',
            borderLeft: '4px solid #8b6f47',
            padding: '16px',
            borderRadius: '8px',
            fontStyle: 'italic',
            color: '#495057',
            lineHeight: 1.6
        },
        noFeedbacks: {
            textAlign: 'center',
            padding: '60px 20px',
            color: '#7f8c8d'
        },
        loadingContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '20px'
        },
        spinner: {
            width: '50px',
            height: '50px',
            border: '4px solid #e9ecef',
            borderTopColor: '#8b6f47',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        },
        errorContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '20px'
        },
        retryBtn: {
            padding: '12px 24px',
            background: '#8b6f47',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        }
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading feedback...</p>
                    <style>
                        {`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={styles.errorContainer}>
                    <p>{error}</p>
                    <button
                        style={styles.retryBtn}
                        onClick={fetchData}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#6d5635';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#8b6f47';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const filteredFeedbacks = getFilteredFeedbacks();

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>💬 Customer Feedback</h1>
                    <p style={styles.subtitle}>Monitor and analyze customer satisfaction</p>
                </div>

                {/* Stats Dashboard */}
                {stats && (
                    <div style={styles.statsDashboard}>
                        <div
                            style={{...styles.statCard, ...styles.statCardOverall}}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={styles.statIcon}>⭐</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Overall Rating</h3>
                                <div style={{...styles.statValue, color: getRatingColor(stats.averageOverallRating)}}>
                                    {stats.averageOverallRating.toFixed(1)}
                                    <span style={styles.statUnit}>/5.0</span>
                                </div>
                                {renderStars(Math.round(stats.averageOverallRating))}
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>📊</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Total Feedbacks</h3>
                                <div style={styles.statValue}>{stats.totalFeedback}</div>
                                <p style={styles.statSubtext}>reviews collected</p>
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>👍</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Recommendation</h3>
                                <div style={{...styles.statValue, color: '#4caf50'}}>
                                    {stats.recommendationPercentage.toFixed(0)}%
                                </div>
                                <p style={styles.statSubtext}>
                                    {stats.wouldRecommend} of {stats.totalFeedback}
                                </p>
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>☕</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Food Quality</h3>
                                <div style={{...styles.statValue, color: getRatingColor(stats.averageFoodRating)}}>
                                    {stats.averageFoodRating.toFixed(1)}
                                </div>
                                {renderStars(Math.round(stats.averageFoodRating))}
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>🤵</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Service</h3>
                                <div style={{...styles.statValue, color: getRatingColor(stats.averageServiceRating)}}>
                                    {stats.averageServiceRating.toFixed(1)}
                                </div>
                                {renderStars(Math.round(stats.averageServiceRating))}
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>🏠</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Ambiance</h3>
                                <div style={{...styles.statValue, color: getRatingColor(stats.averageAmbianceRating)}}>
                                    {stats.averageAmbianceRating.toFixed(1)}
                                </div>
                                {renderStars(Math.round(stats.averageAmbianceRating))}
                            </div>
                        </div>

                        <div
                            style={styles.statCard}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#8b6f47';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                        >
                            <div style={styles.statIcon}>💰</div>
                            <div style={styles.statContent}>
                                <h3 style={styles.statLabel}>Value for Money</h3>
                                <div style={{...styles.statValue, color: getRatingColor(stats.averageValueRating)}}>
                                    {stats.averageValueRating.toFixed(1)}
                                </div>
                                {renderStars(Math.round(stats.averageValueRating))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Distribution */}
                {stats && (
                    <div style={styles.ratingDistribution}>
                        <h2 style={styles.sectionTitle}>Rating Distribution</h2>
                        <div>
                            {[5, 4, 3, 2, 1].map(rating => {
                                const count = stats.ratingDistribution[rating] || 0;
                                const percentage = stats.totalFeedback > 0
                                    ? (count / stats.totalFeedback) * 100
                                    : 0;

                                return (
                                    <div key={rating} style={styles.distributionRow}>
                                        <span style={styles.ratingLabel}>{rating} ★</span>
                                        <div style={styles.progressBar}>
                                            <div
                                                style={{
                                                    ...styles.progressFill,
                                                    width: `${percentage}%`,
                                                    background: getRatingColor(rating)
                                                }}
                                            ></div>
                                        </div>
                                        <span style={styles.countLabel}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={styles.filtersSection}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Filter by Rating:</label>
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            style={styles.select}
                            onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                            <option value="4">⭐⭐⭐⭐ (4 stars)</option>
                            <option value="3">⭐⭐⭐ (3 stars)</option>
                            <option value="2">⭐⭐ (2 stars)</option>
                            <option value="1">⭐ (1 star)</option>
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Search:</label>
                        <input
                            type="text"
                            placeholder="Search by customer, order ID, or comment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                    </div>

                    <button
                        onClick={fetchData}
                        style={styles.refreshBtn}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#6d5635';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#8b6f47';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Feedbacks List */}
                <div>
                    <h2 style={styles.sectionTitle}>
                        Feedback Reviews ({filteredFeedbacks.length})
                    </h2>

                    {filteredFeedbacks.length === 0 ? (
                        <div style={styles.noFeedbacks}>
                            <p>No feedback found</p>
                        </div>
                    ) : (
                        <div style={styles.feedbacksGrid}>
                            {filteredFeedbacks.map((feedback) => (
                                <div
                                    key={feedback.id}
                                    style={styles.feedbackCard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#8b6f47';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 111, 71, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e9ecef';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={styles.feedbackHeader}>
                                        <div style={styles.feedbackInfo}>
                                            <h3 style={styles.customerName}>{feedback.customerName}</h3>
                                            <p style={styles.orderInfo}>
                                                Order #{feedback.orderId} •
                                                {new Date(feedback.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={styles.ratingBadge}>
                                            <span style={styles.ratingNumber}>{feedback.overallRating}</span>
                                            <span style={styles.ratingStar}>★</span>
                                        </div>
                                    </div>

                                    <div style={styles.feedbackRatings}>
                                        {feedback.foodRating && (
                                            <div style={styles.ratingItem}>
                                                <span style={styles.ratingItemLabel}>☕ Food:</span>
                                                {renderStars(feedback.foodRating)}
                                            </div>
                                        )}
                                        {feedback.serviceRating && (
                                            <div style={styles.ratingItem}>
                                                <span style={styles.ratingItemLabel}>🤵 Service:</span>
                                                {renderStars(feedback.serviceRating)}
                                            </div>
                                        )}
                                        {feedback.ambianceRating && (
                                            <div style={styles.ratingItem}>
                                                <span style={styles.ratingItemLabel}>🏠 Ambiance:</span>
                                                {renderStars(feedback.ambianceRating)}
                                            </div>
                                        )}
                                        {feedback.valueRating && (
                                            <div style={styles.ratingItem}>
                                                <span style={styles.ratingItemLabel}>💰 Value:</span>
                                                {renderStars(feedback.valueRating)}
                                            </div>
                                        )}
                                    </div>

                                    {feedback.comment && (
                                        <div style={styles.feedbackComment}>
                                            <p style={styles.commentText}>"{feedback.comment}"</p>
                                        </div>
                                    )}

                                    <div style={styles.feedbackFooter}>
                                        <div style={{
                                            ...styles.recommendBadge,
                                            ...(feedback.wouldRecommend ? styles.recommendYes : styles.recommendNo)
                                        }}>
                                            {feedback.wouldRecommend ? (
                                                <span>👍 Would recommend</span>
                                            ) : (
                                                <span>👎 Would not recommend</span>
                                            )}
                                        </div>
                                        <div style={styles.feedbackActions}>
                                            <button
                                                onClick={() => setSelectedFeedback(feedback)}
                                                style={styles.viewBtn}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#6d5635';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#8b6f47';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleDelete(feedback.id)}
                                                style={styles.deleteBtn}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#d32f2f';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#f44336';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Feedback Details Modal */}
                {selectedFeedback && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedFeedback(null)}>
                        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>Feedback Details</h2>
                                <button
                                    style={styles.closeBtn}
                                    onClick={() => setSelectedFeedback(null)}
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
                                <div style={styles.detailSection}>
                                    <h3 style={styles.detailSectionTitle}>Customer Information</h3>
                                    <p style={styles.detailText}>
                                        <span style={styles.detailStrong}>Name:</span> {selectedFeedback.customerName}
                                    </p>
                                    <p style={styles.detailText}>
                                        <span style={styles.detailStrong}>Order ID:</span> #{selectedFeedback.orderId}
                                    </p>
                                    <p style={styles.detailText}>
                                        <span style={styles.detailStrong}>Order Total:</span> ${selectedFeedback.orderTotal?.toFixed(2)}
                                    </p>
                                    <p style={styles.detailText}>
                                        <span style={styles.detailStrong}>Submitted:</span> {new Date(selectedFeedback.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <hr style={styles.divider} />

                                <div style={styles.detailSection}>
                                    <h3 style={styles.detailSectionTitle}>Ratings</h3>
                                    <div style={styles.ratingsDetail}>
                                        <div style={styles.ratingRow}>
                                            <span style={styles.ratingRowLabel}>Overall:</span>
                                            {renderStars(selectedFeedback.overallRating)}
                                            <span style={styles.ratingRowValue}>{selectedFeedback.overallRating}/5</span>
                                        </div>
                                        {selectedFeedback.foodRating && (
                                            <div style={styles.ratingRow}>
                                                <span style={styles.ratingRowLabel}>☕ Food:</span>
                                                {renderStars(selectedFeedback.foodRating)}
                                                <span style={styles.ratingRowValue}>{selectedFeedback.foodRating}/5</span>
                                            </div>
                                        )}
                                        {selectedFeedback.serviceRating && (
                                            <div style={styles.ratingRow}>
                                                <span style={styles.ratingRowLabel}>🤵 Service:</span>
                                                {renderStars(selectedFeedback.serviceRating)}
                                                <span style={styles.ratingRowValue}>{selectedFeedback.serviceRating}/5</span>
                                            </div>
                                        )}
                                        {selectedFeedback.ambianceRating && (
                                            <div style={styles.ratingRow}>
                                                <span style={styles.ratingRowLabel}>🏠 Ambiance:</span>
                                                {renderStars(selectedFeedback.ambianceRating)}
                                                <span style={styles.ratingRowValue}>{selectedFeedback.ambianceRating}/5</span>
                                            </div>
                                        )}
                                        {selectedFeedback.valueRating && (
                                            <div style={styles.ratingRow}>
                                                <span style={styles.ratingRowLabel}>💰 Value:</span>
                                                {renderStars(selectedFeedback.valueRating)}
                                                <span style={styles.ratingRowValue}>{selectedFeedback.valueRating}/5</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedFeedback.comment && (
                                    <>
                                        <hr style={styles.divider} />
                                        <div style={styles.detailSection}>
                                            <h3 style={styles.detailSectionTitle}>Comment</h3>
                                            <p style={styles.commentDetail}>"{selectedFeedback.comment}"</p>
                                        </div>
                                    </>
                                )}

                                <hr style={styles.divider} />

                                <div style={styles.detailSection}>
                                    <h3 style={styles.detailSectionTitle}>Recommendation</h3>
                                    <p>
                                        {selectedFeedback.wouldRecommend ? (
                                            <span style={{...styles.recommendBadge, ...styles.recommendYes}}>
                                                👍 Would recommend JavaBite Coffee
                                            </span>
                                        ) : (
                                            <span style={{...styles.recommendBadge, ...styles.recommendNo}}>
                                                👎 Would not recommend JavaBite Coffee
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedbackPage;