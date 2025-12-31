import React from 'react';
import '../styles/About.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <h1 className="about-hero-title">Our Story</h1>
                    <p className="about-hero-subtitle">
                        Brewing happiness since 2015
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="story-container">
                    <div className="story-content">
                        <h2 className="story-title">Where It All Began</h2>
                        <p className="story-text">
                            JavaBite Coffee started with a simple dream: to create a cozy space where
                            people could enjoy exceptional coffee and delicious pastries. What began as
                            a small café has grown into a beloved community gathering place.
                        </p>
                        <p className="story-text">
                            We source our beans from sustainable farms around the world, ensuring every
                            cup tells a story of quality and care. Our pastries are baked fresh daily
                            using traditional recipes passed down through generations.
                        </p>
                    </div>
                    <div className="story-image">
                        <img
                            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&h=600&fit=crop"
                            alt="Coffee shop interior"
                        />
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <h2 className="values-title">Our Values</h2>
                <div className="values-grid">
                    <div className="value-card">
                        <div className="value-icon">☕</div>
                        <h3 className="value-heading">Quality First</h3>
                        <p className="value-description">
                            We never compromise on the quality of our ingredients.
                            Every bean is carefully selected and roasted to perfection.
                        </p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">🌱</div>
                        <h3 className="value-heading">Sustainability</h3>
                        <p className="value-description">
                            We're committed to environmental responsibility through
                            ethical sourcing and eco-friendly practices.
                        </p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">❤️</div>
                        <h3 className="value-heading">Community</h3>
                        <p className="value-description">
                            We believe in building connections and creating a
                            welcoming space for everyone in our neighborhood.
                        </p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">🎨</div>
                        <h3 className="value-heading">Craftsmanship</h3>
                        <p className="value-description">
                            Every drink is crafted with precision and passion by
                            our skilled baristas who love what they do.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <h2 className="team-title">Meet Our Team</h2>
                <div className="team-grid">
                    <div className="team-member">
                        <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                            alt="Team member"
                            className="team-photo"
                        />
                        <h3 className="team-name">Alan Rodriguez</h3>
                        <p className="team-role">Head Barista</p>
                        <p className="team-bio">
                            15 years of coffee expertise and latte art champion
                        </p>
                    </div>
                    <div className="team-member">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
                            alt="Team member"
                            className="team-photo"
                        />
                        <h3 className="team-name">Sarah Chen</h3>
                        <p className="team-role">Pastry Chef</p>
                        <p className="team-bio">
                            Award-winning baker with a passion for innovation
                        </p>
                    </div>
                    <div className="team-member">
                        <img
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
                            alt="Team member"
                            className="team-photo"
                        />
                        <h3 className="team-name">Michael Torres</h3>
                        <p className="team-role">Manager</p>
                        <p className="team-bio">
                            Creating memorable experiences for our guests daily
                        </p>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="location-section">
                <div className="location-container">
                    <div className="location-info">
                        <h2 className="location-title">Visit Us</h2>
                        <div className="location-details">
                            <div className="location-item">
                                <strong>📍 Address</strong>
                                <p>123 Coffee Street<br/>Downtown, City 12345</p>
                            </div>
                            <div className="location-item">
                                <strong>⏰ Hours</strong>
                                <p>
                                    Mon - Fri: 7:00 AM - 10:00 PM<br/>
                                    Sat - Sun: 8:00 AM - 11:00 PM
                                </p>
                            </div>
                            <div className="location-item">
                                <strong>📞 Contact</strong>
                                <p>
                                    Phone: +1 (555) 123-4567<br/>
                                    Email: hello@javabite.com
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="location-map">
                        <img
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop"
                            alt="Cafe location"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;