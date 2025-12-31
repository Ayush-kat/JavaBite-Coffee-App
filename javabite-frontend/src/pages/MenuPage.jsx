import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../api/api';
import '../styles/Menu.css';
// import BookingStatusBanner from '../components/BookingStatusBanner';

const MenuPage = ({ cart = [], setCart }) => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch menu items on component mount
    useEffect(() => {
        const loadMenu = async () => {
            await fetchMenuItems();
        };
        loadMenu();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const items = await menuApi.getAllMenuItems();
            setMenuItems(items);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch menu items:', err);
            setError('Failed to load menu items. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Group menu items by category
    const groupedMenuItems = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    // Get all categories
    const categories = ['All', ...Object.keys(groupedMenuItems)];

    // Get filtered items
    const getFilteredItems = () => {
        if (selectedCategory === 'All') {
            return menuItems;
        }
        return groupedMenuItems[selectedCategory] || [];
    };

    const addToCart = (item) => {
        const cartItem = {
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            image: item.imageUrl
        };

        setCart([...cart, cartItem]);

        // Create notification with View Cart button
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <span>✓ ${item.name} added to cart!</span>
        <button id="viewCartBtn" style="
          background: white;
          color: #4caf50;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">View Cart</button>
      </div>
    `;

        notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      background: #4caf50;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

        document.body.appendChild(notification);

        const viewCartBtn = document.getElementById('viewCartBtn');
        viewCartBtn.addEventListener('click', () => {
            navigate('/cart');
            notification.remove();
        });

        viewCartBtn.addEventListener('mouseenter', function() {
            this.style.background = '#f5f5f5';
        });

        viewCartBtn.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price, 0).toFixed(2);
    };

    if (loading) {
        return (
            <div className="menu-page">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    fontSize: '1.5rem',
                    color: '#6d5739'
                }}>
                    Loading menu...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="menu-page">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    gap: '20px'
                }}>
                    <div style={{ fontSize: '1.5rem', color: '#d32f2f' }}>{error}</div>
                    <button
                        onClick={fetchMenuItems}
                        style={{
                            padding: '12px 24px',
                            background: '#6d5739',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-page">
             {/*Booking status banner (must be at top)*/}
            {/*<BookingStatusBanner />*/}

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Start Your Day the JavaBite Way</h1>
                    <p className="hero-subtitle">Freshly brewed coffee and delicious pastries made with love</p>
                    <button
                        className="cta-button"
                        onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Explore Menu
                    </button>
                    <button
                        className="cta-button"
                        onClick={() => navigate('/book-table')}
                    >
                        Book Table
                    </button>
                </div>
            </section>

            {/* Menu Section */}
            <section id="menu-section" className="menu-section">
                <h2 className="section-title">Our Menu</h2>

                {/* Category Tabs */}
                <div className="category-tabs">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Menu Items Grid */}
                <div className="menu-grid">
                    {getFilteredItems().map((item) => (
                        <div key={item.id} className="menu-card">
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="menu-item-image"
                                loading="lazy"
                            />
                            <div className="menu-card-content">
                                <h3 className="menu-item-name">{item.name}</h3>
                                <p className="menu-item-description">{item.description}</p>
                                <div className="menu-card-footer">
                                    <span className="menu-item-price">${parseFloat(item.price).toFixed(2)}</span>
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => addToCart(item)}
                                        disabled={!item.available}
                                    >
                                        {item.available ? 'Add to Cart' : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {getFilteredItems().length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6d5739' }}>
                        <p style={{ fontSize: '1.2rem' }}>No items available in this category.</p>
                    </div>
                )}
            </section>

            {/* Cart Summary */}
            {cart.length > 0 && (
                <div className="cart-summary" onClick={() => navigate('/cart')}>
                    <div className="cart-content">
            <span className="cart-count">
              🛒 {cart.length} {cart.length === 1 ? 'item' : 'items'} · ${getTotalPrice()}
            </span>
                        <button className="view-cart-btn">View Cart</button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .add-to-cart-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
        </div>
    );
};

export default MenuPage;