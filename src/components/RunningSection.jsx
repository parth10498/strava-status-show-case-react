import React, { useState } from 'react';
import { Award, Zap, Flame, Compass, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import MilestoneActivitiesModal from './MilestoneActivitiesModal';

export default function RunningSection({ running, onViewHeatmap, onSelectActivityForMap }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  if (!running) return null;

  const totalRuns = running.count || 0;
  const milestones = running.milestones || {};
  const brackets = running.brackets || [];

  return (
    <div className="running-hub">
      {/* Top running metrics bar */}
      <div className="hero-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-tile run-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Total Running Runs</span>
            <div className="stat-icon" style={{ color: 'var(--accent-run)' }}>🏃</div>
          </div>
          <div className="stat-value">{totalRuns}</div>
          <div className="stat-subtext">Total recorded runs in Strava</div>
        </div>

        <div className="stat-tile run-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Running Distance</span>
            <div className="stat-icon" style={{ color: 'var(--accent-run)' }}>📍</div>
          </div>
          <div className="stat-value">{running.total_distance_km} <span className="stat-unit">km</span></div>
          <div className="stat-subtext">Total distance covered on foot</div>
        </div>

        <div className="stat-tile run-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Longest Single Run</span>
            <div className="stat-icon" style={{ color: 'var(--accent-run)' }}>🏆</div>
          </div>
          <div className="stat-value">{running.longest_run_km} <span className="stat-unit">km</span></div>
          <div className="stat-subtext">Personal distance record</div>
        </div>

        <div className="stat-tile run-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Average Pace</span>
            <div className="stat-icon" style={{ color: 'var(--accent-run)' }}>⚡</div>
          </div>
          <div className="stat-value">{running.avg_pace}</div>
          <div className="stat-subtext">Across all runs</div>
        </div>
      </div>

      {/* Quick Heatmap Shortcut Banner */}
      {onViewHeatmap && (
        <div 
          onClick={onViewHeatmap}
          className="glass-card heatmap-shortcut-banner" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            marginBottom: '24px',
            background: 'linear-gradient(90deg, rgba(252, 82, 0, 0.15) 0%, rgba(255, 170, 0, 0.08) 100%)',
            border: '1px solid rgba(252, 82, 0, 0.35)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(252, 82, 0, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(252, 82, 0, 0.2)',
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
                  View All {totalRuns} Running Routes on Personal Heatmap
                </h4>
                <span className="badge-pill" style={{ background: 'var(--primary)', color: '#000', fontWeight: 800, fontSize: '0.7rem' }}>
                  146 GPS TRACKS
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                See every street and trail you've ever run overlaid together on a single glowing interactive Leaflet map.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Open Running Heatmap</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Cumulative Milestone Badges Grid (>=5k, >=10k, >=15k, >=21.1k, >=42.2k) */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <h3 className="section-title">
            <Award size={22} style={{ color: 'var(--accent-run)' }} />
            <span>Running Distance Milestones (Cumulative)</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total count of runs meeting or exceeding each benchmark
          </span>
        </div>

        <div className="milestones-grid">
          {/* >= 5km */}
          <div 
            className="milestone-card run-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 5 km Running Milestones',
              icon: '⚡',
              minDistanceM: 5000,
              description: `All ${milestones.gte_5k ?? 0} recorded runs of 5 km or longer`
            })}
            title="Click to view all runs of 5km or more"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-run)' }}>
              ⚡
            </div>
            <div className="milestone-target">&ge; 5 km</div>
            <div className="milestone-count">{milestones.gte_5k ?? 0}</div>
            <div className="milestone-desc">Runs of 5km or more</div>
            <div className="milestone-action-hint">View {milestones.gte_5k ?? 0} runs &rarr;</div>
          </div>

          {/* >= 10km */}
          <div 
            className="milestone-card run-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 10 km Benchmark Runs',
              icon: '🔥',
              minDistanceM: 10000,
              description: `All ${milestones.gte_10k ?? 0} recorded runs of 10 km or longer`
            })}
            title="Click to view all 10K benchmark runs"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent-run)' }}>
              🔥
            </div>
            <div className="milestone-target">&ge; 10 km</div>
            <div className="milestone-count">{milestones.gte_10k ?? 0}</div>
            <div className="milestone-desc">10K benchmark runs</div>
            <div className="milestone-action-hint">View {milestones.gte_10k ?? 0} runs &rarr;</div>
          </div>

          {/* >= 15km */}
          <div 
            className="milestone-card run-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 15 km Long Endurance Runs',
              icon: '🚀',
              minDistanceM: 15000,
              description: `All ${milestones.gte_15k ?? 0} long distance runs of 15 km or longer`
            })}
            title="Click to view all long endurance runs"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(0, 229, 255, 0.2)', color: 'var(--accent-run)' }}>
              🚀
            </div>
            <div className="milestone-target">&ge; 15 km</div>
            <div className="milestone-count">{milestones.gte_15k ?? 0}</div>
            <div className="milestone-desc">Long endurance runs</div>
            <div className="milestone-action-hint">View {milestones.gte_15k ?? 0} runs &rarr;</div>
          </div>

          {/* >= 21.1km Half Marathon */}
          <div 
            className="milestone-card run-card trophy glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 21.1 km Half Marathons Achieved',
              icon: '👑',
              minDistanceM: 21097.5,
              description: `All ${milestones.gte_21k ?? 0} official Half Marathon distance achievements (21.1 km+)`
            })}
            title="Click to view all Half Marathons"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700' }}>
              👑
            </div>
            <div className="milestone-target">&ge; 21.1 km</div>
            <div className="milestone-count" style={{ color: '#FFD700' }}>{milestones.gte_21k ?? 0}</div>
            <div className="milestone-desc">Half Marathons achieved</div>
            <div className="milestone-action-hint" style={{ color: '#FFD700' }}>View {milestones.gte_21k ?? 0} runs &rarr;</div>
          </div>

          {/* >= 42.2km Marathon */}
          <div 
            className="milestone-card run-card trophy glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 42.2 km Full Marathons Conquered',
              icon: '🎖️',
              minDistanceM: 42195,
              description: `Official Full Marathon distance achievements (42.2 km+)`
            })}
            title="Click to view all Full Marathons"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 77, 106, 0.15)', color: '#FF4D6A' }}>
              🎖️
            </div>
            <div className="milestone-target">&ge; 42.2 km</div>
            <div className="milestone-count" style={{ color: '#FF4D6A' }}>{milestones.gte_42k ?? 0}</div>
            <div className="milestone-desc">Full Marathons conquered</div>
            <div className="milestone-action-hint" style={{ color: '#FF4D6A' }}>View runs &rarr;</div>
          </div>
        </div>
      </div>

      {/* In-Between Distance Bracket Distribution */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <h3 className="section-title">
            <TrendingUp size={22} style={{ color: 'var(--accent-run)' }} />
            <span>Distance Range Breakdown ("In-Between")</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Categorized counts showing how runs are distributed across distances (Click any row to open list)
          </span>
        </div>

        <div className="brackets-list">
          {brackets.map((item, idx) => {
            const pct = totalRuns > 0 ? Math.round((item.count / totalRuns) * 100) : 0;
            
            // Map bracket index to distance bounds
            const getBracketBounds = (i) => {
              if (i === 0) return { maxDistanceM: 5000, icon: '⚡' };
              if (i === 1) return { minDistanceM: 5000, maxDistanceM: 10000, icon: '🏃' };
              if (i === 2) return { minDistanceM: 10000, maxDistanceM: 15000, icon: '🔥' };
              if (i === 3) return { minDistanceM: 15000, maxDistanceM: 21097.5, icon: '🚀' };
              return { minDistanceM: 21097.5, icon: '👑' };
            };

            const bounds = getBracketBounds(idx);

            return (
              <div 
                key={idx} 
                className="bracket-row clickable-bracket"
                onClick={() => setSelectedMilestone({
                  title: `${item.label} (${item.range}) Running Activities`,
                  icon: bounds.icon,
                  minDistanceM: bounds.minDistanceM,
                  maxDistanceM: bounds.maxDistanceM,
                  description: `${item.count} recorded runs within the ${item.range} distance range`
                })}
                title={`Click to view all ${item.count} runs in the ${item.range} bracket`}
                style={{ cursor: 'pointer' }}
              >
                <div className="bracket-meta">
                  <div className="bracket-name">
                    <span>{item.label}</span>
                    <span className="bracket-tag">{item.range}</span>
                    <span className="bracket-tag" style={{ color: 'var(--accent-run)' }}>{item.badge}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-run)', opacity: 0.8, fontWeight: 600 }}>&rarr; View list</span>
                  </div>
                  <div className="bracket-count-badge">
                    {item.count} {item.count === 1 ? 'run' : 'runs'} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({pct}%)</span>
                  </div>
                </div>
                <div className="bracket-bar-bg">
                  <div 
                    className="bracket-bar-fill run-fill" 
                    style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Activities List Modal */}
      {selectedMilestone && (
        <MilestoneActivitiesModal
          milestone={selectedMilestone}
          sport="run"
          onClose={() => setSelectedMilestone(null)}
          onSelectActivityForMap={onSelectActivityForMap}
        />
      )}
    </div>
  );
}
