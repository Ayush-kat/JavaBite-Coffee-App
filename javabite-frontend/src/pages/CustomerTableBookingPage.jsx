import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/api.js';

const CustomerTableBookingPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);

    const TOTAL_TABLES = 20;

    const [bookingForm, setBookingForm] = useState({
        bookingDate: '',
        bookingTime: '12:00',
        numberOfGuests: '2',
        specialRequests: ''
    });

    useEffect(() => {
        if (!isAuthenticated) {
            alert('Please login to book a table');
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Fetch available tables when date or time changes
    useEffect(() => {
        if (bookingForm.bookingDate && bookingForm.bookingTime) {
            fetchAvailableTables();
        }
    }, [bookingForm.bookingDate, bookingForm.bookingTime]);

    const fetchAvailableTables = async () => {
        if (!bookingForm.bookingDate || !bookingForm.bookingTime) {
            return;
        }

        setCheckingAvailability(true);
        setError('');

        try {
            console.log('🔍 Checking availability for:', bookingForm.bookingDate, bookingForm.bookingTime);

            const response = await bookingApi.getAvailableTables(
                bookingForm.bookingDate,
                bookingForm.bookingTime
            );

            console.log('✅ Availability response:', response);

            // Create table status array
            const tableStatuses = [];
            for (let i = 1; i <= TOTAL_TABLES; i++) {
                tableStatuses.push({
                    tableNumber: i,
                    status: response.availableTables.includes(i) ? 'AVAILABLE' : 'BOOKED'
                });
            }

            setAvailableTables(tableStatuses);

            // If selected table is now booked, deselect it
            if (selectedTable && !response.availableTables.includes(selectedTable)) {
                setSelectedTable(null);
                setError('Your selected table is no longer available. Please select another table.');
            }

        } catch (err) {
            console.error('❌ Failed to check availability:', err);
            setError('Failed to check table availability. Please try again.');

            // Show all tables as unknown status
            const tableStatuses = [];
            for (let i = 1; i <= TOTAL_TABLES; i++) {
                tableStatuses.push({
                    tableNumber: i,
                    status: 'UNKNOWN'
                });
            }
            setAvailableTables(tableStatuses);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setBookingForm({
            ...bookingForm,
            [name]: value
        });

        // Reset selected table when date/time changes
        if (name === 'bookingDate' || name === 'bookingTime') {
            setSelectedTable(null);
        }

        if (error) setError('');
    };

    const handleTableSelect = (table) => {
        if (table.status === 'AVAILABLE') {
            setSelectedTable(table.tableNumber);
            if (error) setError('');
        } else if (table.status === 'BOOKED') {
            setError(`Table ${table.tableNumber} is already booked for this time slot. Please select an available table.`);
        }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedTable) {
            setError('Please select an available table');
            return;
        }

        if (!bookingForm.bookingDate || !bookingForm.bookingTime) {
            setError('Please select date and time');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const bookingData = {
                bookingDate: bookingForm.bookingDate,
                bookingTime: bookingForm.bookingTime,
                numberOfGuests: parseInt(bookingForm.numberOfGuests),
                tableNumber: selectedTable,
                specialRequests: bookingForm.specialRequests || null
            };

            console.log('📤 Submitting booking:', bookingData);

            const response = await bookingApi.createBooking(bookingData);

            console.log('✅ Booking successful:', response);

            setSuccess(`Table ${selectedTable} booked successfully! Redirecting to menu...`);

            setTimeout(() => {
                navigate('/menu');
            }, 2000);
        } catch (err) {
            console.error('❌ Booking failed:', err);
            setError(err.message || 'Failed to book table. The table may have been booked by someone else.');

            // Refresh availability
            await fetchAvailableTables();
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const timeSlots = [
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00', '20:30', '21:00'
    ];

    const availableCount = availableTables.filter(t => t.status === 'AVAILABLE').length;
    const bookedCount = availableTables.filter(t => t.status === 'BOOKED').length;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '48px'
                }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#3e2723',
                        marginBottom: '12px'
                    }}>
                        Book Your Table
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        color: '#6d4c41'
                    }}>
                        Select date, time, and see available tables in real-time
                    </p>
                </div>

                {success && (
                    <div style={{
                        background: '#e8f5e9',
                        border: '2px solid #4caf50',
                        color: '#2e7d32',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        ✓ {success}
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#ffebee',
                        border: '2px solid #f44336',
                        color: '#c62828',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleBookingSubmit}>
                    {/* Date and Time Selection */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '24px'
                        }}>
                            📅 Select Date & Time
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '20px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#6d4c41',
                                    marginBottom: '8px'
                                }}>
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    name="bookingDate"
                                    value={bookingForm.bookingDate}
                                    onChange={handleFormChange}
                                    min={getMinDate()}
                                    required
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
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#6d4c41',
                                    marginBottom: '8px'
                                }}>
                                    Time *
                                </label>
                                <select
                                    name="bookingTime"
                                    value={bookingForm.bookingTime}
                                    onChange={handleFormChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '2px solid #d7ccc8',
                                        fontSize: '16px',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#6d4c41',
                                    marginBottom: '8px'
                                }}>
                                    Number of Guests *
                                </label>
                                <input
                                    type="number"
                                    name="numberOfGuests"
                                    value={bookingForm.numberOfGuests}
                                    onChange={handleFormChange}
                                    min="1"
                                    max="8"
                                    required
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
                        </div>

                        {/* Special Requests */}
                        <div style={{ marginTop: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#6d4c41',
                                marginBottom: '8px'
                            }}>
                                Special Requests (Optional)
                            </label>
                            <textarea
                                name="specialRequests"
                                value={bookingForm.specialRequests}
                                onChange={handleFormChange}
                                placeholder="Any special requirements or dietary restrictions..."
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '2px solid #d7ccc8',
                                    fontSize: '16px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* Availability Stats */}
                    {bookingForm.bookingDate && bookingForm.bookingTime && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '32px'
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '3px solid #4caf50',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '36px', fontWeight: '700', color: '#2e7d32' }}>
                                    {availableCount}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6d4c41', marginTop: '4px' }}>
                                    Available Tables
                                </div>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '3px solid #f44336',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '36px', fontWeight: '700', color: '#c62828' }}>
                                    {bookedCount}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6d4c41', marginTop: '4px' }}>
                                    Booked Tables
                                </div>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '3px solid #2196f3',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1565c0' }}>
                                    {TOTAL_TABLES}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6d4c41', marginTop: '4px' }}>
                                    Total Tables
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table Grid */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '8px'
                        }}>
                            🪑 Select Your Table
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#6d4c41',
                            marginBottom: '24px'
                        }}>
                            {!bookingForm.bookingDate || !bookingForm.bookingTime
                                ? 'Please select date and time to see available tables'
                                : checkingAvailability
                                    ? 'Checking availability...'
                                    : availableCount === 0
                                        ? '❌ No tables available for this time slot. Please select a different time.'
                                        : `✓ ${availableCount} table${availableCount !== 1 ? 's' : ''} available`}
                        </p>

                        {checkingAvailability ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '300px',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    border: '4px solid #d7ccc8',
                                    borderTopColor: '#8b6f47',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p style={{ color: '#6d4c41' }}>Checking table availability...</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '16px',
                                marginBottom: '32px'
                            }}>
                                {availableTables.map((table) => {
                                    const isSelected = selectedTable === table.tableNumber;
                                    const isAvailable = table.status === 'AVAILABLE';
                                    const isBooked = table.status === 'BOOKED';

                                    return (
                                        <div
                                            key={table.tableNumber}
                                            onClick={() => handleTableSelect(table)}
                                            style={{
                                                background: isSelected
                                                    ? '#8b6f47'
                                                    : isAvailable
                                                        ? '#e8f5e9'
                                                        : '#ffebee',
                                                borderRadius: '16px',
                                                padding: '24px 16px',
                                                textAlign: 'center',
                                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                border: `3px solid ${
                                                    isSelected
                                                        ? '#6d5739'
                                                        : isAvailable
                                                            ? '#4caf50'
                                                            : '#f44336'
                                                }`,
                                                transition: 'all 0.2s ease',
                                                opacity: isBooked ? 0.6 : 1,
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isAvailable) {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {isBooked && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    fontSize: '20px'
                                                }}>
                                                    🔒
                                                </div>
                                            )}
                                            <div style={{
                                                fontSize: '40px',
                                                marginBottom: '8px'
                                            }}>
                                                {isSelected ? '✓' : isAvailable ? '🪑' : '🔒'}
                                            </div>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: isSelected ? 'white' : '#3e2723',
                                                marginBottom: '4px'
                                            }}>
                                                Table {table.tableNumber}
                                            </h3>
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: isSelected
                                                    ? 'white'
                                                    : isAvailable
                                                        ? '#2e7d32'
                                                        : '#c62828'
                                            }}>
                                                {isSelected ? 'SELECTED' : table.status}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Book Button */}
                        {!checkingAvailability && (
                            <div style={{ textAlign: 'center' }}>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedTable || !bookingForm.bookingDate || checkingAvailability}
                                    style={{
                                        padding: '18px 60px',
                                        background: (loading || !selectedTable || !bookingForm.bookingDate)
                                            ? '#d7ccc8'
                                            : '#8b6f47',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '30px',
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        cursor: (loading || !selectedTable || !bookingForm.bookingDate)
                                            ? 'not-allowed'
                                            : 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 15px rgba(139, 111, 71, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading && selectedTable && bookingForm.bookingDate) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 6px 20px rgba(139, 111, 71, 0.4)';
                                            e.target.style.background = '#6d5739';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 15px rgba(139, 111, 71, 0.3)';
                                        e.target.style.background = '#8b6f47';
                                    }}
                                >
                                    {loading
                                        ? '🔄 Booking...'
                                        : selectedTable
                                            ? `✓ Confirm Table ${selectedTable}`
                                            : '❌ Select a Table First'}
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* Legend */}
                <div style={{
                    marginTop: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '32px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#e8f5e9',
                            border: '2px solid #4caf50',
                            borderRadius: '4px'
                        }}></div>
                        <span style={{ color: '#6d4c41', fontSize: '14px' }}>Available</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#ffebee',
                            border: '2px solid #f44336',
                            borderRadius: '4px'
                        }}></div>
                        <span style={{ color: '#6d4c41', fontSize: '14px' }}>Booked</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#8b6f47',
                            border: '2px solid #6d5739',
                            borderRadius: '4px'
                        }}></div>
                        <span style={{ color: '#6d4c41', fontSize: '14px' }}>Selected</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default CustomerTableBookingPage;