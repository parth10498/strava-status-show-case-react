import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Mountain, 
  Compass, 
  Search, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatDuration, formatPaceOrSpeed } from '../utils/polyline';

import { getActivitiesList } from '../services/stravaDataService';

export default function RouteExplorer({ onSelectActivityForMap, externalFilter = {}, onViewHeatmap }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRoutes = () => {
    setLoading(true);
    try {
      const data = getActivitiesList({
        has_route: true,
        sport: sportFilter,
        search: searchTerm.trim() || undefined,
        year: externalFilter.year || undefined,
        month: externalFilter.month || undefined,
        start_date: externalFilter.startDate || undefined,
        end_date: externalFilter.endDate || undefined,
        per_page: 60,
        page: 1
      });
      setRoutes(data.activities || []);
    } catch (err) {
      console.error('Failed to load GPS routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [sportFilter, externalFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoutes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="section-card glass-card">
      <div className="section-title-wrap">
        <div>
          <h3 className="section-title">
            <span>🗺️ OpenStreetMap GPS Route Explorer</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Browse and inspect every outdoor activity with interactive Leaflet mapping, turn-by-turn paths, and elevation tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search route by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px 7px 32px',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '200px'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          </div>

          {/* Sport pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'ALL ROUTES' },
              { id: 'run', label: '🏃 RUNS' },
              { id: 'ride', label: '🚴 RIDES' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSportFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: sportFilter === tab.id ? 'var(--primary)' : 'var(--border-subtle)',
                  background: sportFilter === tab.id ? 'rgba(252, 82, 0, 0.15)' : 'transparent',
                  color: sportFilter === tab.id ? 'white' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onViewHeatmap && (
            <button
              onClick={() => onViewHeatmap(sportFilter)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                fontWeight: 600
              }}
            >
              <span>🔥 Combined Heatmap (348)</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spinning" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
          <span>Scanning GPS activity database...</span>
        </div>
      ) : routes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Navigation size={40} style={{ opacity: 0.3, margin: '0 auto 12px auto', display: 'block' }} />
          <p>No recorded GPS routes match your current filters.</p>
        </div>
      ) : (
        <div className="routes-cards-grid">
          {routes.map(act => {
            const distKm = ((Number(act.distance) || 0) / 1000.0).toFixed(2);
            const isRun = act.sport_type === 'Run' || act.type === 'Run';
            const isRide = act.sport_type === 'Ride' || act.type === 'Ride' || act.sport_type?.includes('Ride');
            const themeColor = isRun ? 'var(--accent-run)' : isRide ? 'var(--accent-ride)' : 'var(--accent-other)';
            const dateStr = act.start_date ? new Date(act.start_date).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : '';

            return (
              <div 
                key={act.id} 
                className="route-card glass-card"
                onClick={() => onSelectActivityForMap(act)}
              >
                <div className="route-card-header">
                  <div className="route-card-sport" style={{ borderColor: themeColor, color: themeColor }}>
                    {isRun ? '🏃 RUN' : isRide ? '🚴 RIDE' : '✨ HIKE/OTHER'}
                  </div>
                  <span className="route-card-date">{dateStr}</span>
                </div>

                <h4 className="route-card-title">{act.name}</h4>

                {/* Route Metrics Grid */}
                <div className="route-card-metrics">
                  <div className="metric-box">
                    <span className="metric-lbl">Distance</span>
                    <span className="metric-val" style={{ color: themeColor }}>
                      {distKm} <small>km</small>
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl">Time</span>
                    <span className="metric-val">{formatDuration(act.moving_time)}</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl">{isRun ? 'Pace' : 'Speed'}</span>
                    <span className="metric-val">
                      {formatPaceOrSpeed(act.sport_type || act.type, act.average_speed)}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl">Elevation</span>
                    <span className="metric-val">
                      +{Math.round(act.total_elevation_gain || 0)} <small>m</small>
                    </span>
                  </div>
                </div>

                {/* Bottom Callout */}
                <div className="route-card-action">
                  <div className="interactive-hint">
                    <Navigation size={13} style={{ color: themeColor }} />
                    <span>Open in Leaflet Map</span>
                  </div>
                  <ChevronRight size={16} className="route-chevron" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
