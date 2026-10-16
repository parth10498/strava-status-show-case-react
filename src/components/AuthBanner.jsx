import React from 'react';
import { Zap, Play } from 'lucide-react';

export default function AuthBanner({ isAuth, onConnect, onSeedDemo, totalActivities }) {
  if (totalActivities > 0) return null;

  return (
    <div className="auth-banner glass-card">
      <div className="banner-content">
        <h2>🚀 Welcome to Your Strava Analytics Dashboard</h2>
        <p>
          Running 100% on React in your browser. Explore your athletic milestones or load sample demo data to explore right away!
        </p>
      </div>

      <div className="banner-actions">
        <button className="btn btn-primary" onClick={onConnect}>
          <Zap size={18} />
          <span>Connect Strava</span>
        </button>
        <button className="btn btn-secondary" onClick={onSeedDemo}>
          <Play size={16} />
          <span>Load Milestone Demo</span>
        </button>
      </div>
    </div>
  );
}
