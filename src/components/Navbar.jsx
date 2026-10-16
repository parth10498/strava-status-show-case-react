import React from 'react';
import { RefreshCw, Zap, Award, Activity } from 'lucide-react';
import { trackVisitorAction } from '../services/visitorTrackingService';

export default function Navbar({ 
  athlete, 
  isAuth, 
  syncing, 
  onSync, 
  onConnect, 
  lastSyncTime, 
  onSeedDemo, 
  onOpenWrapped
}) {
  const athleteName = athlete ? `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() : 'Parth Chaudhari';
  const location = athlete ? [athlete.city, athlete.state].filter(Boolean).join(', ') : 'Bajipura, GUJARAT';
  const avatarUrl = athlete?.profile || 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/69326795/17145505/1/large.jpg';

  return (
    <nav className="navbar glass-card">
      <div className="nav-brand">
        <div className="strava-logo-icon">
          <Activity size={26} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <h1>{athleteName}</h1>
          <p>Strava Milestone &amp; Performance Tracker</p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Season Wrapped Button */}
        <button
          onClick={() => {
            trackVisitorAction('season_wrapped', { year: 2026 });
            onOpenWrapped();
          }}
          className="btn btn-season-wrapped"
          style={{
            background: 'linear-gradient(135deg, rgba(252, 82, 0, 0.25), rgba(168, 85, 247, 0.25))',
            border: '1px solid rgba(252, 82, 0, 0.5)',
            color: 'white',
            fontWeight: 700,
            padding: '8px 14px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(252, 82, 0, 0.25)'
          }}
          title="Open interactive 2026 Strava Wrapped annual recap"
        >
          <span>🎁</span>
          <span>Season Wrapped</span>
        </button>

        <div className="athlete-badge">
          <img src={avatarUrl} alt={athleteName} className="athlete-avatar" />
          <div className="athlete-info">
            <div className="athlete-name">{athleteName}</div>
            <div className="athlete-loc">{location}</div>
          </div>
        </div>

        {isAuth ? (
          <button 
            className="btn btn-primary" 
            onClick={onSync} 
            disabled={syncing}
            title={lastSyncTime ? `Last synced: ${lastSyncTime}` : 'Sync / Refresh Data'}
          >
            <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
            <span>{syncing ? 'Refreshing...' : 'Data Ready'}</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={onConnect}>
              <Zap size={16} />
              <span>Connect Strava</span>
            </button>
            <button className="btn btn-secondary" onClick={onSeedDemo} title="Preview realistic running and cycling milestones">
              <Award size={16} />
              <span>Preview Demo</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
