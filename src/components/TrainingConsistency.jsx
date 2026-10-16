import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Sliders, 
  Activity, 
  Sun, 
  Moon, 
  Sunset, 
  Sunrise,
  X
} from 'lucide-react';

import { getConsistencyData, getGoals, saveGoals } from '../services/stravaDataService';

const LEVEL_COLORS = [
  'rgba(255, 255, 255, 0.04)', // Level 0: Rest
  'rgba(16, 185, 129, 0.28)',  // Level 1: < 5km
  'rgba(16, 185, 129, 0.55)',  // Level 2: 5 - 12km
  'rgba(16, 185, 129, 0.85)',  // Level 3: 12 - 25km
  '#10B981'                    // Level 4: > 25km (or multi-workout blaze)
];

export default function TrainingConsistency() {
  const [consistencyData, setConsistencyData] = useState(null);
  const [goalsData, setGoalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Goal customization modal
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalInputs, setGoalInputs] = useState({
    weekly_run_km: 30,
    weekly_ride_km: 100,
    weekly_workouts: 5,
    monthly_dist_km: 300
  });

  const loadData = () => {
    try {
      const consRes = getConsistencyData();
      const goalsRes = getGoals();
      setConsistencyData(consRes);
      setGoalsData(goalsRes);
      if (goalsRes?.goals) {
        setGoalInputs(goalsRes.goals);
      }
    } catch (err) {
      console.error('Error loading consistency data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoals = (e) => {
    e.preventDefault();
    try {
      const data = saveGoals(goalInputs);
      setGoalsData(data);
      setIsEditingGoals(false);
    } catch (err) {
      alert('Could not save goals.');
    }
  };

  // Group grid_365 into 53 columns (weeks)
  const weeksColumns = useMemo(() => {
    if (!consistencyData?.grid_365) return [];
    const weeks = [];
    let currentWeek = [];

    consistencyData.grid_365.forEach(day => {
      currentWeek.push(day);
      if (day.weekday === 6) { // Saturday ends the week column
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  }, [consistencyData]);

  // Compute month label positions
  const monthLabels = useMemo(() => {
    if (!weeksColumns.length) return [];
    const labels = [];
    let lastMonth = '';

    weeksColumns.forEach((week, wIdx) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({ month: firstDay.month, colIndex: wIdx });
        lastMonth = firstDay.month;
      }
    });
    return labels;
  }, [weeksColumns]);

  // Concentric SVG Apple Fitness Rings Geometry
  const rings = useMemo(() => {
    const weekly = goalsData?.weekly;
    if (!weekly) return null;

    const runPct = Math.min(100, weekly.running.percent) / 100;
    const ridePct = Math.min(100, weekly.cycling.percent) / 100;
    const workPct = Math.min(100, weekly.workouts.percent) / 100;

    const size = 200;
    const center = size / 2;

    const createRing = (radius, strokeWidth, pct) => {
      const circ = 2 * Math.PI * radius;
      const strokeDashoffset = circ * (1 - pct);
      return { radius, strokeWidth, circ, strokeDashoffset };
    };

    return {
      run: createRing(80, 14, runPct),
      ride: createRing(60, 14, ridePct),
      workouts: createRing(40, 14, workPct),
      center,
      size
    };
  }, [goalsData]);

  if (loading) {
    return (
      <div className="section-card glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <Activity size={32} className="spinning" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
        <span>Computing 365-day training consistency &amp; goal rings...</span>
      </div>
    );
  }

  const currentStreak = consistencyData?.current_streak_days || 0;
  const longestStreak = consistencyData?.longest_streak_days || 0;
  const activeDays = consistencyData?.active_days_past_year || consistencyData?.total_active_days || 0;
  const consistencyRate = consistencyData?.consistency_rate_pct || 0;
  const annualKm = consistencyData?.km_past_year || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Streaks & Consistency Highlights Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Current Streak */}
        <div className="glass-card" style={{
          padding: '20px',
          background: 'radial-gradient(circle at 10% 10%, rgba(252, 82, 0, 0.15), transparent 70%), var(--bg-card)',
          borderLeft: '4px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(252, 82, 0, 0.15)',
            border: '1px solid rgba(252, 82, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '24px'
          }}>
            🔥
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current Streak
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
                {currentStreak}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>active days</span>
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="glass-card" style={{
          padding: '20px',
          background: 'radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.15), transparent 70%), var(--bg-card)',
          borderLeft: '4px solid var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)',
            fontSize: '24px'
          }}>
            🏆
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Longest Streak
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
                {longestStreak}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>consecutive days</span>
            </div>
          </div>
        </div>

        {/* Consistency Rate */}
        <div className="glass-card" style={{
          padding: '20px',
          background: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.15), transparent 70%), var(--bg-card)',
          borderLeft: '4px solid var(--success)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            fontSize: '24px'
          }}>
            📅
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Consistency Rate
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
                {consistencyRate}%
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>({activeDays} / 365 days)</span>
            </div>
          </div>
        </div>

        {/* 365-Day Volume */}
        <div className="glass-card" style={{
          padding: '20px',
          background: 'radial-gradient(circle at 10% 10%, rgba(0, 229, 255, 0.15), transparent 70%), var(--bg-card)',
          borderLeft: '4px solid #00E5FF',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E5FF',
            fontSize: '24px'
          }}>
            ⚡
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Past 365 Days
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-display)' }}>
                {annualKm}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>km logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GitHub-Style 365-Day Activity Grid (Contribution Heatmap) */}
      <div className="section-card glass-card" style={{ position: 'relative' }}>
        <div className="section-title-wrap">
          <div>
            <h3 className="section-title">
              <span>📅 365-Day Training Activity Heatmap</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              52-week consistency matrix showing daily training volume, endurance habit streaks, and active rest days.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Less</span>
            {LEVEL_COLORS.map((col, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '3px', 
                  background: col,
                  border: idx === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }} 
              />
            ))}
            <span>More (25+ km)</span>
          </div>
        </div>

        {/* Matrix Container */}
        <div style={{ overflowX: 'auto', padding: '16px 0 8px 0' }}>
          <div style={{ minWidth: '820px' }}>
            {/* Month labels header */}
            <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {monthLabels.map((lbl, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    position: 'relative', 
                    left: `${lbl.colIndex * 15}px`, 
                    width: '0px', 
                    whiteSpace: 'nowrap',
                    fontWeight: 600
                  }}
                >
                  {lbl.month}
                </div>
              ))}
            </div>

            {/* Matrix Columns & Day Rows */}
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-start' }}>
              {/* Day of week labels on left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '28px', fontSize: '0.65rem', color: 'var(--text-dim)', paddingTop: '2px' }}>
                <span style={{ height: '12px' }}>Sun</span>
                <span style={{ height: '12px', opacity: 0 }}>Mon</span>
                <span style={{ height: '12px' }}>Tue</span>
                <span style={{ height: '12px', opacity: 0 }}>Wed</span>
                <span style={{ height: '12px' }}>Thu</span>
                <span style={{ height: '12px', opacity: 0 }}>Fri</span>
                <span style={{ height: '12px' }}>Sat</span>
              </div>

              {/* 53 Columns */}
              {weeksColumns.map((week, colIdx) => (
                <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {week.map(day => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => {
                        setHoveredDay(day);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: LEVEL_COLORS[day.level],
                        border: day.level === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Tooltip */}
        {hoveredDay && (
          <div style={{
            position: 'fixed',
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 12}px`,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 12px',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: '2px' }}>
              {new Date(hoveredDay.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {hoveredDay.count > 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>
                <span><strong>{hoveredDay.count} workout{hoveredDay.count > 1 ? 's' : ''}</strong>: </span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{hoveredDay.distance_km} km</span>
                {hoveredDay.moving_time_min > 0 && <span> ({hoveredDay.moving_time_min} min)</span>}
                {hoveredDay.sports.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {hoveredDay.sports.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>Rest day (No workouts logged)</span>
            )}
          </div>
        )}
      </div>

      {/* 3. Goal Rings & Patterns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Apple Fitness Style Goal Rings */}
        <div className="section-card glass-card">
          <div className="section-title-wrap">
            <div>
              <h4 className="section-title" style={{ fontSize: '1.1rem' }}>
                <span>🎯 Weekly Goal Rings</span>
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Current week progress (Monday – Sunday)
              </p>
            </div>

            <button
              onClick={() => setIsEditingGoals(true)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sliders size={14} />
              <span>Customize</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '14px' }}>
            {/* Concentric Rings SVG */}
            {rings && (
              <div style={{ position: 'relative', width: `${rings.size}px`, height: `${rings.size}px`, flexShrink: 0 }}>
                <svg width={rings.size} height={rings.size} style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track Rings */}
                  <circle cx={rings.center} cy={rings.center} r={rings.run.radius} stroke="rgba(252, 82, 0, 0.15)" strokeWidth={rings.run.strokeWidth} fill="none" />
                  <circle cx={rings.center} cy={rings.center} r={rings.ride.radius} stroke="rgba(0, 229, 255, 0.15)" strokeWidth={rings.ride.strokeWidth} fill="none" />
                  <circle cx={rings.center} cy={rings.center} r={rings.workouts.radius} stroke="rgba(16, 185, 129, 0.15)" strokeWidth={rings.workouts.strokeWidth} fill="none" />

                  {/* Active Progress Rings */}
                  <circle
                    cx={rings.center}
                    cy={rings.center}
                    r={rings.run.radius}
                    stroke="#FC5200"
                    strokeWidth={rings.run.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={rings.run.circ}
                    strokeDashoffset={rings.run.strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />

                  <circle
                    cx={rings.center}
                    cy={rings.center}
                    r={rings.ride.radius}
                    stroke="#00E5FF"
                    strokeWidth={rings.ride.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={rings.ride.circ}
                    strokeDashoffset={rings.ride.strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />

                  <circle
                    cx={rings.center}
                    cy={rings.center}
                    r={rings.workouts.radius}
                    stroke="#10B981"
                    strokeWidth={rings.workouts.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={rings.workouts.circ}
                    strokeDashoffset={rings.workouts.strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>

                {/* Center Trophy Icon */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  🎯
                </div>
              </div>
            )}

            {/* Goal Progress Legend Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minWidth: '180px' }}>
              {/* Running */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#FC5200', fontWeight: 600 }}>🏃 Running Goal</span>
                  <span style={{ color: 'white', fontWeight: 700 }}>
                    {goalsData?.weekly?.running.current_km} / {goalsData?.weekly?.running.target_km} km
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${goalsData?.weekly?.running.percent}%`, height: '100%', background: '#FC5200', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  {goalsData?.weekly?.running.remaining_km > 0 ? `${goalsData?.weekly?.running.remaining_km} km remaining this week` : '🎉 Goal completed!'}
                </span>
              </div>

              {/* Cycling */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#00E5FF', fontWeight: 600 }}>🚴 Cycling Goal</span>
                  <span style={{ color: 'white', fontWeight: 700 }}>
                    {goalsData?.weekly?.cycling.current_km} / {goalsData?.weekly?.cycling.target_km} km
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${goalsData?.weekly?.cycling.percent}%`, height: '100%', background: '#00E5FF', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  {goalsData?.weekly?.cycling.remaining_km > 0 ? `${goalsData?.weekly?.cycling.remaining_km} km remaining this week` : '🎉 Goal completed!'}
                </span>
              </div>

              {/* Workouts */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>✨ Active Frequency</span>
                  <span style={{ color: 'white', fontWeight: 700 }}>
                    {goalsData?.weekly?.workouts.current_count} / {goalsData?.weekly?.workouts.target_count} sessions
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${goalsData?.weekly?.workouts.percent}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time-of-Day & Day-of-Week Training Patterns */}
        <div className="section-card glass-card">
          <div className="section-title-wrap">
            <div>
              <h4 className="section-title" style={{ fontSize: '1.1rem' }}>
                <span>⏰ Training Habits &amp; Time Patterns</span>
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                When you lace up: morning vs evening and weekly warrior habits
              </p>
            </div>
          </div>

          {/* Time of Day Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {consistencyData?.time_of_day?.map((slot, idx) => {
              const maxCount = Math.max(...consistencyData.time_of_day.map(t => t.count), 1);
              const pct = (slot.count / maxCount) * 100;
              const icons = [
                <Sunrise key="1" size={15} style={{ color: '#F59E0B' }} />,
                <Sun key="2" size={15} style={{ color: '#FC5200' }} />,
                <Sunset key="3" size={15} style={{ color: '#A855F7' }} />,
                <Moon key="4" size={15} style={{ color: '#00E5FF' }} />
              ];

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      {icons[idx]}
                      <span>{slot.time_slot}</span>
                    </span>
                    <strong style={{ color: 'white' }}>{slot.count} workouts</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #FF7733)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day of Week Volume Summary */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Day of Week Volume (km)
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px' }}>
              {consistencyData?.day_of_week?.map((dow, idx) => {
                const maxKm = Math.max(...consistencyData.day_of_week.map(d => d.distance_km), 1);
                const hPct = Math.max(15, (dow.distance_km / maxKm) * 100);

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${hPct}%`,
                        background: 'rgba(0, 229, 255, 0.4)',
                        borderTop: '2px solid #00E5FF',
                        borderRadius: '3px 3px 0 0'
                      }}
                      title={`${dow.day_name}: ${dow.distance_km} km (${dow.count} workouts)`}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      {dow.day_name.slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Customize Goals Modal */}
      {isEditingGoals && (
        <div className="modal-backdrop" onClick={() => setIsEditingGoals(false)} style={{ zIndex: 1200 }}>
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '92%', maxWidth: '480px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} style={{ color: 'var(--primary)' }} />
                <span>Customize Training Goals</span>
              </h3>
              <button className="icon-btn close-btn" onClick={() => setIsEditingGoals(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Weekly Running Target (km)
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={goalInputs.weekly_run_km}
                  onChange={(e) => setGoalInputs({ ...goalInputs, weekly_run_km: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Weekly Cycling Target (km)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={goalInputs.weekly_ride_km}
                  onChange={(e) => setGoalInputs({ ...goalInputs, weekly_ride_km: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Weekly Active Workout Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={goalInputs.weekly_workouts}
                  onChange={(e) => setGoalInputs({ ...goalInputs, weekly_workouts: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}
                >
                  Save Goals
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGoals(false)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
