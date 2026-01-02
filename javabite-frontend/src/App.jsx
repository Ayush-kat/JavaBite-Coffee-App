import AcceptInvitation from './components/AcceptInvitation';

// Inside your routes:
import React, { useState } from 'react';
import {authApi} from './api/api.js';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import './styles/AdminDashboard.css';
import ChefDashboard from './pages/ChefDashboard';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerTableBookingPage from './pages/CustomerTableBookingPage.jsx';
import WaiterDashboard from './pages/WaiterDashboard';
import './styles/App.css';
import AdminTableBookingManagement from './components/AdminTableBookingManagement';
import BookingHistoryPage from "./components/BookingHistoryPage.jsx";
import AdminFeedbackPage from './components/AdminFeedbackPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


const ProtectedRoute = ({ element, requiredRole }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        console.warn(`Access Denied: User role is ${user?.role}, required role is ${requiredRole}`);
        return <Navigate to="/" replace />;
    }

    return element;
};

const NavBar = ({ cartCount }) => {
    const { user, logout: contextLogout } = useAuth();
    const role = user?.role;

    const handleLogout = async () => {
        try {
            await authApi.logout();
            contextLogout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            contextLogout();
            window.location.href = '/';
        }
    };

    return (
        <nav className="navbar">
            <Link to="/" className="logo">☕ JavaBite</Link>
            <div className="nav-links">
                <Link to="/menu">Menu</Link>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>

                {role === 'CHEF' && <Link to="/chef/dashboard">Chef Dashboard</Link>}
                {role === 'WAITER' && <Link to="/waiter/dashboard">Waiter Dashboard</Link>}
                {role === 'ADMIN' && <Link to="/admin/dashboard">Admin Dashboard</Link>}
                {role === 'CUSTOMER' && <Link to="/customer/orders">My Orders</Link>}
                {role === 'CUSTOMER' && <Link to="/customer/bookings">Table Bookings</Link>}

                <Link to="/cart" className="cart-nav-link">
                    🛒 Cart
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>

                {user ? (
                    <button onClick={handleLogout} className="logout-btn">
                        Logout ({user.name})
                    </button>
                ) : (
                    <>
                        <Link to="/login" className="login-link">Login</Link>
                        <Link to="/register" className="register-link">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

function App() {
    const [cart, setCart] = useState([]);

    return (
        <div className="App">
            <NavBar cartCount={cart.length} />

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<MenuPage cart={cart} setCart={setCart} />} />
                <Route path="/menu" element={<MenuPage cart={cart} setCart={setCart} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<SignupPage />} />
                <Route path="/accept-invite" element={<AcceptInvitation />} />
                <Route path="/admin/table-bookings" element={<AdminTableBookingManagement />} />
                <Route path="/book-table" element={<CustomerTableBookingPage />} />
                <Route path="/customer/bookings" element={<BookingHistoryPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/confirm" element={<ResetPasswordPage />} />
                <Route path="/waiter/dashboard" element={
                    <ProtectedRoute element={<WaiterDashboard />} requiredRole="WAITER" />} />

                {/* Protected Routes - Require Authentication */}
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute
                            element={<CheckoutPage cart={cart} setCart={setCart} />}
                        />
                    }
                />

                {/* Customer Routes */}
                <Route
                    path="/customer/orders"
                    element={
                        <ProtectedRoute
                            element={<CustomerOrdersPage setCart={setCart} />}
                            requiredRole="CUSTOMER"
                        />
                    }
                />

                {/* Chef Routes */}
                <Route
                    path="/chef/dashboard"
                    element={
                        <ProtectedRoute
                            element={<ChefDashboard />}
                            requiredRole="CHEF"
                        />
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute
                            element={<AdminDashboard />}
                            requiredRole="ADMIN"
                        />
                    }
                />

                {/* 404 Page */}
                <Route
                    path="*"
                    element={
                        <div className="page-container" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '60vh',
                            gap: '20px'
                        }}>
                            <h1 style={{ fontSize: '4rem', color: '#6d5739' }}>404</h1>
                            <h2 style={{ color: '#3e2723' }}>Page Not Found</h2>
                            <Link
                                to="/"
                                style={{
                                    padding: '12px 24px',
                                    background: '#6d5739',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                }}
                            >
                                Go Home
                            </Link>
                        </div>
                    }
                />
            </Routes>
        </div>
    );
}

export default App;