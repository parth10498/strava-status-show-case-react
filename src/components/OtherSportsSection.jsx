import React from 'react';
import { Dumbbell, Footprints, Waves, Compass, Activity, Mountain } from 'lucide-react';

const SPORT_ICONS = {
  Walk: '🚶‍♂️',
  Hike: '🥾',
  Swim: '🏊‍♂️',
  WeightTraining: '🏋️‍♂️',
  Workout: '💪',
  Yoga: '🧘‍♂️',
  Crossfit: '🤸‍♂️',
  VirtualRide: '🚴‍♂️',
  VirtualRun: '🏃‍♂️',
  RockClimbing: '🧗‍♂️',
  Rowing: '🚣‍♂️',
};

export default function OtherSportsSection({ otherSports, allSportsBreakdown, onViewHeatmap }) {
  const sports = otherSports?.sports || [];
  const totalOtherCount = otherSports?.total_count || 0;

  return (
    <div className="other-sports-hub">
      {/* Quick Heatmap Shortcut Banner */}
      {onViewHeatmap && (
        <div 
          onClick={onViewHeatmap}
          className="glass-card heatmap-shortcut-banner" 
          style={{
            marginBottom: '24px',
            background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.08) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🗺️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'white', fontWeight: 700 }}>
                  View All Hikes, Walks & Trail Routes on Personal Heatmap
                </h4>
                <span className="badge-pill" style={{ background: '#38BDF8', color: '#000', fontWeight: 800, fontSize: '0.7rem' }}>
                  111 GPS TRACKS
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Explore your outdoor walks, hiking excursions, and mountain expeditions on an interactive heatmap.
              </p>
            </div>
          </div>

          <button 
            className="btn"
            style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.2)', borderColor: '#38BDF8', color: 'white' }}
          >
            <span>Open Trails Heatmap</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Overview card */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <h3 className="section-title">
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <span>All Other Sports & Cross-Training</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Activity counts and endurance logged across secondary sports
          </span>
        </div>

        {sports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No secondary sports recorded yet. Activities like Walks, Hikes, Swims, or Gym Sessions will appear here automatically!
          </div>
        ) : (
          <div className="sports-grid">
            {sports.map((item, idx) => {
              const icon = SPORT_ICONS[item.sport] || '🏅';
              return (
                <div key={idx} className="sport-card glass-card">
                  <div className="sport-icon-box">
                    <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                  </div>
                  <div>
                    <div className="sport-title">{item.sport}</div>
                    <div className="sport-count-text">
                      {item.count} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.count === 1 ? 'activity' : 'activities'}</span>
                    </div>
                    <div className="sport-details">
                      {item.total_distance_km > 0 && `${item.total_distance_km} km • `}
                      {item.total_moving_time_hours} hrs
                      {item.total_elevation_gain_m > 0 && ` • ${item.total_elevation_gain_m}m climbing`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete sport activity distribution badge cloud */}
      {allSportsBreakdown && allSportsBreakdown.length > 0 && (
        <div className="section-card glass-card" style={{ marginTop: '24px' }}>
          <div className="section-title-wrap">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Full Multi-Sport Activity Summary</h4>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Distribution across every logged discipline</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {allSportsBreakdown.map((s, idx) => (
              <div 
                key={idx} 
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <span>{SPORT_ICONS[s.sport] || '🏅'}</span>
                <span>{s.sport}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
