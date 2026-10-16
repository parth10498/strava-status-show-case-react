import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Mountain, 
  Compass, 
  ArrowUpRight, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

export default function YearlyMonthlySection({ 
  yearlyBreakdown = [], 
  monthlyBreakdown = {}, 
  availableYears = [],
  onSelectYear,
  onSelectMonth
}) {
  const targetYear = monthlyBreakdown?.year || (availableYears[0] || 2026);
  const monthsData = monthlyBreakdown?.months || [];

  // Find max distance across months for the progress bar scaling
  const maxMonthDist = Math.max(...monthsData.map(m => m.distance_km || 0), 1);
  const totalYearDist = monthsData.reduce((acc, m) => acc + (m.distance_km || 0), 0);
  const totalYearActivities = monthsData.reduce((acc, m) => acc + (m.total_activities || 0), 0);
  
  // Find highest mileage month
  const peakMonth = [...monthsData].sort((a, b) => (b.distance_km || 0) - (a.distance_km || 0))[0];

  return (
    <div className="section-card glass-card">
      {/* Header */}
      <div className="section-title-wrap">
        <h3 className="section-title">
          <span>📊 Year-Wise &amp; Month-Wise Performance Breakdown</span>
        </h3>
        <span className="section-badge" style={{ background: 'rgba(252, 82, 0, 0.15)', color: 'var(--primary)' }}>
          Historical Analytics
        </span>
      </div>

      {/* Part 1: Monthly Breakdown Visualizer */}
      <div className="monthly-analytics-block">
        <div className="monthly-block-header">
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
              🗓️ Monthly Activity Distribution ({targetYear})
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Monthly workout volume, distances, and running vs cycling split for {targetYear}.
            </p>
          </div>

          {/* Year selector buttons */}
          {availableYears.length > 1 && (
            <div className="year-pills-row">
              {availableYears.map(yr => (
                <button
                  key={yr}
                  className={`year-pill-btn ${yr === targetYear ? 'active' : ''}`}
                  onClick={() => onSelectYear(yr)}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Insights Banner */}
        <div className="month-insights-grid">
          <div className="month-insight-tile">
            <span className="insight-label">Annual Distance</span>
            <span className="insight-val">{totalYearDist.toFixed(1)} km</span>
            <span className="insight-sub">{targetYear} total</span>
          </div>

          <div className="month-insight-tile">
            <span className="insight-label">Workouts Logged</span>
            <span className="insight-val">{totalYearActivities}</span>
            <span className="insight-sub">Active sessions</span>
          </div>

          {peakMonth && peakMonth.distance_km > 0 && (
            <div className="month-insight-tile highlight-tile">
              <span className="insight-label">🏆 Peak Mileage Month</span>
              <span className="insight-val">{peakMonth.month_name} ({peakMonth.distance_km} km)</span>
              <span className="insight-sub">{peakMonth.total_activities} activities</span>
            </div>
          )}
        </div>

        {/* 12-Month Grid */}
        <div className="months-grid">
          {monthsData.map((m) => {
            const hasData = m.total_activities > 0;
            const percentage = maxMonthDist > 0 ? Math.min(100, Math.round((m.distance_km / maxMonthDist) * 100)) : 0;
            const monthCodeInt = parseInt(m.month_code, 10);

            return (
              <div 
                key={m.month_code} 
                className={`month-card glass-card ${hasData ? 'has-data' : 'empty-month'}`}
                onClick={() => hasData && onSelectMonth(targetYear, monthCodeInt)}
                title={hasData ? `Click to filter dashboard to ${m.month_name} ${targetYear}` : 'No workouts logged'}
              >
                <div className="month-card-top">
                  <span className="month-name">{m.month_name}</span>
                  <span className="month-count-badge">
                    {m.total_activities} {m.total_activities === 1 ? 'act' : 'acts'}
                  </span>
                </div>

                <div className="month-dist-number">
                  {m.distance_km > 0 ? (
                    <>
                      <strong>{m.distance_km}</strong> <span className="dist-unit">km</span>
                    </>
                  ) : (
                    <span className="dist-empty">0 km</span>
                  )}
                </div>

                {/* Progress volume bar */}
                <div className="month-progress-track">
                  <div 
                    className="month-progress-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Runs vs Rides subtext */}
                <div className="month-sports-split">
                  <span style={{ color: 'var(--accent-run)' }}>🏃 {m.run_count}</span>
                  <span style={{ color: 'var(--accent-ride)' }}>🚴 {m.ride_count}</span>
                  {m.time_hours > 0 && (
                    <span style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>⏱️ {m.time_hours}h</span>
                  )}
                </div>

                {hasData && (
                  <div className="month-drilldown-hint">
                    <span>Filter to month</span>
                    <ChevronRight size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: Year-by-Year Historical Comparison */}
      <div className="yearly-analytics-block" style={{ marginTop: '35px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>
          📈 Year-Over-Year Performance Comparison
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 18px 0' }}>
          Compare workout counts, total distance, climbing elevation, and endurance records across every year.
        </p>

        {yearlyBreakdown.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No yearly history records found.
          </div>
        ) : (
          <div className="yearly-table-wrapper">
            <table className="yearly-comparison-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Total Workouts</th>
                  <th>Runs (Count / Km)</th>
                  <th>Rides (Count / Km)</th>
                  <th>Total Distance</th>
                  <th>Time in Motion</th>
                  <th>Elevation Gained</th>
                  <th>Longest Run</th>
                  <th>Longest Ride</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {yearlyBreakdown.map((row) => (
                  <tr key={row.year} className={row.year === targetYear ? 'active-year-row' : ''}>
                    <td className="yr-col">
                      <span className="year-badge">{row.year}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{row.total_activities}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-run)', fontWeight: 600 }}>
                        🏃 {row.run_count} runs
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-ride)', fontWeight: 600 }}>
                        🚴 {row.ride_count} rides
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {row.total_distance_km.toLocaleString()} km
                      </strong>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {row.total_time_hours.toLocaleString()} hrs
                    </td>
                    <td style={{ color: 'var(--accent-other)' }}>
                      +{row.total_elevation_m.toLocaleString()} m
                    </td>
                    <td>
                      {row.max_run_km > 0 ? (
                        <span className="longest-badge run-longest">
                          🏃 {row.max_run_km} km
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td>
                      {row.max_ride_km > 0 ? (
                        <span className="longest-badge ride-longest">
                          🚴 {row.max_ride_km} km
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary filter-yr-btn"
                        onClick={() => onSelectYear(row.year)}
                        title={`Filter dashboard to ${row.year}`}
                      >
                        <span>Filter</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
