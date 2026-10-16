import React, { useState, useMemo } from 'react';
import { 
  X, 
  ExternalLink, 
  Navigation, 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Zap, 
  Flame,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { formatDuration, formatPaceOrSpeed } from '../utils/polyline';
import { getMilestoneActivities } from '../services/stravaDataService';

export default function MilestoneActivitiesModal({ 
  milestone, 
  sport = 'run', 
  onClose, 
  onSelectActivityForMap 
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [visibleCount, setVisibleCount] = useState(25);

  const activities = useMemo(() => {
    if (!milestone) return [];
    return getMilestoneActivities({
      sport,
      minDistanceM: milestone.minDistanceM ?? null,
      maxDistanceM: milestone.maxDistanceM ?? null,
      search,
      sort
    });
  }, [milestone, sport, search, sort]);

  if (!milestone) return null;

  const isRun = sport === 'run';
  const themeColor = isRun ? 'var(--accent-run)' : 'var(--accent-ride)';
  const themeGlow = isRun ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 179, 0, 0.25)';

  // Summary aggregates for currently filtered activities
  const totalDistKm = activities.reduce((sum, a) => sum + (Number(a.distance || 0) / 1000), 0);
  const totalElevM = activities.reduce((sum, a) => sum + Number(a.total_elevation_gain || 0), 0);
  const avgSpeed = activities.length > 0 
    ? activities.reduce((sum, a) => sum + Number(a.average_speed || 0), 0) / activities.length 
    : 0;

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="glass-card milestone-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 17, 29, 0.96)',
          border: `1px solid ${themeColor}`,
          boxShadow: `0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px ${themeGlow}`,
          borderRadius: '18px',
          color: 'var(--text-main)',
          animation: 'fadeIn 0.2s ease-out',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="milestone-modal-header" style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(18, 24, 38, 0.8)'
        }}>
          <div className="milestone-modal-header-info" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${themeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: `0 0 15px ${themeGlow}`
            }}>
              {milestone.icon || (isRun ? '🏃' : '🚴')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {milestone.title}
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isRun ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 179, 0, 0.15)',
                  color: themeColor,
                  border: `1px solid ${themeColor}`
                }}>
                  {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {milestone.description || `All recorded ${isRun ? 'runs' : 'rides'} matching this distance benchmark`}
              </p>
            </div>
          </div>

          <button 
            className="icon-btn close-btn" 
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          padding: '12px 24px',
          background: 'rgba(8, 11, 18, 0.95)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Distance
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: themeColor }}>
              {totalDistKm.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>km</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {isRun ? 'Avg Pace' : 'Avg Speed'}
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {formatPaceOrSpeed(sport, avgSpeed)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Elevation
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981' }}>
              +{Math.round(totalElevM)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>m</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Qualifying Runs
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
              {activities.length}
            </div>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="milestone-search-bar" style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder={`Search ${activities.length} activities by title...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#0B0F19',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px 8px 34px',
                color: 'white',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                background: '#0B0F19',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="date_desc">📅 Newest Date First</option>
              <option value="date_asc">📅 Oldest Date First</option>
              <option value="distance_desc">📍 Longest Distance</option>
              <option value="distance_asc">📍 Shortest Distance</option>
              <option value="speed_desc">⚡ Fastest Pace / Speed</option>
              <option value="elevation_desc">⛰️ Most Elevation</option>
            </select>
          </div>
        </div>

        {/* Activities Scrollable List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {activities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '38px', marginBottom: '12px' }}>🎯</div>
              <h4 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '6px' }}>
                No Activities Found
              </h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                {search 
                  ? `No activities match "${search}" in this milestone category.`
                  : `You haven't recorded any ${isRun ? 'runs' : 'rides'} for this specific distance tier yet. Keep training!`
                }
              </p>
            </div>
          ) : (
            visibleActivities.map((act) => {
              const distKm = (Number(act.distance || 0) / 1000).toFixed(2);
              const duration = formatDuration(act.moving_time);
              const pace = formatPaceOrSpeed(act.sport_type || act.type, act.average_speed);
              const elev = Math.round(act.total_elevation_gain || 0);
              const hasPoly = Boolean(act.summary_polyline && act.summary_polyline.length > 5);

              return (
                <div 
                  key={act.id}
                  className="glass-card milestone-activity-card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(16, 22, 36, 0.65)',
                    transition: 'all 0.2s ease',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      {isRun ? '🏃' : '🚴'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'white' }}>
                          {act.name}
                        </h4>
                        {hasPoly && (
                          <span style={{ 
                            fontSize: '0.68rem', 
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            color: '#10B981', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Navigation size={10} /> GPS
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <span>{formatDate(act.start_date)}</span>
                        <span>•</span>
                        <span>{formatTime(act.start_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Metrics Pills */}
                  <div className="milestone-activity-metrics" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Distance</span>
                      <strong style={{ color: themeColor, fontSize: '1rem' }}>{distKm} km</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Time</span>
                      <strong>{duration}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{isRun ? 'Pace' : 'Speed'}</span>
                      <strong>{pace}</strong>
                    </div>

                    {elev > 0 && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Elev</span>
                        <strong style={{ color: '#10B981' }}>+{elev}m</strong>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="milestone-activity-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasPoly && onSelectActivityForMap && (
                      <button
                        onClick={() => onSelectActivityForMap(act)}
                        className="btn"
                        style={{
                          background: 'rgba(252, 82, 0, 0.15)',
                          border: '1px solid rgba(252, 82, 0, 0.4)',
                          color: 'var(--primary)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s ease'
                        }}
                        title="View interactive GPS playback on Leaflet map"
                      >
                        <Navigation size={13} />
                        <span>Map</span>
                      </button>
                    )}

                    <a
                      href={`https://www.strava.com/activities/${act.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn"
                      style={{ width: '32px', height: '32px' }}
                      title="Open on Strava"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              );
            })
          )}

          {/* Load More Button if over 25 activities */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 25)}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Load More Activities ({activities.length - visibleCount} remaining)...
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(12, 17, 29, 0.95)',
          fontSize: '0.78rem',
          color: 'var(--text-dim)'
        }}>
          <span>Showing {visibleActivities.length} of {activities.length} qualifying activities</span>
          <button
            onClick={onClose}
            className="btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '5px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
