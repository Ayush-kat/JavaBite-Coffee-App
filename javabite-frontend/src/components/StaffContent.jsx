import React, { useState } from 'react';
import { invitationApi } from '../api/api';

const StaffContent = ({ chefs, waiters, onToggle, onDelete, onRefresh }) => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showPendingInvitations, setShowPendingInvitations] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [invitationLink, setInvitationLink] = useState('');
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
        setShowSuccessScreen(false);
        setInvitationLink('');
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

            console.log('✅ Invitation API response:', response);

            // ✅ FIXED: Extract token from response with better fallback handling
            let token = null;
            let link = '';

            // Try multiple ways to get the token
            if (response.data?.token) {
                token = response.data.token;
            } else if (response.token) {
                token = response.token;
            } else if (response.data?.invitationLink) {
                // Extract token from invitation link if available
                const urlParams = new URLSearchParams(response.data.invitationLink.split('?')[1]);
                token = urlParams.get('token');
            } else if (response.invitationLink) {
                const urlParams = new URLSearchParams(response.invitationLink.split('?')[1]);
                token = urlParams.get('token');
            }

            // Generate link
            if (token) {
                link = `${window.location.origin}/accept-invite?token=${token}`;
            } else {
                // If no token, show a message to check backend logs
                link = 'Check backend console for invitation link';
                console.warn('⚠️ No token in response. Response:', response);
            }

            setInvitationLink(link);
            setSuccess(`Invitation sent to ${inviteForm.email}!`);
            setShowSuccessScreen(true);

        } catch (err) {
            console.error('❌ Invitation error:', err);
            setError(err.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(invitationLink).then(() => {
            alert('✅ Invitation link copied to clipboard!');
        }).catch(() => {
            alert('❌ Failed to copy link. Please copy manually.');
        });
    };

    const handleCloseModal = () => {
        setShowInviteModal(false);
        setShowSuccessScreen(false);
        setInvitationLink('');
        setInviteForm({ name: '', email: '' });
        setError('');
        setSuccess('');
        if (onRefresh) onRefresh();
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
            handleViewPendingInvitations();
        } catch (err) {
            alert('Failed to resend invitation: ' + err.message);
        }
    };

    const handleCancelInvitation = async (userId) => {
        if (!window.confirm('Cancel this invitation? The user will be deleted.')) return;

        try {
            await invitationApi.cancelInvitation(userId);
            alert('Invitation cancelled');
            handleViewPendingInvitations();
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

            {/* ✅✅✅ ENHANCED INVITE MODAL WITH COPY LINK */}
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
                        padding: 0,
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '24px 32px',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            <h2 style={{ margin: 0 }}>
                                {showSuccessScreen ? '✅ Invitation Sent!' : `Invite ${inviteRole}`}
                            </h2>
                            <button
                                onClick={handleCloseModal}
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

                        <div style={{ padding: '32px' }}>
                            {!showSuccessScreen ? (
                                // ✅ FORM SCREEN
                                <>
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
                                                    fontSize: '16px',
                                                    boxSizing: 'border-box'
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
                                                    fontSize: '16px',
                                                    boxSizing: 'border-box'
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
                                            💡 An invitation email will be sent. You can also copy the link for demonstration.
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
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
                                </>
                            ) : (
                                // ✅✅✅ SUCCESS SCREEN WITH COPY LINK
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '64px',
                                        marginBottom: '16px'
                                    }}>
                                        ✅
                                    </div>
                                    <h3 style={{ marginBottom: '8px' }}>Invitation Sent!</h3>
                                    <p style={{ color: '#666', marginBottom: '32px' }}>
                                        An email has been sent to <strong>{inviteForm.email}</strong>
                                    </p>

                                    {/* ✅ COPY LINK SECTION */}
                                    <div style={{
                                        background: '#f5f5f5',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        textAlign: 'left'
                                    }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#333',
                                            marginBottom: '12px'
                                        }}>
                                            📋 Invitation Link:
                                        </label>
                                        <div style={{
                                            display: 'flex',
                                            gap: '10px'
                                        }}>
                                            <input
                                                type="text"
                                                value={invitationLink}
                                                readOnly
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '2px solid #ddd',
                                                    fontSize: '13px',
                                                    fontFamily: 'monospace',
                                                    background: 'white'
                                                }}
                                            />
                                            <button
                                                onClick={handleCopyLink}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: '#4caf50',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            marginTop: '12px',
                                            marginBottom: 0
                                        }}>
                                            💡 You can share this link directly for demonstration
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCloseModal}
                                        style={{
                                            padding: '12px 40px',
                                            background: '#8b6f47',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Invitations Modal - Unchanged */}
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