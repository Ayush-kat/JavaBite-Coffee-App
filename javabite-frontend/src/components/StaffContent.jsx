import React, { useState } from 'react';
import { invitationApi } from '../api/api';

const StaffContent = ({ chefs, waiters, onToggle, onDelete, onRefresh }) => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showPendingInvitations, setShowPendingInvitations] = useState(false);
    const [inviteRole, setInviteRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingInvitations, setPendingInvitations] = useState([]);

    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: ''
    });

    const handleAddStaff = (role) => {
        setInviteRole(role);
        setInviteForm({ name: '', email: '' });
        setError('');
        setSuccess('');
        setShowInviteModal(true);
    };

    const handleSendInvitation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await invitationApi.sendInvitation({
                name: inviteForm.name,
                email: inviteForm.email,
                role: inviteRole
            });

            setSuccess(`Invitation sent to ${inviteForm.email}! Check backend console for invitation link.`);

            // Reset form
            setInviteForm({ name: '', email: '' });

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowInviteModal(false);
                setSuccess('');
            }, 2000);

        } catch (err) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPendingInvitations = async () => {
        setLoading(true);
        setError('');

        try {
            const invitations = await invitationApi.getPendingInvitations();
            setPendingInvitations(invitations);
            setShowPendingInvitations(true);
        } catch (err) {
            setError(err.message || 'Failed to load pending invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleResendInvitation = async (userId) => {
        try {
            await invitationApi.resendInvitation(userId);
            alert('Invitation resent! Check backend console for new link.');
            handleViewPendingInvitations(); // Refresh list
        } catch (err) {
            alert('Failed to resend invitation: ' + err.message);
        }
    };

    const handleCancelInvitation = async (userId) => {
        if (!window.confirm('Cancel this invitation? The user will be deleted.')) return;

        try {
            await invitationApi.cancelInvitation(userId);
            alert('Invitation cancelled');
            handleViewPendingInvitations(); // Refresh list
        } catch (err) {
            alert('Failed to cancel invitation: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
            EXPIRED: { bg: '#f8d7da', color: '#721c24', border: '#f44336' },
            ACCEPTED: { bg: '#d4edda', color: '#155724', border: '#4caf50' }
        };

        const style = styles[status] || styles.PENDING;

        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="staff-content">
            <div className="section-header">
                <h2>Staff Management</h2>
                <div className="button-group">
                    <button
                        onClick={handleViewPendingInvitations}
                        className="btn btn-secondary"
                        style={{ marginRight: '12px' }}
                    >
                        📧 Pending Invitations
                    </button>
                    <button onClick={() => handleAddStaff('CHEF')} className="btn btn-primary">
                        + Invite Chef
                    </button>
                    <button onClick={() => handleAddStaff('WAITER')} className="btn btn-primary">
                        + Invite Waiter
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {error && !showInviteModal && (
                <div style={{
                    background: '#ffebee',
                    border: '1px solid #f44336',
                    color: '#c62828',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {success && !showInviteModal && (
                <div style={{
                    background: '#e8f5e9',
                    border: '1px solid #4caf50',
                    color: '#2e7d32',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    ✓ {success}
                </div>
            )}

            <div className="staff-grid">
                <div className="staff-section">
                    <h3>Chefs ({chefs.length})</h3>
                    {chefs.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No chefs yet. Invite one to get started!
                        </div>
                    ) : (
                        chefs.map(chef => (
                            <div key={chef.id} className="staff-item">
                                <div className="staff-info">
                                    <div className="staff-name">{chef.name}</div>
                                    <div className="staff-email">{chef.email}</div>
                                </div>
                                <div className="staff-actions">
                                    <button
                                        onClick={() => onToggle(chef.id)}
                                        className={`btn btn-sm ${chef.enabled ? 'btn-success' : 'btn-danger'}`}
                                    >
                                        {chef.enabled ? 'Active' : 'Disabled'}
                                    </button>
                                    <button
                                        onClick={() => onDelete(chef.id)}
                                        className="btn btn-sm btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="staff-section">
                    <h3>Waiters ({waiters.length})</h3>
                    {waiters.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No waiters yet. Invite one to get started!
                        </div>
                    ) : (
                        waiters.map(waiter => (
                            <div key={waiter.id} className="staff-item">
                                <div className="staff-info">
                                    <div className="staff-name">{waiter.name}</div>
                                    <div className="staff-email">{waiter.email}</div>
                                </div>
                                <div className="staff-actions">
                                    <button
                                        onClick={() => onToggle(waiter.id)}
                                        className={`btn btn-sm ${waiter.enabled ? 'btn-success' : 'btn-danger'}`}
                                    >
                                        {waiter.enabled ? 'Active' : 'Disabled'}
                                    </button>
                                    <button
                                        onClick={() => onDelete(waiter.id)}
                                        className="btn btn-sm btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{ margin: 0 }}>Invite {inviteRole}</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: '#ffebee',
                                border: '1px solid #f44336',
                                color: '#c62828',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{
                                background: '#e8f5e9',
                                border: '1px solid #4caf50',
                                color: '#2e7d32',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontWeight: '600'
                            }}>
                                ✓ {success}
                            </div>
                        )}

                        <form onSubmit={handleSendInvitation}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>

                            <div style={{
                                background: '#f5f5f5',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '24px',
                                fontSize: '14px',
                                color: '#666'
                            }}>
                                💡 An invitation email will be sent. The invitation link will also appear in the backend console for testing.
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#f5f5f5',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: loading ? '#ccc' : '#8b6f47',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Invitations Modal */}
            {showPendingInvitations && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{ margin: 0 }}>Pending Invitations</h2>
                            <button
                                onClick={() => setShowPendingInvitations(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {pendingInvitations.length === 0 ? (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#999'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                                <p>No pending invitations</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {pendingInvitations.map(invitation => (
                                    <div key={invitation.id} style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                {invitation.name}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                                                {invitation.email}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#999' }}>
                                                Role: <strong>{invitation.role}</strong>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {getStatusBadge(invitation.status)}
                                            {invitation.status === 'EXPIRED' && (
                                                <button
                                                    onClick={() => handleResendInvitation(invitation.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#2196f3',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '14px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Resend
                                                </button>
                                            )}
                                            {invitation.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleCancelInvitation(invitation.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '14px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffContent;