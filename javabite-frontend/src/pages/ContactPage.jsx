import React from 'react';

const ContactPage = () => {
    // ✅ Your restaurant's actual location
    // TODO: Replace with your real coordinates
    const RESTAURANT_LOCATION = {
        name: "JavaBite Coffee",
        address: "123 Coffee Street, Downtown",
        latitude: 26.216363400803008,   // Replace with actual latitude
        longitude: 78.18501699651586, // Replace with actual longitude
        phone: "+1 (555) 123-4567",
        email: "hello@javabite.com",
        hours: {
            weekdays: "7:00 AM - 10:00 PM",
            weekends: "8:00 AM - 11:00 PM"
        }
    };

    // ✅ Handle Get Directions Click
    const handleGetDirections = () => {
        const { latitude, longitude, address } = RESTAURANT_LOCATION;

        // Detect if user is on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            // iOS: Offer Apple Maps or Google Maps
            const useAppleMaps = window.confirm(
                "🗺️ Choose your navigation app:\n\n" +
                "✓ Click OK for Apple Maps\n" +
                "✗ Click Cancel for Google Maps"
            );

            if (useAppleMaps) {
                // Open Apple Maps
                window.open(
                    `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(RESTAURANT_LOCATION.name)}`,
                    '_blank'
                );
            } else {
                // Open Google Maps
                window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                    '_blank'
                );
            }
        } else {
            // Android/Desktop: Open Google Maps directly
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                '_blank'
            );
        }
    };

    // ✅ Alternative: Simple one-click version (Google Maps only)
    const handleGetDirectionsSimple = () => {
        const { latitude, longitude } = RESTAURANT_LOCATION;
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
            '_blank'
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%)',
            padding: '60px 20px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '60px'
                }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#3e2723',
                        marginBottom: '16px'
                    }}>
                        Get In Touch
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        color: '#6d4c41',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        We'd love to hear from you! Visit us, call, or send a message.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '32px',
                    marginBottom: '60px'
                }}>
                    {/* Location Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '40px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>
                            📍
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '16px'
                        }}>
                            Find Us Here
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: '#6d4c41',
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            {RESTAURANT_LOCATION.address}
                        </p>

                        {/* Get Directions Button */}
                        <button
                            onClick={handleGetDirections}
                            style={{
                                padding: '16px 40px',
                                background: 'linear-gradient(135deg, #8b6f47 0%, #6d5635 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(139, 111, 71, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 111, 71, 0.3)';
                            }}
                        >
                            Get Directions 🗺️
                        </button>
                    </div>

                    {/* Phone Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '40px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>
                            📞
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '16px'
                        }}>
                            Call Us
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: '#6d4c41',
                            marginBottom: '24px'
                        }}>
                            {RESTAURANT_LOCATION.phone}
                        </p>
                        <a
                            href={`tel:${RESTAURANT_LOCATION.phone}`}
                            style={{
                                padding: '16px 40px',
                                background: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                            }}
                        >
                            Call Now 📱
                        </a>
                    </div>

                    {/* Email Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '40px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>
                            ✉️
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#3e2723',
                            marginBottom: '16px'
                        }}>
                            Email Us
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: '#6d4c41',
                            marginBottom: '24px'
                        }}>
                            {RESTAURANT_LOCATION.email}
                        </p>
                        <a
                            href={`mailto:${RESTAURANT_LOCATION.email}`}
                            style={{
                                padding: '16px 40px',
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                            }}
                        >
                            Send Email 💌
                        </a>
                    </div>
                </div>

                {/* Operating Hours */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#3e2723',
                        marginBottom: '32px'
                    }}>
                        ⏰ Operating Hours
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            padding: '24px',
                            background: '#f8f9fa',
                            borderRadius: '16px',
                            border: '2px solid #8b6f47'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#3e2723',
                                marginBottom: '12px'
                            }}>
                                Monday - Friday
                            </h3>
                            <p style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#8b6f47'
                            }}>
                                {RESTAURANT_LOCATION.hours.weekdays}
                            </p>
                        </div>
                        <div style={{
                            padding: '24px',
                            background: '#f8f9fa',
                            borderRadius: '16px',
                            border: '2px solid #8b6f47'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#3e2723',
                                marginBottom: '12px'
                            }}>
                                Saturday - Sunday
                            </h3>
                            <p style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#8b6f47'
                            }}>
                                {RESTAURANT_LOCATION.hours.weekends}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;