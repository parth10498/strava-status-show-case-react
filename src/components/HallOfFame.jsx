import React, { useState, useEffect } from 'react';
import { Trophy, ExternalLink, Award, Sparkles } from 'lucide-react';
import { formatDuration } from '../utils/polyline';
import TrophyBadgesCabinet from './TrophyBadgesCabinet';
import { getPersonalRecords } from '../services/stravaDataService';

export default function HallOfFame({ onSelectActivityForMap }) {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('badges'); // 'badges' | 'records' | 'eddington'

  useEffect(() => {
    try {
      const data = getPersonalRecords();
      setRecords(data);
    } catch (err) {
      console.error('Error fetching PRs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="section-card glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <Trophy size={36} className="spinning" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
        <span>Evaluating athlete Hall of Fame &amp; Eddington numbers...</span>
      </div>
    );
  }

  if (!records) return null;

  const trophies = [
    {
      id: '5k',
      title: 'Fastest 5K Run',
      badge: '⚡',
      accent: '#FC5200',
      data: records.fastest_5k,
      primaryMetric: records.fastest_5k?.pace,
      primaryLabel: 'Average Pace',
      secondaryMetric: records.fastest_5k ? formatDuration(records.fastest_5k.moving_time) : '--:--',
      secondaryLabel: 'Finish Time'
    },
    {
      id: '10k',
      title: 'Fastest 10K Run',
      badge: '⚡',
      accent: '#FF7733',
      data: records.fastest_10k,
      primaryMetric: records.fastest_10k?.pace,
      primaryLabel: 'Average Pace',
      secondaryMetric: records.fastest_10k ? formatDuration(records.fastest_10k.moving_time) : '--:--',
      secondaryLabel: 'Finish Time'
    },
    {
      id: 'half',
      title: 'Fastest Half Marathon (21.1K)',
      badge: '🏅',
      accent: '#10B981',
      data: records.fastest_half_marathon,
      primaryMetric: records.fastest_half_marathon?.pace,
      primaryLabel: 'Average Pace',
      secondaryMetric: records.fastest_half_marathon ? formatDuration(records.fastest_half_marathon.moving_time) : '--:--',
      secondaryLabel: 'Finish Time'
    },
    {
      id: 'longest_run',
      title: 'Longest Run Milestone',
      badge: '👑',
      accent: '#00E5FF',
      data: records.longest_run,
      primaryMetric: records.longest_run ? `${records.longest_run.distance_km} km` : '--',
      primaryLabel: 'Max Distance',
      secondaryMetric: records.longest_run ? formatDuration(records.longest_run.moving_time) : '--:--',
      secondaryLabel: 'Moving Time'
    },
    {
      id: 'longest_ride',
      title: 'Longest Century / Brevet',
      badge: '🚴',
      accent: '#FFB300',
      data: records.longest_ride,
      primaryMetric: records.longest_ride ? `${records.longest_ride.distance_km} km` : '--',
      primaryLabel: 'Max Distance',
      secondaryMetric: records.longest_ride ? formatDuration(records.longest_ride.moving_time) : '--:--',
      secondaryLabel: 'Moving Time'
    },
    {
      id: 'elevation',
      title: 'King of the Mountains',
      badge: '⛰️',
      accent: '#A855F7',
      data: records.max_elevation,
      primaryMetric: records.max_elevation ? `+${records.max_elevation.elevation_m}m` : '--',
      primaryLabel: 'Single-Day Climb',
      secondaryMetric: records.max_elevation ? `${records.max_elevation.distance_km} km` : '--',
      secondaryLabel: 'Workout Distance'
    },
    {
      id: 'max_speed',
      title: 'Max Speed Demon',
      badge: '🚀',
      accent: '#EC4899',
      data: records.max_speed_ride,
      primaryMetric: records.max_speed_ride ? `${records.max_speed_ride.max_speed_kmh} km/h` : '--',
      primaryLabel: 'Top Speed',
      secondaryMetric: records.max_speed_ride ? `${records.max_speed_ride.avg_speed_kmh} km/h` : '--',
      secondaryLabel: 'Avg Speed'
    }
  ];

  const eddingtonCycling = records.eddington?.cycling || { number: 0, next_target: 1, current_completed: 0, needed: 1 };
  const eddingtonRunning = records.eddington?.running || { number: 0, next_target: 1, current_completed: 0, needed: 1 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-Navigation Switcher */}
      <div className="section-card glass-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏆</span>
              <span>Hall of Fame &amp; Achievements Showcase</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Explore gamified trophy milestones, all-time endurance PRs, and mathematical Eddington numbers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSubTab('badges')}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeSubTab === 'badges' ? 'linear-gradient(135deg, #FC5200, #f59e0b)' : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: activeSubTab === 'badges' ? '1px solid #FC5200' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'badges' ? '0 0 16px rgba(252, 82, 0, 0.35)' : 'none'
              }}
            >
              <span>🎖️</span>
              <span>Trophy Badges</span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '8px' }}>25</span>
            </button>

            <button
              onClick={() => setActiveSubTab('records')}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeSubTab === 'records' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: activeSubTab === 'records' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'records' ? '0 0 16px rgba(252, 82, 0, 0.35)' : 'none'
              }}
            >
              <span>⚡</span>
              <span>Personal Records</span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '8px' }}>7</span>
            </button>

            <button
              onClick={() => setActiveSubTab('eddington')}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeSubTab === 'eddington' ? 'linear-gradient(135deg, #00E5FF, #0284c7)' : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: activeSubTab === 'eddington' ? '1px solid #00E5FF' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'eddington' ? '0 0 16px rgba(0, 229, 255, 0.35)' : 'none'
              }}
            >
              <span>🔢</span>
              <span>Eddington Index</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Trophy & Achievement Badges Cabinet */}
      {activeSubTab === 'badges' && (
        <TrophyBadgesCabinet onSelectActivityForMap={onSelectActivityForMap} />
      )}

      {/* VIEW 2: Personal Records (PR) */}
      {activeSubTab === 'records' && (
        <div className="section-card glass-card">
          <div className="section-title-wrap">
            <div>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <span>All-Time Personal Records (PR)</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Peak lifetime speed, distance, and elevation milestones tracked across running and cycling workouts.
              </p>
            </div>
          </div>

          {/* Trophies Grid */}
          <div className="pr-trophies-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginTop: '16px'
          }}>
            {trophies.map(trophy => {
              const hasData = Boolean(trophy.data);
              const dateStr = trophy.data?.start_date ? new Date(trophy.data.start_date).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
              }) : 'No record logged yet';

              return (
                <div
                  key={trophy.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: hasData ? `${trophy.accent}40` : 'var(--border-subtle)',
                    background: hasData 
                      ? `radial-gradient(circle at 90% 10%, ${trophy.accent}14, transparent 60%), var(--bg-card)`
                      : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div>
                    {/* Badge & Title Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{trophy.badge}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 700 }}>
                            {trophy.title}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      {hasData && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: `${trophy.accent}26`,
                          color: trophy.accent,
                          border: `1px solid ${trophy.accent}`
                        }}>
                          ALL-TIME PR
                        </span>
                      )}
                    </div>

                    {/* Activity Name */}
                    {hasData ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 500 }}>
                        "{trophy.data.name}"
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '14px', fontStyle: 'italic' }}>
                        Log a workout meeting this distance to claim this trophy!
                      </div>
                    )}

                    {/* Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                          {trophy.primaryLabel}
                        </span>
                        <strong style={{ fontSize: '1.25rem', color: trophy.accent, fontFamily: 'var(--font-display)' }}>
                          {trophy.primaryMetric || '--'}
                        </strong>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                          {trophy.secondaryLabel}
                        </span>
                        <strong style={{ fontSize: '1.25rem', color: 'white', fontFamily: 'var(--font-display)' }}>
                          {trophy.secondaryMetric || '--'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Inspect Action */}
                  {hasData && trophy.data.id && (
                    <button
                      onClick={() => {
                        if (onSelectActivityForMap) {
                          onSelectActivityForMap(trophy.data);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${trophy.accent}55`,
                        background: `${trophy.accent}18`,
                        color: trophy.accent,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>View Activity Map &amp; Elevation</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Eddington Number Section */}
      {activeSubTab === 'eddington' && (
        <div className="section-card glass-card">
          <div className="section-title-wrap">
            <div>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔢</span>
                <span>The Eddington Number (Endurance Index)</span>
              </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Named after the famous astrophysicist Arthur Eddington: an Eddington number of <strong>E = 31</strong> means you have completed at least <strong>31 km on 31 separate days</strong>.
            </p>
          </div>
        </div>

        <div className="eddington-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          {/* Cycling Eddington Card */}
          <div className="glass-card" style={{
            padding: '24px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            background: 'radial-gradient(circle at 10% 10%, rgba(0, 229, 255, 0.12), transparent 70%), var(--bg-card)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem' }}>🚴</span>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Cycling Eddington</h4>
              </div>
              <span className="badge-pill" style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF' }}>
                E_bike = {eddingtonCycling.number}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, color: '#00E5FF', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {eddingtonCycling.number}
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                days of &ge; {eddingtonCycling.number} km
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              You have completed at least {eddingtonCycling.number} km on {eddingtonCycling.number} separate ride days.
            </p>

            {/* Next Milestone Box */}
            <div style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00E5FF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Next Milestone: E = {eddingtonCycling.next_target}
              </span>
              <div style={{ fontSize: '0.85rem', color: 'white' }}>
                You have {eddingtonCycling.current_completed} rides of &ge; {eddingtonCycling.next_target} km. 
                <strong style={{ color: '#00E5FF' }}> Only {eddingtonCycling.needed} more ride{eddingtonCycling.needed > 1 ? 's' : ''}</strong> of {eddingtonCycling.next_target}+ km needed to reach E = {eddingtonCycling.next_target}!
              </div>
            </div>
          </div>

          {/* Running Eddington Card */}
          <div className="glass-card" style={{
            padding: '24px',
            border: '1px solid rgba(252, 82, 0, 0.3)',
            background: 'radial-gradient(circle at 10% 10%, rgba(252, 82, 0, 0.12), transparent 70%), var(--bg-card)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem' }}>🏃</span>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Running Eddington</h4>
              </div>
              <span className="badge-pill" style={{ background: 'rgba(252, 82, 0, 0.2)', color: 'var(--primary)' }}>
                E_run = {eddingtonRunning.number}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {eddingtonRunning.number}
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                days of &ge; {eddingtonRunning.number} km
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              You have completed at least {eddingtonRunning.number} km on {eddingtonRunning.number} separate running days.
            </p>

            {/* Next Milestone Box */}
            <div style={{
              background: 'rgba(252, 82, 0, 0.08)',
              border: '1px solid rgba(252, 82, 0, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Next Milestone: E = {eddingtonRunning.next_target}
              </span>
              <div style={{ fontSize: '0.85rem', color: 'white' }}>
                You have {eddingtonRunning.current_completed} runs of &ge; {eddingtonRunning.next_target} km. 
                <strong style={{ color: 'var(--primary)' }}> Only {eddingtonRunning.needed} more run{eddingtonRunning.needed > 1 ? 's' : ''}</strong> of {eddingtonRunning.next_target}+ km needed to reach E = {eddingtonRunning.next_target}!
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
