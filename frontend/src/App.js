import React, { useState, useEffect } from 'react';
import './App.css';
// Import Supabase client for saving liked images to user's collection
import { createClient } from '@supabase/supabase-js';

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
  const [saveStatus, setSaveStatus] = useState({}); // key: image.id, value: "idle" | "saving" | "saved" | "error"

  // Enable this block and add your Supabase credentials –
  // For security in production, move them to environment variables.
  const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co"; // TODO: Fill in
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // TODO: Fill in
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const PEXELS_API_KEY = 'o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F';

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
  // Save liked image to Supabase collection
  async function handleAddToCollection(img) {
    setSaveStatus((prev) => ({ ...prev, [img.id]: "saving" }));
    // Create a collection table named `liked_images` (manual, or use SQL in Supabase)
    // Table should have columns such as: id (image id), url, alt, photographer, src
    try {
      // Only store minimal fields required for gallery restoration
      const { error } = await supabase.from("liked_images").insert({
        image_id: img.id,
        url: img.url,
        alt: img.alt,
        photographer: img.photographer,
        src: JSON.stringify(img.src)
      });
      if (error) {
        setSaveStatus((prev) => ({ ...prev, [img.id]: "error" }));
      } else {
        setSaveStatus((prev) => ({ ...prev, [img.id]: "saved" }));
      }
    } catch (e) {
      setSaveStatus((prev) => ({ ...prev, [img.id]: "error" }));
    }
  }

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
                  {/* Add to Collection Button */}
                  <button
                    className="save-btn"
                    style={{ marginLeft: "10px" }}
                    onClick={e => {
                      e.stopPropagation();
                      if (saveStatus[img.id] !== "saving" && saveStatus[img.id] !== "saved") {
                        handleAddToCollection(img);
                      }
                    }}
                    disabled={saveStatus[img.id] === "saving" || saveStatus[img.id] === "saved"}
                    aria-label={
                      saveStatus[img.id] === "saved"
                        ? "Already added to collection"
                        : "Add image to collection"
                    }
                  >
                    {saveStatus[img.id] === "idle" || !saveStatus[img.id] ? "Add to Collection"
                      : saveStatus[img.id] === "saving" ? "Saving..."
                      : saveStatus[img.id] === "saved" ? "Saved!"
                      : "Try Again"}
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        {lightbox.open && (
          <div className="lightbox-overlay" onClick={closeLightbox} tabIndex={0}>
            <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
              <img src={lightbox.image.src ? (lightbox.image.src.large2x || lightbox.image.src.large) : (lightbox.image.url)} alt={lightbox.image.alt || 'Full size'} className="lightbox-img" />
              <div className="lightbox-caption">
                <span>{lightbox.image.photographer}</span>
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
