import React, { useState, useEffect, useCallback } from 'react';
import { 
  ExternalLink, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  RefreshCw, 
  Navigation,
  MapPin,
  Calendar,
  CheckCircle2,
  Share2,
  Download
} from 'lucide-react';
import { formatDuration, formatPaceOrSpeed } from '../utils/polyline';
import ShareCardModal from './ShareCardModal';
import { getActivitiesList, downloadActivityExport, getSystemStatus } from '../services/stravaDataService';

export default function ActivitiesList({ 
  refreshTrigger, 
  onSelectActivityForMap,
  externalFilter = {} 
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('all');
  const [search, setSearch] = useState('');
  const [routeOnly, setRouteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [shareModalActivity, setShareModalActivity] = useState(null);

  const fetchActivities = useCallback((
    currentPage, 
    currentPerPage, 
    currentSport, 
    currentSearch, 
    currentRouteOnly, 
    filterObj
  ) => {
    setLoading(true);
    try {
      const data = getActivitiesList({
        page: currentPage,
        per_page: currentPerPage,
        sport: currentSport,
        search: currentSearch?.trim() || undefined,
        has_route: currentRouteOnly ? true : null,
        year: filterObj?.year || undefined,
        month: filterObj?.month || undefined,
        start_date: filterObj?.startDate || undefined,
        end_date: filterObj?.endDate || undefined
      });

      setActivities(data.activities || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch paginated activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page, perPage, sport, routeOnly, or externalFilter changes
  useEffect(() => {
    fetchActivities(page, perPage, sport, search, routeOnly, externalFilter);
  }, [page, perPage, sport, routeOnly, externalFilter, refreshTrigger, fetchActivities]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      fetchActivities(1, perPage, sport, search, routeOnly, externalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, perPage, sport, routeOnly, externalFilter, fetchActivities]);

  const handleSportChange = (newSport) => {
    setSport(newSport);
    setPage(1);
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value, 10);
    setPerPage(newPerPage);
    setPage(1);
  };

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = total > 0 ? (page - 1) * perPage + 1 : 0;
  const endItem = Math.min(page * perPage, total);

  return (
    <div className="section-card glass-card">
      <div className="section-title-wrap">
        <h3 className="section-title">
          <span>📋 Workout Feed &amp; Route History</span>
        </h3>
        
        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search by workout name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Sport Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'ALL' },
              { id: 'run', label: '🏃 RUN' },
              { id: 'ride', label: '🚴 RIDE' },
              { id: 'other', label: '✨ OTHER' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSportChange(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: sport === tab.id ? 'var(--primary)' : 'var(--border-subtle)',
                  background: sport === tab.id ? 'rgba(252, 82, 0, 0.15)' : 'transparent',
                  color: sport === tab.id ? 'white' : 'var(--text-muted)',
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

          {/* Route Only Filter Toggle */}
          <button
            onClick={() => {
              setRouteOnly(!routeOnly);
              setPage(1);
            }}
            className={`route-filter-btn ${routeOnly ? 'active' : ''}`}
            title="Filter activities that have Leaflet GPS route data"
          >
            <Navigation size={13} />
            <span>🗺️ GPS Route Only</span>
            {routeOnly && <CheckCircle2 size={12} style={{ color: '#10B981', marginLeft: '4px' }} />}
          </button>

          {/* Items Per Page Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show:</span>
            <select 
              value={perPage} 
              onChange={handlePerPageChange}
              className="per-page-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
          <span>Loading workouts page {page}...</span>
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          No workouts found matching the current filters.
        </div>
      ) : (
        <div className="activities-table">
          {activities.map(act => {
            const distKm = ((Number(act.distance) || 0) / 1000.0).toFixed(2);
            const dateStr = act.start_date ? new Date(act.start_date).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : '';

            const isRun = act.sport_type === 'Run' || act.type === 'Run';
            const isRide = act.sport_type === 'Ride' || act.type === 'Ride' || act.sport_type?.includes('Ride');
            const hasRoute = Boolean(act.summary_polyline && act.summary_polyline.length > 5);

            return (
              <div key={act.id} className="activity-item glass-card">
                <div className="activity-left">
                  <div className="activity-sport-icon">
                    {isRun ? '🏃' : isRide ? '🚴' : '✨'}
                  </div>
                  <div>
                    <div className="activity-name-row">
                      <span className="activity-name">{act.name}</span>
                      {hasRoute && (
                        <span className="route-badge-pill" title="GPS Track Recorded">
                          <Navigation size={10} />
                          <span>GPS Route</span>
                        </span>
                      )}
                    </div>
                    <div className="activity-date">
                      {act.sport_type || act.type} • {dateStr}
                    </div>
                  </div>
                </div>

                <div className="activity-stats-row">
                  <div className="act-stat">
                    <span className="act-stat-label">Distance</span>
                    <span className="act-stat-val" style={{ color: isRun ? 'var(--accent-run)' : isRide ? 'var(--accent-ride)' : 'white' }}>
                      {distKm} km
                    </span>
                  </div>

                  <div className="act-stat">
                    <span className="act-stat-label">Time</span>
                    <span className="act-stat-val">{formatDuration(act.moving_time)}</span>
                  </div>

                  <div className="act-stat">
                    <span className="act-stat-label">{isRun ? 'Pace' : 'Speed'}</span>
                    <span className="act-stat-val">
                      {formatPaceOrSpeed(act.sport_type || act.type, act.average_speed)}
                    </span>
                  </div>

                  {act.total_elevation_gain > 0 && (
                    <div className="act-stat">
                      <span className="act-stat-label">Elevation</span>
                      <span className="act-stat-val">+{Math.round(act.total_elevation_gain)}m</span>
                    </div>
                  )}

                  {/* Open Leaflet Map Route Button */}
                  {hasRoute ? (
                    <button
                      type="button"
                      className="btn btn-view-route"
                      onClick={() => onSelectActivityForMap(act)}
                      title="Open interactive Leaflet map of this activity"
                    >
                      <Navigation size={13} />
                      <span>View Route</span>
                    </button>
                  ) : (
                    <span className="no-gps-badge" title="Stationary or indoor session">
                      No GPS
                    </span>
                  )}

                  {/* Share Card Generator Button */}
                  <button
                    type="button"
                    onClick={() => setShareModalActivity(act)}
                    className="icon-btn"
                    style={{ padding: '6px 8px', borderRadius: '8px' }}
                    title="Generate Instagram Story / WhatsApp Share Card"
                  >
                    <Share2 size={13} style={{ color: 'var(--primary)' }} />
                  </button>

                  {/* GPX Export Button */}
                  {hasRoute && (
                    <button
                      onClick={() => downloadActivityExport(act.id, 'gpx')}
                      className="icon-btn"
                      style={{ padding: '5px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none', background: 'rgba(255, 255, 255, 0.08)', cursor: 'pointer' }}
                      title="Download GPX route coordinates"
                    >
                      GPX
                    </button>
                  )}

                  {/* Strava Link */}
                  <a 
                    href={`https://www.strava.com/activities/${act.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    title="View on Strava"
                  >
                    <span>Strava</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {total > 0 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing <strong style={{ color: 'var(--text-main)' }}>{startItem}–{endItem}</strong> of <strong style={{ color: 'var(--text-main)' }}>{total}</strong> activities
          </div>

          <div className="pagination-controls">
            {/* First Page */}
            <button 
              className="page-btn" 
              onClick={() => setPage(1)} 
              disabled={page <= 1}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button 
              className="page-btn" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page <= 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Numbered Page Buttons */}
            {getPageNumbers().map((pNum, idx) => {
              if (pNum === '...') {
                return (
                  <span key={`dots-${idx}`} style={{ padding: '0 6px', color: 'var(--text-dim)' }}>
                    …
                  </span>
                );
              }
              return (
                <button
                  key={`page-${pNum}`}
                  className={`page-btn ${page === pNum ? 'active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button 
              className="page-btn" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button 
              className="page-btn" 
              onClick={() => setPage(totalPages)} 
              disabled={page >= totalPages}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Social Share Card Studio Modal */}
      {shareModalActivity && (
        <ShareCardModal
          activity={shareModalActivity}
          athlete={getSystemStatus().athlete}
          onClose={() => setShareModalActivity(null)}
        />
      )}
    </div>
  );
}
