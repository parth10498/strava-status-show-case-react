import React from 'react';
import { Activity, Flame, Clock, Mountain, Trophy, Compass } from 'lucide-react';

export default function HeroStats({ overall, runningCount, cyclingCount, otherCount }) {
  if (!overall) return null;

  return (
    <div className="hero-stats-grid">
      {/* Total Activities */}
      <div className="stat-tile glass-card">
        <div className="stat-header">
          <span className="stat-title">Total Workouts</span>
          <div className="stat-icon" style={{ color: '#FC5200' }}>
            <Activity size={20} />
          </div>
        </div>
        <div className="stat-value">
          {overall.total_activities}
        </div>
        <div className="stat-subtext" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--accent-run)' }}>🏃 {runningCount || 0} Runs</span>
          <span style={{ color: 'var(--accent-ride)' }}>🚴 {cyclingCount || 0} Rides</span>
          <span style={{ color: 'var(--accent-other)' }}>✨ {otherCount || 0} Others</span>
        </div>
      </div>

      {/* Total Distance */}
      <div className="stat-tile run-tile glass-card">
        <div className="stat-header">
          <span className="stat-title">All-Time Distance</span>
          <div className="stat-icon" style={{ color: 'var(--accent-run)' }}>
            <Compass size={20} />
          </div>
        </div>
        <div className="stat-value">
          {overall.total_distance_km.toLocaleString()}
          <span className="stat-unit">km</span>
        </div>
        <div className="stat-subtext">
          Across all sports & endurance sessions
        </div>
      </div>

      {/* Total Moving Time */}
      <div className="stat-tile ride-tile glass-card">
        <div className="stat-header">
          <span className="stat-title">Time in Motion</span>
          <div className="stat-icon" style={{ color: 'var(--accent-ride)' }}>
            <Clock size={20} />
          </div>
        </div>
        <div className="stat-value">
          {overall.total_moving_time_hours.toLocaleString()}
          <span className="stat-unit">hrs</span>
        </div>
        <div className="stat-subtext">
          Active training hours logged
        </div>
      </div>

      {/* Total Elevation */}
      <div className="stat-tile elev-tile glass-card">
        <div className="stat-header">
          <span className="stat-title">Elevation Gained</span>
          <div className="stat-icon" style={{ color: 'var(--accent-other)' }}>
            <Mountain size={20} />
          </div>
        </div>
        <div className="stat-value">
          {overall.total_elevation_gain_m.toLocaleString()}
          <span className="stat-unit">m</span>
        </div>
        <div className="stat-subtext">
          Vertical climbing conquered
        </div>
      </div>
    </div>
  );
}
