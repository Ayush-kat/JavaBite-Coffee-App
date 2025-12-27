import { useState, useEffect } from 'react';
import { adminApi } from '../api/api';
import AdminTableBookingManagement from '../components/AdminTableBookingManagement';
import StaffContent from '../components/StaffContent';

import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Data states
    const [pendingOrders, setPendingOrders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [chefs, setChefs] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedToday: 0,
        activeChefs: 0,
        activeWaiters: 0,
        activeBookings: 0
    });

    // UI states
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [assignForm, setAssignForm] = useState({ chefId: '', waiterId: '' });
    const [menuForm, setMenuForm] = useState({
        name: '',
        description: '',
        price: '',
        category: 'COFFEE',
        imageUrl: '',
        available: true
    });

    // Modal states
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [menuModalMode, setMenuModalMode] = useState('create');
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch data based on active tab
    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchData = async () => {
        switch (activeTab) {
            case 'dashboard':
                await Promise.all([
                    fetchDashboardStats(),
                    fetchPendingOrders(),
                    fetchStaff()
                ]);
                break;
            case 'orders':
                await Promise.all([
                    fetchPendingOrders(),
                    fetchStaff()
                ]);
                break;
            case 'bookings':
                // Handled by AdminTableBookingManagement component
                break;
            case 'products':
                await fetchMenuItems();
                break;
            case 'staff':
                await fetchStaff();
                break;
            default:
                break;
        }
    };

    // Fetch Functions with proper error handling
    const fetchDashboardStats = async () => {
        try {
            const stats = await adminApi.getDashboardStats();
            setDashboardStats(stats || {
                pendingOrders: 0,
                preparingOrders: 0,
                readyOrders: 0,
                completedToday: 0,
                activeChefs: 0,
                activeWaiters: 0,
                activeBookings: 0
            });
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
            // Don't show error for stats - not critical
        }
    };

    const fetchPendingOrders = async () => {
        try {
            setError('');
            const orders = await adminApi.getPendingOrders();
            setPendingOrders(Array.isArray(orders) ? orders : []);
        } catch (err) {
            console.error('Fetch orders error:', err);
            setPendingOrders([]);
            if (activeTab === 'orders') {
                setError('Failed to load orders. Please refresh.');
            }
        }
    };

    const fetchStaff = async () => {
        try {
            const [chefsData, waitersData] = await Promise.all([
                adminApi.getAllChefs().catch(() => []),
                adminApi.getAllWaiters().catch(() => [])
            ]);
            setChefs(Array.isArray(chefsData) ? chefsData : []);
            setWaiters(Array.isArray(waitersData) ? waitersData : []);
        } catch (err) {
            console.error('Fetch staff error:', err);
            setChefs([]);
            setWaiters([]);
            if (activeTab === 'staff') {
                setError('Failed to load staff. Please refresh.');
            }
        }
    };

    const fetchMenuItems = async () => {
        try {
            setError('');
            const items = await adminApi.getAllMenuItems();
            setMenuItems(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error('Fetch menu error:', err);
            setMenuItems([]);
            setError('Failed to load menu items. Please refresh.');
        }
    };

    // Order Management Functions
    const handleAssignOrder = async (orderId) => {
        if (!assignForm.chefId) {
            setError('Please select a chef');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const staffData = {
                chefId: parseInt(assignForm.chefId),
                waiterId: assignForm.waiterId ? parseInt(assignForm.waiterId) : null
            };

            await adminApi.assignStaff(orderId, staffData);
            setSuccess('Order assigned successfully!');
            setSelectedOrder(null);
            setAssignForm({ chefId: '', waiterId: '' });
            await fetchPendingOrders();
            await fetchDashboardStats();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Assignment error:', err);
            setError(err.message || 'Failed to assign order. The chef or waiter may be busy - order has been queued.');
        } finally {
            setLoading(false);
        }
    };

    // Staff Management Functions
    const handleToggleStaff = async (userId) => {
        try {
            await adminApi.toggleStaffStatus(userId);
            setSuccess('Staff status updated');
            await fetchStaff();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error('Toggle staff error:', err);
            setError('Failed to toggle staff status');
        }
    };

    const handleDeleteStaff = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;

        try {
            await adminApi.deleteStaff(userId);
            setSuccess('Staff member deleted');
            await fetchStaff();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error('Delete staff error:', err);
            setError('Failed to delete staff member');
        }
    };

    // Menu Management Functions
    const handleCreateMenuItem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const itemData = {
                ...menuForm,
                price: parseFloat(menuForm.price)
            };

            if (menuModalMode === 'create') {
                await adminApi.createMenuItem(itemData);
                setSuccess('Menu item created successfully!');
            } else {
                await adminApi.updateMenuItem(selectedMenuItem.id, itemData);
                setSuccess('Menu item updated successfully!');
            }

            setShowMenuModal(false);
            setMenuForm({
                name: '',
                description: '',
                price: '',
                category: 'COFFEE',
                imageUrl: '',
                available: true
            });
            setSelectedMenuItem(null);
            await fetchMenuItems();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Menu item error:', err);
            setError(err.message || 'Failed to save menu item');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMenuItem = (item) => {
        setSelectedMenuItem(item);
        setMenuForm({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            category: item.category,
            imageUrl: item.imageUrl,
            available: item.available
        });
        setMenuModalMode('edit');
        setShowMenuModal(true);
    };

    const handleDeleteMenuItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;

        try {
            await adminApi.deleteMenuItem(itemId);
            setSuccess('Menu item deleted');
            await fetchMenuItems();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error('Delete menu item error:', err);
            setError('Failed to delete menu item');
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Logo & Toggle */}
                <div className="sidebar-header">
                    {!sidebarCollapsed && (
                        <div className="logo">
                            <span className="logo-text">JavaBite</span>
                            <span className="logo-accent"> Coffee.</span>
                        </div>
                    )}
                    <button
                        className="collapse-btn"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? '☰' : '«'}
                    </button>
                </div>

                {/* User Profile */}
                {!sidebarCollapsed && (
                    <div className="user-profile">
                        <div className="user-avatar">👨‍💼</div>
                        <div className="user-name">Admin</div>
                        <div className="user-role">Administrator</div>
                    </div>
                )}

                {/* Master Data Label */}
                {!sidebarCollapsed && (
                    <div className="section-label">MASTER DATA</div>
                )}

                {/* Navigation Menu */}
                <nav className="nav-menu">
                    {[
                        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                        { id: 'orders', icon: '🛒', label: 'Orders', badge: pendingOrders.length },
                        { id: 'bookings', icon: '📅', label: 'Bookings' },
                        { id: 'products', icon: '📦', label: 'Menu Items' },
                        { id: 'staff', icon: '👥', label: 'Staff' },
                        { id: 'reports', icon: '📈', label: 'Reports' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setError('');
                                setSuccess('');
                            }}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                            {!sidebarCollapsed && item.badge > 0 && (
                                <span className="nav-badge">{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Header */}
                <header className="content-header">
                    <div className="header-left">
                        <h1 className="page-title">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <div className="breadcrumb">
                            Home / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" onClick={fetchData}>
                            🔄
                        </button>
                        <button className="header-btn">
                            💬
                            <span className="notification-dot"></span>
                        </button>
                        <button className="header-btn">
                            🔔
                            <span className="notification-dot"></span>
                        </button>
                    </div>
                </header>

                {/* Error/Success Messages */}
                {error && (
                    <div className="alert alert-error">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span>✓ {success}</span>
                        <button onClick={() => setSuccess('')} className="alert-close">×</button>
                    </div>
                )}

                {/* Content Area */}
                <div className="content-area">
                    {activeTab === 'dashboard' && (
                        <DashboardContent
                            stats={dashboardStats}
                            pendingOrders={pendingOrders}
                            chefs={chefs}
                            waiters={waiters}
                            menuItems={menuItems}
                            onOrderSelect={setSelectedOrder}
                            selectedOrder={selectedOrder}
                            assignForm={assignForm}
                            setAssignForm={setAssignForm}
                            onAssignOrder={handleAssignOrder}
                            loading={loading}
                            setActiveTab={setActiveTab}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <OrdersContent
                            pendingOrders={pendingOrders}
                            chefs={chefs}
                            waiters={waiters}
                            selectedOrder={selectedOrder}
                            onOrderSelect={setSelectedOrder}
                            assignForm={assignForm}
                            setAssignForm={setAssignForm}
                            onAssignOrder={handleAssignOrder}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'bookings' && (
                        <AdminTableBookingManagement />
                    )}

                    {activeTab === 'products' && (
                        <MenuContent
                            menuItems={menuItems}
                            onEdit={handleEditMenuItem}
                            onDelete={handleDeleteMenuItem}
                            onAdd={() => {
                                setMenuForm({
                                    name: '',
                                    description: '',
                                    price: '',
                                    category: 'COFFEE',
                                    imageUrl: '',
                                    available: true
                                });
                                setMenuModalMode('create');
                                setShowMenuModal(true);
                            }}
                        />
                    )}

                    {activeTab === 'staff' && (
                        <StaffContent
                            chefs={chefs}
                            waiters={waiters}
                            onToggle={handleToggleStaff}
                            onDelete={handleDeleteStaff}
                            onRefresh={fetchStaff}
                        />
                    )}

                    {activeTab === 'reports' && <ReportsContent />}
                </div>
            </main>

            {/* Menu Item Modal */}
            {showMenuModal && (
                <Modal
                    title={menuModalMode === 'create' ? 'Add New Menu Item' : 'Edit Menu Item'}
                    onClose={() => {
                        setShowMenuModal(false);
                        setMenuForm({
                            name: '',
                            description: '',
                            price: '',
                            category: 'COFFEE',
                            imageUrl: '',
                            available: true
                        });
                        setSelectedMenuItem(null);
                    }}
                >
                    <form onSubmit={handleCreateMenuItem} className="modal-form">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={menuForm.name}
                                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <textarea
                                value={menuForm.description}
                                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                                required
                                rows="3"
                                className="form-input"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Price *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={menuForm.price}
                                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    value={menuForm.category}
                                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="COFFEE">Coffee</option>
                                    <option value="PASTRIES">Pastries</option>
                                    <option value="BEVERAGES">Beverages</option>
                                    <option value="SNACKS">Snacks</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Image URL *</label>
                            <input
                                type="url"
                                value={menuForm.imageUrl}
                                onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={menuForm.available}
                                    onChange={(e) => setMenuForm({ ...menuForm, available: e.target.checked })}
                                />
                                <span>Available for Order</span>
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMenuModal(false);
                                    setMenuForm({
                                        name: '',
                                        description: '',
                                        price: '',
                                        category: 'COFFEE',
                                        imageUrl: '',
                                        available: true
                                    });
                                    setSelectedMenuItem(null);
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? 'Saving...' : menuModalMode === 'create' ? 'Create' : 'Update'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// Component: Modal
const Modal = ({ title, onClose, children }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2>{title}</h2>
                <button onClick={onClose} className="modal-close">×</button>
            </div>
            <div className="modal-body">
                {children}
            </div>
        </div>
    </div>
);

// Component: Stat Card
const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
            <div className="stat-title">{title}</div>
            <div className="stat-value">{value}</div>
            {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
    </div>
);

// Component: Order Card
const OrderCard = ({ order, onSelect, selected, chefs, waiters, assignForm, setAssignForm, onAssign, loading }) => (
    <div className="order-card">
        <div className="order-card-header">
            <div className="order-info">
                <div className="order-avatar">🍽️</div>
                <div>
                    <div className="order-id">
                        #{order.id}
                        {order.autoAssigned && (
                            <span className="auto-badge">🤖 Auto-assigned</span>
                        )}
                    </div>
                    <div className="order-meta">{order.items?.length} Items</div>
                </div>
            </div>
            <button
                onClick={() => onSelect(selected?.id === order.id ? null : order)}
                className="btn btn-outline-sm"
            >
                📝 {selected?.id === order.id ? 'Cancel' : 'Assign'}
            </button>
        </div>

        <div className="order-details">
            <div className="order-customer">{order.customerName}</div>
            {order.tableNumber && (
                <div className="order-table">Table {order.tableNumber}</div>
            )}
            <div className="order-total">
                ${order.total?.toFixed(2)} • {new Date(order.createdAt).toLocaleDateString()}
            </div>
        </div>

        {selected?.id === order.id && (
            <div className="assignment-form">
                <div className="form-group">
                    <label>Assign Chef *</label>
                    <select
                        value={assignForm.chefId}
                        onChange={(e) => setAssignForm({ ...assignForm, chefId: e.target.value })}
                        className="form-input"
                    >
                        <option value="">Select a chef</option>
                        {chefs.filter(c => c.enabled).map(chef => (
                            <option key={chef.id} value={chef.id}>
                                {chef.name} ({chef.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Assign Waiter (Optional)</label>
                    <select
                        value={assignForm.waiterId}
                        onChange={(e) => setAssignForm({ ...assignForm, waiterId: e.target.value })}
                        className="form-input"
                    >
                        <option value="">Select a waiter</option>
                        {waiters.filter(w => w.enabled).map(waiter => (
                            <option key={waiter.id} value={waiter.id}>
                                {waiter.name} ({waiter.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <button
                        onClick={() => onSelect(null)}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onAssign(order.id)}
                        disabled={loading || !assignForm.chefId}
                        className="btn btn-primary"
                    >
                        {loading ? 'Assigning...' : 'Confirm'}
                    </button>
                </div>
            </div>
        )}
    </div>
);

// Content Components
const DashboardContent = ({ stats, pendingOrders, chefs, waiters, menuItems, ...orderProps }) => (
    <div className="dashboard-content">
        <div className="stats-grid">
            <StatCard title="Pending Orders" value={stats.pendingOrders} icon="🛍️" color="#4caf50" subtitle="Need Assignment" />
            <StatCard title="Preparing Orders" value={stats.preparingOrders} icon="👨‍🍳" color="#ff9800" subtitle="In Kitchen" />
            <StatCard title="Ready Orders" value={stats.readyOrders} icon="✓" color="#2196f3" subtitle="Ready to Serve" />
            <StatCard title="Completed Today" value={stats.completedToday} icon="📊" color="#9c27b0" subtitle="Today" />
            <StatCard title="Active Chefs" value={stats.activeChefs} icon="👨‍🍳" color="#ff9800" subtitle={`Total: ${chefs.length}`} />
            <StatCard title="Active Waiters" value={stats.activeWaiters} icon="🤵" color="#2196f3" subtitle={`Total: ${waiters.length}`} />
            <StatCard title="Active Bookings" value={stats.activeBookings} icon="📅" color="#4caf50" subtitle="Current" />
            <StatCard title="Menu Items" value={menuItems.length} icon="☕" color="#9c27b0" subtitle={`Available: ${menuItems.filter(m => m.available).length}`} />
        </div>

        <div className="section-card">
            <div className="section-header">
                <h2>Recent Orders</h2>
                <button onClick={() => orderProps.setActiveTab('orders')} className="btn btn-primary-sm">
                    View All
                </button>
            </div>
            {pendingOrders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h3>All Orders Assigned!</h3>
                    <p>No pending orders at the moment</p>
                </div>
            ) : (
                pendingOrders.slice(0, 5).map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onSelect={orderProps.onOrderSelect}
                        selected={orderProps.selectedOrder}
                        chefs={chefs}
                        waiters={waiters}
                        assignForm={orderProps.assignForm}
                        setAssignForm={orderProps.setAssignForm}
                        onAssign={orderProps.onAssignOrder}
                        loading={orderProps.loading}
                    />
                ))
            )}
        </div>
    </div>
);

const OrdersContent = ({ pendingOrders, chefs, waiters, selectedOrder, onOrderSelect, assignForm, setAssignForm, onAssignOrder, loading }) => (
    <div className="orders-content">
        <h2 className="section-title">Pending Orders ({pendingOrders.length})</h2>
        {pendingOrders.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>All Orders Assigned!</h3>
                <p>No pending orders at the moment</p>
            </div>
        ) : (
            <div className="orders-grid">
                {pendingOrders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onSelect={onOrderSelect}
                        selected={selectedOrder}
                        chefs={chefs}
                        waiters={waiters}
                        assignForm={assignForm}
                        setAssignForm={setAssignForm}
                        onAssign={onAssignOrder}
                        loading={loading}
                    />
                ))}
            </div>
        )}
    </div>
);

const MenuContent = ({ menuItems, onEdit, onDelete, onAdd }) => (
    <div className="menu-content">
        <div className="section-header">
            <h2>Menu Items ({menuItems.length})</h2>
            <button onClick={onAdd} className="btn btn-primary">
                + Add New Item
            </button>
        </div>
        <div className="menu-grid">
            {menuItems.map(item => (
                <div key={item.id} className="menu-card">
                    <img src={item.imageUrl} alt={item.name} className="menu-image" />
                    <div className="menu-details">
                        <div className="menu-header">
                            <div>
                                <h3>{item.name}</h3>
                                <span className="menu-category">{item.category}</span>
                            </div>
                            <div className="menu-price">${item.price}</div>
                        </div>
                        <p className="menu-description">{item.description}</p>
                        <div className="menu-actions">
                            <button onClick={() => onEdit(item)} className="btn btn-sm btn-primary">
                                Edit
                            </button>
                            <button onClick={() => onDelete(item.id)} className="btn btn-sm btn-danger">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ReportsContent = () => (
    <div className="reports-content">
        <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Reports & Analytics</h3>
            <p>Coming soon - View detailed reports and analytics here</p>
        </div>
    </div>
);

export default AdminDashboard;