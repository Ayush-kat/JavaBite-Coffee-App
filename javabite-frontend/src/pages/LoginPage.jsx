import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/AuthApi';          // assumes you exported `login` as a named function
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();       // rename to avoid name clash with API `login`

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call backend login
            const userData = await login(formData.email, formData.password);

            // Update auth context
            await authLogin(userData);

            // Small delay to ensure session is fully established
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Navigate based on role
            switch (userData.role) {
                case 'ADMIN':
                    navigate('/admin/dashboard');
                    break;
                case 'CHEF':
                    navigate('/chef/dashboard');
                    break;
                case 'WAITER':
                    navigate('/waiter/dashboard');
                    break;
                case 'CUSTOMER':
                    navigate('/menu');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container single-section">
                <div className="auth-form-section centered">
                    <div className="auth-form-header">
                        <div className="auth-brand-small">☕ JavaBite</div>
                        <h1 className="auth-form-title">Welcome Back</h1>
                        <p className="auth-form-subtitle">
                            Login to your account to continue
                        </p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label className="auth-form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="auth-form-input"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="auth-form-input"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-form-extras">
                            <a
                                className="forgot-password"
                                href="/forgot-password"
                                style={{
                                    color: '#8b6f47',
                                    textDecoration: 'none',
                                    fontSize: '14px'
                                }}
                            >
                                Forgot Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-switch-link">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
