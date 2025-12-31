import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetLink, setResetLink] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ✅ Using fetch instead of axios
            const response = await fetch('http://localhost:8080/api/auth/password-reset/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setResetLink(data.resetLink || '');
                setExpiresAt(data.expiresAt || '');
            } else {
                setError(data.message || 'Failed to send reset link');
            }
        } catch (err) {
            setError('Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(resetLink);
        alert('✅ Reset link copied to clipboard!');
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
        input: {
            padding: '14px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            fontSize: '16px',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
            outline: 'none'
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
            padding: '24px',
            marginTop: '20px'
        },
        successIcon: {
            fontSize: '48px',
            textAlign: 'center',
            marginBottom: '16px'
        },
        successTitle: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#2e7d32',
            textAlign: 'center',
            marginBottom: '12px'
        },
        successText: {
            fontSize: '15px',
            color: '#2e7d32',
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: '1.6'
        },
        demoNotice: {
            background: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
        },
        demoTitle: {
            fontSize: '14px',
            fontWeight: '700',
            color: '#f57c00',
            marginBottom: '8px'
        },
        demoText: {
            fontSize: '13px',
            color: '#e65100',
            lineHeight: '1.5',
            margin: 0
        },
        linkBox: {
            background: 'white',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            wordBreak: 'break-all'
        },
        link: {
            color: '#1976d2',
            fontSize: '14px',
            fontFamily: 'monospace'
        },
        copyButton: {
            width: '100%',
            padding: '12px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        expiryText: {
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            marginTop: '12px'
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

    if (success) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <div style={styles.successIcon}>✅</div>
                        <h1 style={styles.successTitle}>Reset Link Generated!</h1>
                        <p style={styles.successText}>
                            Your password reset link has been generated.
                        </p>
                    </div>

                    {/* Demo Notice */}
                    <div style={styles.demoNotice}>
                        <div style={styles.demoTitle}>📧 Demo Mode</div>
                        <p style={styles.demoText}>
                            In production, this link would be sent to: <strong>{email}</strong>
                        </p>
                    </div>

                    {/* Reset Link */}
                    <div style={styles.linkBox}>
                        <div style={styles.link}>{resetLink}</div>
                    </div>

                    {/* Copy Button */}
                    <button
                        style={styles.copyButton}
                        onClick={handleCopyLink}
                        onMouseEnter={(e) => e.target.style.background = '#45a049'}
                        onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                    >
                        📋 Copy Reset Link
                    </button>

                    {/* Expiry Info */}
                    {expiresAt && (
                        <p style={styles.expiryText}>
                            ⏰ Link expires at: {expiresAt}
                        </p>
                    )}

                    {/* Instructions */}
                    <div style={{...styles.demoNotice, marginTop: '20px', borderColor: '#2196f3'}}>
                        <div style={{...styles.demoTitle, color: '#1976d2'}}>📝 Instructions</div>
                        <p style={{...styles.demoText, color: '#0d47a1'}}>
                            1. Click "Copy Reset Link" button<br />
                            2. Open a new browser tab<br />
                            3. Paste the link in the address bar<br />
                            4. Set your new password
                        </p>
                    </div>

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

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={styles.icon}>🔐</div>
                    <h1 style={styles.title}>Forgot Password?</h1>
                    <p style={styles.subtitle}>
                        Enter your email address and we'll generate a password reset link for you.
                    </p>
                </div>

                {error && (
                    <div style={styles.error}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = '#8b6f47'}
                            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                    </div>

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
                        {loading ? 'Generating Link...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;