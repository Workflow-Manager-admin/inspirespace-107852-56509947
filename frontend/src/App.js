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
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState([]);
  const [fetchingCollections, setFetchingCollections] = useState(false);

  const PEXELS_API_KEY = 'o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F';
  const SUPABASE_URL = "https://krtgthvlqyelczelp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydGd0aHZscXllbGN6ZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI1MDUsImV4cCI6MjA2NzMwODUwNX0.mRUUpm7VsJs089dm3jL-fN8_o-cTT5KH2JKsxL1x4r4";

  // Load theme from system if any
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch images from Pexels API (with search + filter)
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError('');
      let url = 'https://api.pexels.com/v1/search?per_page=18';
      let query = '';

      if (search.trim()) {
        query = search.trim();
      } else if (roomType.query) {
        query = roomType.query;
      } else {
        query = 'interior design';
      }
      url += '&query=' + encodeURIComponent(query);

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
  }, [roomType, search]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // PUBLIC_INTERFACE
  const onFilterChange = idx => setRoomType(ROOM_TYPES[idx]);

  // PUBLIC_INTERFACE
  const openLightbox = image => setLightbox({ open: true, image });

  // PUBLIC_INTERFACE
  const closeLightbox = () => setLightbox({ open: false, image: null });

  // PUBLIC_INTERFACE
  // Save ('add to collections') to Supabase table 'inspirations'
  const saveInspiration = async (img) => {
    // Lazy load Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
      // The PK can simply be the image id, but let's allow duplicate saves for demo (no upsert)
      const { error } = await supabase
        .from('inspirations')
        .insert([{
          url: img.src.large,
          photographer: img.photographer,
          id: img.id,
          room: img.room || roomType.label,
          alt: img.alt || '',
        }]);
      if (error) {
        alert('Error saving inspiration: ' + error.message);
      } else {
        alert('Saved to your collection!');
        // Hint: reload collections, in case the user is viewing them
      }
    } catch (err) {
      alert('Save failed.');
    }
  };

  // PUBLIC_INTERFACE
  // Fetch all saved inspirations from Supabase
  const loadCollections = async () => {
    setFetchingCollections(true);
    setError('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      // Some environments require .select() columns as array of string as 2nd parameter
      // Defensive fetch for all columns as '*'
      let query = supabase
        .from('inspirations')
        .select('*');

      // .order() may throw if shape is unexpected, so catch this as well
      let data, error;
      try {
        ({ data, error } = await query.order('id', { ascending: false }));
      } catch (err) {
        // fallback: query without ordering if ordering key is not present or fails
        ({ data, error } = await query);
      }

      if (error) {
        setCollections([]);
        setError('Failed to fetch collections.');
      } else {
        // Validate that data is an array of collection items
        setCollections(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError('Failed to fetch collections.');
      setCollections([]);
    }
    setFetchingCollections(false);
  };

  // PUBLIC_INTERFACE
  // Remove an image from collections
  const removeFromCollections = async (imgId) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', imgId);
      if (error) {
        alert('Could not remove image.');
      } else {
        setCollections(collections.filter(item => item.id !== imgId));
      }
    } catch (e) {
      alert('Could not remove image.');
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
            onClick={() => { setSearch(''); onFilterChange(idx); }}
            aria-current={roomType.label === rt.label}
          >
            {rt.label}
          </button>
        ))}
        {/* Show My Collections button */}
        <button
          className="filter-btn"
          onClick={() => loadCollections()}
        >
          Saved Collections
        </button>
      </nav>
      <main>
        {/* Search Bar */}
        <section style={{ display: "flex", justifyContent: "center", padding: "1.2em 0 0.1em" }}>
          <form
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              maxWidth: 430
            }}
            onSubmit={e => { e.preventDefault(); setRoomType(ROOM_TYPES[0]); }}
            role="search"
            aria-label="Image search"
          >
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inspiration (e.g. modern, office, plant)..."
              aria-label="Search images"
              style={{
                flex: 1,
                border: '1.5px solid var(--border-color)',
                borderRadius: 18,
                padding: "0.6em 1.2em",
                fontSize: 17,
                marginRight: 8,
                outline: 'none',
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              className="filter-btn"
              style={{ padding: '0.4em 1.5em', fontWeight: 600 }}
              aria-label="Search"
            >
              Search
            </button>
          </form>
        </section>
        {!collections.length ? (
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
        ) : (
          <section className="gallery-container">
            <h2 style={{
              fontWeight: 800,
              padding: '0.1em 0 0.4em 0.2em',
              color: "var(--secondary)",
              letterSpacing: "0.03em"
            }}>Saved Collections</h2>
            <button
              className="filter-btn"
              style={{ fontWeight: 400, marginBottom: 16 }}
              onClick={() => setCollections([])}
            >Back to Gallery</button>
            {fetchingCollections && <div className="loading-indicator">Loading your saved images...</div>}
            {!fetchingCollections && collections.length === 0 && <div className="loading-indicator">No saved images found.</div>}
            <div className="gallery-grid">
              {collections.map(item => (
                <figure key={item.id} className="gallery-item">
                  <img
                    src={item.url}
                    alt={item.alt || 'Saved Inspiration'}
                    loading="lazy"
                    className="gallery-img"
                  />
                  <figcaption className="img-caption">
                    {item.photographer}
                    <button className="save-btn" title="Remove from collections" onClick={() => removeFromCollections(item.id)} style={{ background: 'var(--primary)', color: 'var(--secondary)', fontWeight: 600, fontSize: '1.1em' }}>×</button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {lightbox.open && (
          <div className="lightbox-overlay" onClick={closeLightbox} tabIndex={0}>
            <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
              <img src={lightbox.image.src ? (lightbox.image.src.large2x || lightbox.image.src.large) : (lightbox.image.url)} alt={lightbox.image.alt || 'Full size'} className="lightbox-img" />
              <div className="lightbox-caption">
                <span>{lightbox.image.photographer}</span>
                {lightbox.image.src ? (
                  <button className="save-btn" onClick={() => saveInspiration(lightbox.image)}>Save</button>
                ) : null}
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
