import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationApi } from '../api/api.js';

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [invitationData, setInvitationData] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. No token provided.');
            setValidating(false);
            setLoading(false);
            return;
        }

        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            setValidating(true);
            const response = await invitationApi.validateToken(token);

            if (response.valid) {
                setInvitationData(response);
            } else {
                setError(response.message || 'Invalid invitation token');
            }
        } catch (err) {
            setError(err.message || 'Failed to validate invitation. The link may be expired or invalid.');
        } finally {
            setValidating(false);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setSubmitting(true);

            const response = await invitationApi.acceptInvitation({
                token,
                password
            });

            setSuccess('Account activated successfully! Redirecting to login...');

            setTimeout(() => {
                navigate('/login', {
                    state: {
                        message: 'Account created successfully! Please log in.',
                        email: invitationData.email
                    }
                });
            }, 2000);

        } catch (err) {
            setError(err.message || 'Failed to accept invitation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (validating) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '48px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #d7ccc8',
                        borderTopColor: '#8b6f47',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 24px'
                    }}></div>
                    <p style={{ fontSize: '18px', color: '#6d4c41' }}>
                        Validating invitation...
                    </p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (error && !invitationData) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '48px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '24px'
                    }}>
                        ❌
                    </div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#c62828',
                        marginBottom: '16px'
                    }}>
                        Invalid Invitation
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#6d4c41',
                        marginBottom: '32px',
                        lineHeight: '1.6'
                    }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '14px 32px',
                            background: '#8b6f47',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '48px',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '16px'
                    }}>
                        ☕
                    </div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#3e2723',
                        marginBottom: '8px'
                    }}>
                        Welcome to JavaBite!
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#6d4c41'
                    }}>
                        You've been invited to join as a {invitationData?.role}
                    </p>
                </div>

                {/* Invitation Details */}
                {invitationData && (
                    <div style={{
                        background: '#f5f0e8',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '32px'
                    }}>
                        <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#6d4c41' }}>Name: </span>
                            <span style={{ color: '#3e2723' }}>{invitationData.name}</span>
                        </div>
                        <div>
                            <span style={{ fontWeight: '600', color: '#6d4c41' }}>Email: </span>
                            <span style={{ color: '#3e2723' }}>{invitationData.email}</span>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div style={{
                        background: '#e8f5e9',
                        border: '2px solid #4caf50',
                        color: '#2e7d32',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        ✓ {success}
                    </div>
                )}

                {/* Error Message */}
                {error && invitationData && (
                    <div style={{
                        background: '#ffebee',
                        border: '2px solid #f44336',
                        color: '#c62828',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Password Form */}
                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#6d4c41',
                                marginBottom: '8px'
                            }}>
                                Create Password *
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '2px solid #d7ccc8',
                                    fontSize: '16px',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#6d4c41',
                                marginBottom: '8px'
                            }}>
                                Confirm Password *
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Re-enter password"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '2px solid #d7ccc8',
                                    fontSize: '16px',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: submitting ? '#d7ccc8' : '#8b6f47',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {submitting ? 'Activating Account...' : 'Activate Account'}
                        </button>
                    </form>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid #d7ccc8',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#999'
                    }}>
                        Already have an account?{' '}
                        <a
                            href="/login"
                            style={{
                                color: '#8b6f47',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            Log in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitation;