import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        validateToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setError('Invalid reset link');
            setValidating(false);
            return;
        }

        try {
            // ✅ Using fetch instead of axios
            const response = await fetch(
                `http://localhost:8080/api/auth/password-reset/validate/${token}`,
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (data.valid) {
                setTokenValid(true);
                setEmail(data.email);
                setExpiresAt(data.expiresAt);
            } else {
                setError(data.message || 'Invalid reset link');
            }
        } catch (err) {
            setError('Invalid or expired reset link');
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ✅ Using fetch instead of axios
            const response = await fetch(
                'http://localhost:8080/api/auth/password-reset/confirm',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        token,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            padding: '20px'
        },
        container: {
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            padding: '48px',
            maxWidth: '500px',
            width: '100%'
        },
        header: {
            textAlign: 'center',
            marginBottom: '32px'
        },
        icon: {
            fontSize: '64px',
            marginBottom: '16px'
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 12px 0'
        },
        subtitle: {
            fontSize: '16px',
            color: '#7f8c8d',
            margin: 0,
            lineHeight: '1.6'
        },
        emailBadge: {
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            textAlign: 'center'
        },
        emailText: {
            fontSize: '14px',
            color: '#7f8c8d',
            marginBottom: '4px'
        },
        emailValue: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#2c3e50'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        label: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50'
        },
        passwordInputWrapper: {
            position: 'relative'
        },
        input: {
            padding: '14px 50px 14px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            fontSize: '16px',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box'
        },
        eyeButton: {
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '8px'
        },
        hint: {
            fontSize: '12px',
            color: '#95a5a6',
            marginTop: '4px'
        },
        button: {
            padding: '16px',
            background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
        },
        buttonDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        error: {
            background: '#ffebee',
            border: '2px solid #f44336',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px'
        },
        successBox: {
            background: '#e8f5e9',
            border: '2px solid #4caf50',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center'
        },
        successIcon: {
            fontSize: '64px',
            marginBottom: '16px'
        },
        successTitle: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#2e7d32',
            marginBottom: '12px'
        },
        successText: {
            fontSize: '16px',
            color: '#2e7d32',
            marginBottom: '20px',
            lineHeight: '1.6'
        },
        redirectText: {
            fontSize: '14px',
            color: '#666'
        },
        loadingContainer: {
            textAlign: 'center',
            padding: '40px'
        },
        spinner: {
            width: '50px',
            height: '50px',
            border: '4px solid #e9ecef',
            borderTopColor: '#8b6f47',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
        },
        loadingText: {
            fontSize: '16px',
            color: '#7f8c8d'
        },
        backLink: {
            display: 'block',
            textAlign: 'center',
            marginTop: '24px',
            color: '#8b6f47',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'color 0.3s ease'
        }
    };

    // Loading state
    if (validating) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Validating reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.successBox}>
                        <div style={styles.successIcon}>✅</div>
                        <h1 style={styles.successTitle}>Password Reset Successful!</h1>
                        <p style={styles.successText}>
                            Your password has been reset successfully.
                            You can now login with your new password.
                        </p>
                        <p style={styles.redirectText}>
                            Redirecting to login page in 3 seconds...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state (invalid token)
    if (!tokenValid) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <div style={styles.icon}>❌</div>
                        <h1 style={styles.title}>Invalid Reset Link</h1>
                        <p style={styles.subtitle}>
                            {error || 'This password reset link is invalid or has expired.'}
                        </p>
                    </div>

                    <a
                        href="/forgot-password"
                        style={{
                            ...styles.button,
                            textDecoration: 'none',
                            display: 'block',
                            textAlign: 'center'
                        }}
                    >
                        Request New Reset Link
                    </a>

                    <a
                        href="/login"
                        style={styles.backLink}
                        onMouseEnter={(e) => e.target.style.color = '#6d5635'}
                        onMouseLeave={(e) => e.target.style.color = '#8b6f47'}
                    >
                        ← Back to Login
                    </a>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div style={styles.page}>
            <style>
                {`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={styles.icon}>🔑</div>
                    <h1 style={styles.title}>Reset Your Password</h1>
                    <p style={styles.subtitle}>
                        Enter your new password below
                    </p>
                </div>

                {/* Email Badge */}
                <div style={styles.emailBadge}>
                    <div style={styles.emailText}>Resetting password for:</div>
                    <div style={styles.emailValue}>{email}</div>
                </div>

                {error && (
                    <div style={styles.error}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* New Password */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New Password</label>
                        <div style={styles.passwordInputWrapper}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={6}
                                style={styles.input}
                                onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                            <button
                                type="button"
                                style={styles.eyeButton}
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <span style={styles.hint}>At least 6 characters</span>
                    </div>

                    {/* Confirm Password */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={styles.passwordInputWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                style={styles.input}
                                onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                            <button
                                type="button"
                                style={styles.eyeButton}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Expiry Warning */}
                    {expiresAt && (
                        <div style={{...styles.hint, textAlign: 'center', color: '#ff9800'}}>
                            ⏰ This link expires at: {expiresAt}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(139, 111, 71, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                        }}
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <a
                    href="/login"
                    style={styles.backLink}
                    onMouseEnter={(e) => e.target.style.color = '#6d5635'}
                    onMouseLeave={(e) => e.target.style.color = '#8b6f47'}
                >
                    ← Back to Login
                </a>
            </div>
        </div>
    );
};

export default ResetPasswordPage;