import React, { useState, useEffect } from 'react';
import './App.css';

// Room types for filter
const ROOM_TYPES = [
  { label: 'All', query: '' },
  { label: 'Kitchen', query: 'kitchen interior' },
  { label: 'Bedroom', query: 'bedroom interior' },
  { label: 'Living Room', query: 'living room interior' },
];

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, image: null });
  const [error, setError] = useState('');
  const PEXELS_API_KEY = 'o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F';
  const SUPABASE_URL = "https://krtgthvlqyelczelp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydGd0aHZscXllbGN6ZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI1MDUsImV4cCI6MjA2NzMwODUwNX0.mRUUpm7VsJs089dm3jL-fN8_o-cTT5KH2JKsxL1x4r4";

  // Load theme from system if any
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch images from Pexels API
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError('');
      let url = 'https://api.pexels.com/v1/search?per_page=18';
      if (roomType.query) {
        url += '&query=' + encodeURIComponent(roomType.query);
      } else {
        url += '&query=interior+design';
      }
      try {
        const res = await fetch(url, {
          headers: { Authorization: PEXELS_API_KEY }
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setImages(data.photos || []);
      } catch (e) {
        setError("Failed to load images.");
      }
      setLoading(false);
    };
    fetchImages();
  }, [roomType]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // PUBLIC_INTERFACE
  const onFilterChange = idx => setRoomType(ROOM_TYPES[idx]);

  // PUBLIC_INTERFACE
  const openLightbox = image => setLightbox({ open: true, image });

  // PUBLIC_INTERFACE
  const closeLightbox = () => setLightbox({ open: false, image: null });

  // PUBLIC_INTERFACE
  const saveInspiration = async (img) => {
    // Lazy load Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Save selected image to user's inspiration board
    try {
      const { error } = await supabase
        .from('inspirations')
        .insert([{ url: img.src.large, photographer: img.photographer, id: img.id, room: roomType.label }]);
      if (error) {
        alert('Error saving inspiration: ' + error.message);
      } else {
        alert('Saved to your inspiration board!');
      }
    } catch (err) {
      alert('Save failed.');
    }
  };

  return (
    <div className="App">
      <header className="modern-header">
        <h1>
          <span className="color-accent">Inspire</span>
          <span className="color-primary">Space</span>
        </h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <nav className="filter-bar">
        {ROOM_TYPES.map((rt, idx) => (
          <button
            key={rt.label}
            className={`filter-btn${roomType.label === rt.label ? ' active' : ''}`}
            style={{ '--btn-highlight': 'var(--accent)' }}
            onClick={() => onFilterChange(idx)}
            aria-current={roomType.label === rt.label}
          >
            {rt.label}
          </button>
        ))}
      </nav>
      <main>
        <section className="gallery-container">
          {loading && <div className="loading-indicator">Loading...</div>}
          {error && <div className="error">{error}</div>}
          <div className="gallery-grid">
            {images.map(img => (
              <figure key={img.id} className="gallery-item">
                <img
                  src={img.src.medium}
                  alt={img.alt || 'Room inspiration'}
                  loading="lazy"
                  onClick={() => openLightbox(img)}
                  className="gallery-img"
                />
                <figcaption className="img-caption">
                  {img.photographer}
                  <button className="save-btn" title="Save to board" onClick={() => saveInspiration(img)}>★</button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        {lightbox.open && (
          <div className="lightbox-overlay" onClick={closeLightbox} tabIndex={0}>
            <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
              <img src={lightbox.image.src.large2x} alt={lightbox.image.alt || 'Full size'} className="lightbox-img" />
              <div className="lightbox-caption">
                <span>{lightbox.image.photographer}</span>
                <button className="save-btn" onClick={() => saveInspiration(lightbox.image)}>Save</button>
              </div>
              <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">&times;</button>
            </div>
          </div>
        )}
      </main>
      <footer className="modern-footer">
        <small>
          Photos via <a href="https://pexels.com/" target="_blank" rel="noopener noreferrer">Pexels</a> | Interior Design Inspiration
        </small>
      </footer>
    </div>
  );
}

export default App;
