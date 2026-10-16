import React, { useState } from 'react';
import { Award, Zap, Compass, TrendingUp, ShieldCheck } from 'lucide-react';
import MilestoneActivitiesModal from './MilestoneActivitiesModal';

export default function CyclingSection({ cycling, onViewHeatmap, onSelectActivityForMap }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  if (!cycling) return null;

  const totalRides = cycling.count || 0;
  const milestones = cycling.milestones || {};
  const brackets = cycling.brackets || [];

  return (
    <div className="cycling-hub">
      {/* Top cycling metrics bar */}
      <div className="hero-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-tile ride-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Total Cycling Rides</span>
            <div className="stat-icon" style={{ color: 'var(--accent-ride)' }}>🚴</div>
          </div>
          <div className="stat-value">{totalRides}</div>
          <div className="stat-subtext">Total recorded rides in Strava</div>
        </div>

        <div className="stat-tile ride-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Cycling Distance</span>
            <div className="stat-icon" style={{ color: 'var(--accent-ride)' }}>📍</div>
          </div>
          <div className="stat-value">{cycling.total_distance_km} <span className="stat-unit">km</span></div>
          <div className="stat-subtext">Total distance on the saddle</div>
        </div>

        <div className="stat-tile ride-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Longest Single Ride</span>
            <div className="stat-icon" style={{ color: 'var(--accent-ride)' }}>🏆</div>
          </div>
          <div className="stat-value">{cycling.longest_ride_km} <span className="stat-unit">km</span></div>
          <div className="stat-subtext">Maximum distance logged</div>
        </div>

        <div className="stat-tile ride-tile glass-card">
          <div className="stat-header">
            <span className="stat-title">Average Speed</span>
            <div className="stat-icon" style={{ color: 'var(--accent-ride)' }}>⚡</div>
          </div>
          <div className="stat-value">{cycling.avg_speed_kmh} <span className="stat-unit">km/h</span></div>
          <div className="stat-subtext">Overall average rolling speed</div>
        </div>
      </div>

      {/* Quick Heatmap Shortcut Banner */}
      {onViewHeatmap && (
        <div 
          onClick={onViewHeatmap}
          className="glass-card" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            marginBottom: '24px',
            background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 180, 216, 0.08) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 229, 255, 0.2)',
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
                  View All {totalRides} Cycling Routes on Personal Heatmap
                </h4>
                <span className="badge-pill" style={{ background: 'var(--accent-ride)', color: '#000', fontWeight: 800, fontSize: '0.7rem' }}>
                  91 GPS TRACKS
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Explore your long road rides, hill climbs, and gravel explorations together on an interactive heatmap.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'var(--accent-ride)', color: 'white' }}
          >
            <span>Open Cycling Heatmap</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Cumulative Milestone Badges Grid (20k, 30k, 40k, 50k, 100k, 160k, 200k+) */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <h3 className="section-title">
            <Award size={22} style={{ color: 'var(--accent-ride)' }} />
            <span>Cycling Milestones (Cumulative $\ge$ Targets)</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Rides qualifying for each major cycling distance tier
          </span>
        </div>

        <div className="milestones-grid">
          {/* >= 20km */}
          <div 
            className="milestone-card ride-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 20 km Cycling Milestones',
              icon: '🚴',
              minDistanceM: 20000,
              description: `All ${milestones.gte_20k ?? 0} recorded rides of 20 km or longer`
            })}
            title="Click to view all rides &ge; 20 km"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 179, 0, 0.1)', color: 'var(--accent-ride)' }}>
              🚴
            </div>
            <div className="milestone-target">&ge; 20 km</div>
            <div className="milestone-count">{milestones.gte_20k ?? 0}</div>
            <div className="milestone-desc">Rides &ge; 20 km</div>
            <div className="milestone-action-hint" style={{ color: 'var(--accent-ride)' }}>View {milestones.gte_20k ?? 0} rides &rarr;</div>
          </div>

          {/* >= 30km */}
          <div 
            className="milestone-card ride-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 30 km Cycling Benchmark',
              icon: '⚡',
              minDistanceM: 30000,
              description: `All ${milestones.gte_30k ?? 0} recorded rides of 30 km or longer`
            })}
            title="Click to view all rides &ge; 30 km"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 179, 0, 0.15)', color: 'var(--accent-ride)' }}>
              ⚡
            </div>
            <div className="milestone-target">&ge; 30 km</div>
            <div className="milestone-count">{milestones.gte_30k ?? 0}</div>
            <div className="milestone-desc">Rides &ge; 30 km</div>
            <div className="milestone-action-hint" style={{ color: 'var(--accent-ride)' }}>View {milestones.gte_30k ?? 0} rides &rarr;</div>
          </div>

          {/* >= 40km */}
          <div 
            className="milestone-card ride-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 40 km Cycling Benchmark',
              icon: '🔥',
              minDistanceM: 40000,
              description: `All ${milestones.gte_40k ?? 0} recorded rides of 40 km or longer`
            })}
            title="Click to view all rides &ge; 40 km"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 179, 0, 0.2)', color: 'var(--accent-ride)' }}>
              🔥
            </div>
            <div className="milestone-target">&ge; 40 km</div>
            <div className="milestone-count">{milestones.gte_40k ?? 0}</div>
            <div className="milestone-desc">Rides &ge; 40 km</div>
            <div className="milestone-action-hint" style={{ color: 'var(--accent-ride)' }}>View {milestones.gte_40k ?? 0} rides &rarr;</div>
          </div>

          {/* >= 50km Half Century */}
          <div 
            className="milestone-card ride-card glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 50 km Half Century Rides',
              icon: '🏅',
              minDistanceM: 50000,
              description: `All ${milestones.gte_50k ?? 0} Half Century rides (50 km+) achieved`
            })}
            title="Click to view all Half Century rides"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 179, 0, 0.25)', color: 'var(--accent-ride)' }}>
              🏅
            </div>
            <div className="milestone-target">&ge; 50 km</div>
            <div className="milestone-count">{milestones.gte_50k ?? 0}</div>
            <div className="milestone-desc">Half Century (50 km+)</div>
            <div className="milestone-action-hint" style={{ color: 'var(--accent-ride)' }}>View {milestones.gte_50k ?? 0} rides &rarr;</div>
          </div>

          {/* >= 100km Century */}
          <div 
            className="milestone-card ride-card trophy glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 100 km Metric Century Rides',
              icon: '🌟',
              minDistanceM: 100000,
              description: `All ${milestones.gte_100k ?? 0} Metric Century rides (100 km+) achieved`
            })}
            title="Click to view all Metric Century rides"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 215, 0, 0.2)', color: '#FFD700' }}>
              🌟
            </div>
            <div className="milestone-target">&ge; 100 km</div>
            <div className="milestone-count" style={{ color: '#FFD700' }}>{milestones.gte_100k ?? 0}</div>
            <div className="milestone-desc">Metric Century (100 km+)</div>
            <div className="milestone-action-hint" style={{ color: '#FFD700' }}>View {milestones.gte_100k ?? 0} rides &rarr;</div>
          </div>

          {/* >= 160km (100 Miles) */}
          <div 
            className="milestone-card ride-card trophy glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 160 km 100 Miles Century Rides',
              icon: '👑',
              minDistanceM: 160000,
              description: `Official 100 Miles Century achievements (160 km+)`
            })}
            title="Click to view all 100 Miles Century rides"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(255, 120, 50, 0.2)', color: '#FF7832' }}>
              👑
            </div>
            <div className="milestone-target">&ge; 160 km</div>
            <div className="milestone-count" style={{ color: '#FF7832' }}>{milestones.gte_160k ?? 0}</div>
            <div className="milestone-desc">100 Miles Century</div>
            <div className="milestone-action-hint" style={{ color: '#FF7832' }}>View rides &rarr;</div>
          </div>

          {/* >= 200km Brevet */}
          <div 
            className="milestone-card ride-card trophy glass-card clickable-milestone"
            onClick={() => setSelectedMilestone({
              title: '≥ 200 km Double Metric Brevet Rides',
              icon: '🎖️',
              minDistanceM: 200000,
              description: `Double Metric / Ultra Brevet rides (200 km+)`
            })}
            title="Click to view all Brevet rides"
          >
            <div className="milestone-badge-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
              🎖️
            </div>
            <div className="milestone-target">&ge; 200 km</div>
            <div className="milestone-count" style={{ color: '#EF4444' }}>{milestones.gte_200k ?? 0}</div>
            <div className="milestone-desc">Double Metric / Brevet</div>
            <div className="milestone-action-hint" style={{ color: '#EF4444' }}>View rides &rarr;</div>
          </div>
        </div>
      </div>

      {/* Distance Ladder: 20km, 30km, 40km, 50km to up 200km */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <h3 className="section-title">
            <TrendingUp size={22} style={{ color: 'var(--accent-ride)' }} />
            <span>Cycling Distance Ladder (20km to 200km+)</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Breakdown across individual distance ranges (Click any row to open list)
          </span>
        </div>

        <div className="brackets-list">
          {brackets.map((item, idx) => {
            const pct = totalRides > 0 ? Math.round((item.count / totalRides) * 100) : 0;
            
            // Map bracket index to distance bounds
            const getCyclingBracketBounds = (i) => {
              if (i === 0) return { maxDistanceM: 20000, icon: '🚴' };
              if (i === 1) return { minDistanceM: 20000, maxDistanceM: 30000, icon: '⚡' };
              if (i === 2) return { minDistanceM: 30000, maxDistanceM: 40000, icon: '🔥' };
              if (i === 3) return { minDistanceM: 40000, maxDistanceM: 50000, icon: '🏅' };
              if (i === 4) return { minDistanceM: 50000, maxDistanceM: 75000, icon: '🌟' };
              if (i === 5) return { minDistanceM: 75000, maxDistanceM: 100000, icon: '🚀' };
              if (i === 6) return { minDistanceM: 100000, maxDistanceM: 160000, icon: '👑' };
              if (i === 7) return { minDistanceM: 160000, maxDistanceM: 200000, icon: '🏆' };
              return { minDistanceM: 200000, icon: '🎖️' };
            };

            const bounds = getCyclingBracketBounds(idx);

            return (
              <div 
                key={idx} 
                className="bracket-row clickable-bracket"
                onClick={() => setSelectedMilestone({
                  title: `${item.label} (${item.range}) Cycling Rides`,
                  icon: bounds.icon,
                  minDistanceM: bounds.minDistanceM,
                  maxDistanceM: bounds.maxDistanceM,
                  description: `${item.count} recorded rides within the ${item.range} distance range`
                })}
                title={`Click to view all ${item.count} rides in the ${item.range} bracket`}
                style={{ cursor: 'pointer' }}
              >
                <div className="bracket-meta">
                  <div className="bracket-name">
                    <span>{item.label}</span>
                    <span className="bracket-tag">{item.range}</span>
                    <span className="bracket-tag" style={{ color: 'var(--accent-ride)' }}>{item.badge}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-ride)', opacity: 0.8, fontWeight: 600 }}>&rarr; View list</span>
                  </div>
                  <div className="bracket-count-badge">
                    {item.count} {item.count === 1 ? 'ride' : 'rides'} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({pct}%)</span>
                  </div>
                </div>
                <div className="bracket-bar-bg">
                  <div 
                    className="bracket-bar-fill ride-fill" 
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
          sport="ride"
          onClose={() => setSelectedMilestone(null)}
          onSelectActivityForMap={onSelectActivityForMap}
        />
      )}
    </div>
  );
}
