import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, ExternalLink, Key } from 'lucide-react';
import { decodePolyline, formatDuration, formatPaceOrSpeed } from '../utils/polyline';
import { getHeatmapRoutes } from '../services/stravaDataService';
import { getCartoApiKey, getBasemapProviders } from '../utils/mapTileService';
import CartoKeyModal from './CartoKeyModal';

const HEATMAP_THEMES = {
  fire: {
    name: '🔥 Strava Fire',
    colors: ['#FFAA00', '#FC5200', '#FF2200'],
    primaryColor: '#FC5200',
    outerGlow: 'rgba(252, 82, 0, 0.45)',
    description: 'Classic glowing orange-red thermal footprint'
  },
  neon: {
    name: '⚡ Cyber Cyan',
    colors: ['#00F0FF', '#00B4D8', '#0077B6'],
    primaryColor: '#00F0FF',
    outerGlow: 'rgba(0, 240, 255, 0.45)',
    description: 'Futuristic electric blue and cyan lasers'
  },
  plasma: {
    name: '💜 Violet Plasma',
    colors: ['#E040FB', '#9933FF', '#7C4DFF'],
    primaryColor: '#9933FF',
    outerGlow: 'rgba(153, 51, 255, 0.45)',
    description: 'Deep ultraviolet nebula trails'
  },
  emerald: {
    name: '🟢 Neon Emerald',
    colors: ['#10B981', '#059669', '#34D399'],
    primaryColor: '#10B981',
    outerGlow: 'rgba(16, 185, 129, 0.45)',
    description: 'High-contrast trail and nature green'
  }
};

export default function AllActivityHeatmap({ onSelectActivityForMap, initialSport = 'all', onSportChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const allBoundsRef = useRef(null);

  const [cartoKey, setCartoKey] = useState(getCartoApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const basemapProviders = useMemo(() => getBasemapProviders(cartoKey), [cartoKey]);

  const [routes, setRoutes] = useState([]);
  const [counts, setCounts] = useState({ all: 348, run: 146, ride: 91, other: 111 });
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState(initialSport || 'all');
  const [themeKey, setThemeKey] = useState('fire');
  const [basemapKey, setBasemapKey] = useState(getCartoApiKey() ? 'dark' : 'osm_dark');
  const [glowIntensity, setGlowIntensity] = useState('high'); // 'subtle', 'normal', 'high', 'blaze'
  const [selectedRoute, setSelectedRoute] = useState(null);

  const handleFocusSurat = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.0936, 73.2755], 13, { duration: 1.2 });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && allBoundsRef.current && allBoundsRef.current.isValid()) {
      mapInstanceRef.current.fitBounds(allBoundsRef.current, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // Sync when initialSport prop changes externally
  useEffect(() => {
    if (initialSport) {
      setSportFilter(initialSport);
    }
  }, [initialSport]);

  const handleSportSelect = (sportId) => {
    setSportFilter(sportId);
    if (onSportChange) onSportChange(sportId);
  };

  // Load heatmap routes
  const loadHeatmapData = () => {
    setLoading(true);
    try {
      const data = getHeatmapRoutes(sportFilter);
      setRoutes(data.routes || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load heatmap routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmapData();
  }, [sportFilter]);

  // Aggregate stats
  const totalKm = useMemo(() => {
    return routes.reduce((sum, r) => sum + (r.distance_km || 0), 0).toFixed(0);
  }, [routes]);

  const totalPointsEstimate = useMemo(() => {
    return routes.length * 280; // Estimated coordinates rendered
  }, [routes]);

  // Initialize and Render Leaflet Heatmap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Map
      const map = L.map(mapContainerRef.current, {
        center: [21.0936, 73.2755], // Bajipura / Gujarat default
        zoom: 12,
        zoomControl: true,
        preferCanvas: true
      });
      mapInstanceRef.current = map;

      // Add Tile Layer
      const baseInfo = basemapProviders[basemapKey] || basemapProviders.osm_dark;
      L.tileLayer(baseInfo.url, {
        attribution: baseInfo.attribution,
        subdomains: baseInfo.subdomains || 'abc',
        className: baseInfo.className || '',
        maxZoom: baseInfo.maxZoom || 19
      }).addTo(map);

      // Create Layer Group for routes
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
    } else {
      // Update tile layer if changed
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      const baseInfo = basemapProviders[basemapKey] || basemapProviders.osm_dark;
      L.tileLayer(baseInfo.url, {
        attribution: baseInfo.attribution,
        subdomains: baseInfo.subdomains || 'abc',
        className: baseInfo.className || '',
        maxZoom: baseInfo.maxZoom || 19
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    if (routes.length === 0) return;

    const theme = HEATMAP_THEMES[themeKey];
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const allBounds = L.latLngBounds([]);

    // Intensity styling configurations
    let baseOpacity = 0.65;
    let baseWeight = 2.8;
    let glowWeight = 7.5;
    let glowOpacity = 0.35;

    if (glowIntensity === 'subtle') {
      baseOpacity = 0.45;
      baseWeight = 2.0;
      glowOpacity = 0.18;
    } else if (glowIntensity === 'high') {
      baseOpacity = 0.75;
      baseWeight = 3.4;
      glowWeight = 9.0;
      glowOpacity = 0.45;
    } else if (glowIntensity === 'blaze') {
      baseOpacity = 0.90;
      baseWeight = 4.2;
      glowWeight = 11.5;
      glowOpacity = 0.60;
    }

    // Render every route on canvas
    routes.forEach((route) => {
      if (!route.polyline) return;
      const coords = decodePolyline(route.polyline);
      if (coords.length < 2) return;

      // Extend bounds
      coords.forEach(pt => allBounds.extend(pt));

      // Glow layer (soft ambient halo)
      const glowLine = L.polyline(coords, {
        renderer: canvasRenderer,
        color: theme.colors[0],
        weight: glowWeight,
        opacity: glowOpacity,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      });
      layerGroup.addLayer(glowLine);

      // Core thermal line
      const mainLine = L.polyline(coords, {
        renderer: canvasRenderer,
        color: theme.primaryColor,
        weight: baseWeight,
        opacity: baseOpacity,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: true
      });

      // Interactive hover & click
      mainLine.on('mouseover', () => {
        mainLine.setStyle({
          color: '#FFFFFF',
          weight: baseWeight + 2.5,
          opacity: 1.0
        });
      });

      mainLine.on('mouseout', () => {
        mainLine.setStyle({
          color: theme.primaryColor,
          weight: baseWeight,
          opacity: baseOpacity
        });
      });

      mainLine.on('click', () => {
        setSelectedRoute(route);
      });

      layerGroup.addLayer(mainLine);
    });

    allBoundsRef.current = allBounds;

    // Auto fit all routes with smooth bounds
    if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 15 });
    }

    // Invalidate size once rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [routes, themeKey, basemapKey, glowIntensity, cartoKey]);

  return (
    <div className="section-card glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Header & Controls Strip */}
      <div className="section-title-wrap" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
            <span>All-Activity Personal Heatmap</span>
            <span className="badge-pill" style={{ background: 'rgba(252, 82, 0, 0.2)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
              Strava Heatmap Clone
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Overlay all <strong>{routes.length} GPS routes simultaneously</strong>. Roads and trails you train on frequently glow with intense heat density.
          </p>
        </div>

        {/* HUD Counters */}
        <div className="heatmap-hud-grid">
          <div className="hud-metric-pill" style={{ background: 'rgba(252, 82, 0, 0.12)', border: '1px solid rgba(252, 82, 0, 0.3)', padding: '6px 14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Routes Mapped</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{routes.length}</strong>
          </div>

          <div className="hud-metric-pill" style={{ background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)', padding: '6px 14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Heatmap Footprint</span>
            <strong style={{ fontSize: '1.15rem', color: '#00E5FF', fontFamily: 'var(--font-display)' }}>{totalKm} km</strong>
          </div>

          <div className="hud-metric-pill" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>GPS Canvas Data</span>
            <strong style={{ fontSize: '1.15rem', color: '#10B981', fontFamily: 'var(--font-display)' }}>~{Math.round(totalPointsEstimate / 1000)}k pts</strong>
          </div>
        </div>
      </div>

      {/* Control Toolbars */}
      <div className="heatmap-control-panel">
        {/* Sport Filter Buttons */}
        <div className="heatmap-control-section">
          <span className="heatmap-control-label">Sport View:</span>
          <div className="heatmap-sport-grid">
            {[
              { id: 'all', label: '🌐 All', count: counts.all, color: 'var(--primary)', desc: 'All 348 GPS tracks in one' },
              { id: 'run', label: '🏃 Runs', count: counts.run, color: 'var(--accent-run)', desc: '146 Running routes only' },
              { id: 'ride', label: '🚴 Rides', count: counts.ride, color: 'var(--accent-ride)', desc: '91 Cycling routes only' },
              { id: 'other', label: '🥾 Hikes', count: counts.other, color: '#38BDF8', desc: '111 Trails, walks & secondary sports' }
            ].map(tab => {
              const isSelected = sportFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSportSelect(tab.id)}
                  title={tab.desc}
                  className="heatmap-sport-btn"
                  style={{
                    borderColor: isSelected ? tab.color : 'rgba(255, 255, 255, 0.12)',
                    background: isSelected ? `${tab.color}24` : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? 'white' : 'var(--text-muted)',
                    boxShadow: isSelected ? `0 0 16px ${tab.color}33` : 'none'
                  }}
                >
                  <span className="heatmap-sport-label">{tab.label}</span>
                  <span 
                    className="heatmap-sport-count"
                    style={{
                      background: isSelected ? tab.color : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#000' : 'var(--text-dim)'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Picker */}
        <div className="heatmap-control-section">
          <span className="heatmap-control-label">Heat Color:</span>
          <div className="heatmap-theme-grid">
            {Object.entries(HEATMAP_THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setThemeKey(key)}
                title={t.description}
                className="heatmap-theme-btn"
                style={{
                  borderColor: themeKey === key ? t.primaryColor : 'rgba(255, 255, 255, 0.08)',
                  background: themeKey === key ? `${t.primaryColor}26` : 'transparent',
                  color: themeKey === key ? 'white' : 'var(--text-muted)'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Glow Intensity & Basemap Style */}
        <div className="heatmap-control-section heatmap-settings-row">
          <div className="heatmap-select-item">
            <span className="heatmap-control-label">Glow:</span>
            <select
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(e.target.value)}
              className="heatmap-select"
            >
              <option value="subtle">Subtle</option>
              <option value="normal">Normal</option>
              <option value="high">High Glow</option>
              <option value="blaze">🔥 Ultra Blaze</option>
            </select>
          </div>

          <div className="heatmap-select-item">
            <span className="heatmap-control-label">Map:</span>
            <select
              value={basemapKey}
              onChange={(e) => setBasemapKey(e.target.value)}
              className="heatmap-select"
            >
              {Object.entries(basemapProviders).map(([k, s]) => (
                <option key={k} value={k}>{s.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure CARTO API Key to remove watermarks"
            className="heatmap-carto-btn"
            style={{
              background: cartoKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(252, 82, 0, 0.15)',
              borderColor: cartoKey ? 'rgba(16, 185, 129, 0.35)' : 'rgba(252, 82, 0, 0.35)',
              color: cartoKey ? '#10B981' : 'var(--primary)'
            }}
          >
            <Key size={13} />
            <span>{cartoKey ? 'CARTO Key ✓' : 'CARTO Key'}</span>
          </button>

          <button
            onClick={handleFocusSurat}
            title="Zoom directly into main training cluster in Bajipura & Surat"
            className="heatmap-carto-btn"
            style={{
              background: 'rgba(252, 82, 0, 0.15)',
              borderColor: 'rgba(252, 82, 0, 0.35)',
              color: 'var(--primary)'
            }}
          >
            <span>📍 Focus Surat &amp; Bajipura</span>
          </button>

          <button
            onClick={handleFitAll}
            title="Fit all 348 routes across Gujarat"
            className="heatmap-carto-btn"
            style={{
              background: 'rgba(0, 229, 255, 0.12)',
              borderColor: 'rgba(0, 229, 255, 0.3)',
              color: '#00E5FF'
            }}
          >
            <span>🌐 Fit All Routes</span>
          </button>
        </div>
      </div>
 
      {/* Current View Explanatory Strip */}
      <div 
        className="heatmap-explanatory-strip"
        style={{
          background: sportFilter === 'all' ? 'rgba(252, 82, 0, 0.08)' : 'rgba(15, 23, 42, 0.6)',
          borderColor: sportFilter === 'all' ? 'rgba(252, 82, 0, 0.3)' : 'var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>
            {sportFilter === 'all' ? '🌐' : sportFilter === 'run' ? '🏃' : sportFilter === 'ride' ? '🚴' : '🥾'}
          </span>
          <div>
            <strong style={{ color: 'white' }}>
              {sportFilter === 'all' && 'All-in-One Personal Heatmap: '}
              {sportFilter === 'run' && 'Running-Only Heatmap: '}
              {sportFilter === 'ride' && 'Cycling-Only Heatmap: '}
              {sportFilter === 'other' && 'Hikes, Walks & Secondary Sports Heatmap: '}
            </strong>
            <span style={{ color: 'var(--text-muted)' }}>
              {sportFilter === 'all' && `All ${routes.length} GPS routes rendered together simultaneously. Repeatedly trained streets burn brighter!`}
              {sportFilter === 'run' && `Isolating all ${routes.length} running GPS tracks across roads and trails.`}
              {sportFilter === 'ride' && `Isolating all ${routes.length} cycling GPS tracks across highways, gravel, and hills.`}
              {sportFilter === 'other' && `Isolating all ${routes.length} hiking, walking, and nature trail GPS tracks.`}
            </span>
          </div>
        </div>

        {sportFilter !== 'all' && (
          <button
            onClick={() => handleSportSelect('all')}
            className="btn btn-switch-all"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              background: 'rgba(252, 82, 0, 0.15)',
              color: 'var(--primary)',
              border: '1px solid rgba(252, 82, 0, 0.35)',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}
          >
            🌐 Switch to All Combined ({counts.all})
          </button>
        )}
      </div>

      {/* Map Canvas */}
      <div className="heatmap-canvas-container" style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 11, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'white'
          }}>
            <RefreshCw size={36} className="spinning" style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600 }}>Assembling {routes.length || '348'} Personal GPS Routes...</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rendering Leaflet high-performance canvas layers</span>
          </div>
        )}

        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Floating Route Detail Inspector Drawer */}
        {selectedRoute && (
          <div className="heatmap-route-inspector">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(252, 82, 0, 0.2)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)'
                }}>
                  {selectedRoute.sport_type?.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedRoute.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', color: 'white', fontWeight: 700 }}>
                {selectedRoute.name}
              </h4>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>📏 <strong>{selectedRoute.distance_km} km</strong></span>
                <span>⏱️ {formatDuration(selectedRoute.moving_time)}</span>
                <span>⛰️ +{selectedRoute.elevation_m}m</span>
              </div>
            </div>

            <div className="heatmap-inspector-actions">
              <button
                onClick={() => {
                  if (onSelectActivityForMap) onSelectActivityForMap(selectedRoute);
                }}
                className="btn btn-primary btn-inspect-route"
              >
                <span>Inspect Elevation &amp; Playback</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setSelectedRoute(null)}
                className="btn-dismiss-inspector"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Legend Overlay at top right of map */}
        <div className="heatmap-map-legend">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: HEATMAP_THEMES[themeKey].primaryColor }}></div>
            <span>High Frequency Trait (Hot)</span>
          </div>
          <span>•</span>
          <span>Click any line to view activity</span>
        </div>
      </div>

      <CartoKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)} 
        onKeySaved={(k) => setCartoKey(k)} 
      />
    </div>
  );
}
