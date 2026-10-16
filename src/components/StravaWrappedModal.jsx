import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Globe, 
  Sparkles
} from 'lucide-react';

import { getWrappedSummary } from '../services/stravaDataService';
import { trackVisitorAction } from '../services/visitorTrackingService';

export default function StravaWrappedModal({ year = 2026, athlete, onClose }) {
  const [wrappedData, setWrappedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const confettiCanvasRef = useRef(null);
  const timerRef = useRef(null);

  const totalSlides = 5;

  const parsedYear = parseInt(year, 10);
  const requestedYear = (year === 'all' || year === 'All') ? 'All-Time' : (!isNaN(parsedYear) ? parsedYear : 2026);

  useEffect(() => {
    try {
      trackVisitorAction('season_wrapped', { year: requestedYear });
      const data = getWrappedSummary(requestedYear);
      setWrappedData(data);
    } catch (err) {
      console.error('Error fetching wrapped:', err);
    } finally {
      setLoading(false);
    }
  }, [requestedYear]);

  // Confetti Particle Explosion
  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FC5200', '#00F0FF', '#10B981', '#FFB300', '#A855F7', '#FFFFFF'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 14 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8
      });
    }

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  // Slide Auto-Advance Timer (6 seconds)
  useEffect(() => {
    if (isPaused || loading) return;

    timerRef.current = setInterval(() => {
      setActiveSlide(curr => (curr + 1) % totalSlides);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [isPaused, loading]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveSlide(s => (s + 1) % totalSlides);
      if (e.key === 'ArrowLeft') setActiveSlide(s => (s - 1 + totalSlides) % totalSlides);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displayYear = wrappedData?.year || requestedYear;

  if (loading) {
    return (
      <div className="modal-backdrop" style={{ zIndex: 1300 }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <Sparkles size={40} className="spinning" style={{ color: 'var(--primary)', margin: '0 auto 14px' }} />
          <h3>Assembling your {displayYear} Strava Wrapped...</h3>
        </div>
      </div>
    );
  }

  const athleteName = athlete ? `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() : 'Athlete';
  const totalKm = Number(wrappedData?.total_distance_km) || 0;
  const totalHours = Number(wrappedData?.total_hours) || 0;
  const totalElev = Number(wrappedData?.total_elevation_m) || 0;
  const activeDays = Number(wrappedData?.active_days) || 0;
  const totalActs = Number(wrappedData?.total_activities) || 0;
  const runsCount = Number(wrappedData?.runs_count) || 0;
  const ridesCount = Number(wrappedData?.rides_count) || 0;
  const fun = wrappedData?.fun_comparisons || {};
  const earthOrbit = Number(fun.earth_orbit_percent) || 0;
  const everestClimbs = Number(fun.everest_climbs) || 0;
  const marathonsEquiv = Number(fun.marathons_equivalent) || 0;
  const longestKm = Number(wrappedData?.longest_workout?.distance_km) || 0;
  const topMonthDistKm = Number(wrappedData?.top_month?.distance_km) || 0;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1300, background: 'rgba(3, 7, 18, 0.94)' }}>
      {/* Background Confetti Canvas */}
      <canvas 
        ref={confettiCanvasRef} 
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} 
      />

      {/* Main Wrapped Phone/Card Container */}
      <div 
        className="glass-card wrapped-phone-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%',
          maxWidth: '520px',
          height: '760px',
          maxHeight: '94vh',
          borderRadius: '32px',
          border: '2px solid rgba(252, 82, 0, 0.4)',
          boxShadow: '0 0 50px rgba(252, 82, 0, 0.25), 0 30px 80px rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10,
          background: 'linear-gradient(160deg, #111827 0%, #030712 100%)'
        }}
      >
        {/* Story Progress Indicators Strip */}
        <div className="wrapped-progress-strip" style={{
          display: 'flex',
          gap: '6px',
          padding: '16px 20px 8px 20px',
          zIndex: 20
        }}>
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => setActiveSlide(idx)}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: idx === activeSlide 
                  ? 'var(--primary)' 
                  : idx < activeSlide 
                    ? 'white' 
                    : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>

        {/* Top Header */}
        <div className="wrapped-story-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 20px',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎁</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.5px', color: 'white' }}>
              STRAVA WRAPPED • {displayYear}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="icon-btn" 
              onClick={() => setIsPaused(!isPaused)}
              style={{ padding: '6px' }}
              title={isPaused ? 'Resume autoplay' : 'Pause'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button className="icon-btn close-btn" onClick={onClose} style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Slide Viewport */}
        <div className="wrapped-slide-viewport" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '30px',
          position: 'relative',
          overflowY: 'auto',
          zIndex: 15
        }}>
          {/* SLIDE 0: Annual Intro */}
          {activeSlide === 0 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <span className="badge-pill" style={{ background: 'rgba(252, 82, 0, 0.2)', color: 'var(--primary)', marginBottom: '16px' }}>
                🎉 {athleteName}'s Season
              </span>
              <h2 className="wrapped-slide-title" style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 12px 0', color: 'white', lineHeight: 1.1 }}>
                A Year of Pure Motion
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '360px', margin: '0 auto 28px' }}>
                You showed up, pushed through sunrise miles, and built unbreakable endurance.
              </p>

              <div className="wrapped-stat-card" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '360px',
                margin: '0 auto'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Distance Moved</span>
                <div className="wrapped-hero-number" style={{ fontSize: '3.4rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-display)', lineHeight: 1, margin: '8px 0' }}>
                  {totalKm} <span style={{ fontSize: '1.4rem' }}>km</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                  <span>⏱️ <strong>{totalHours}</strong> hrs</span>
                  <span>•</span>
                  <span>🔥 <strong>{totalActs}</strong> workouts</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Real-World Geographic Scale */}
          {activeSlide === 1 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🌍</div>
              <span className="badge-pill" style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF', marginBottom: '16px' }}>
                Real-World Scale
              </span>
              <h2 className="wrapped-slide-title" style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 12px 0', color: 'white', lineHeight: 1.2 }}>
                Across the Subcontinent
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                Your total <strong>{totalKm} km</strong> is {fun.geo_landmark || `equivalent to traveling across the globe!`}
              </p>

              <div className="wrapped-stat-card" style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '20px',
                padding: '20px 24px',
                maxWidth: '380px',
                margin: '0 auto',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Globe size={22} style={{ color: '#00E5FF' }} />
                  <strong style={{ color: 'white', fontSize: '1rem' }}>Global Footprint</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  You circled <strong>{earthOrbit}% of Earth's circumference</strong> (40,075 km) purely on muscle power!
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: Elevation & Mountains */}
          {activeSlide === 2 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>⛰️</div>
              <span className="badge-pill" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#A855F7', marginBottom: '16px' }}>
                Elevation King
              </span>
              <h2 className="wrapped-slide-title" style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 12px 0', color: 'white', lineHeight: 1.2 }}>
                Touching the Clouds
              </h2>
              <div className="wrapped-hero-number" style={{ fontSize: '3.2rem', fontWeight: 900, color: '#A855F7', fontFamily: 'var(--font-display)', margin: '12px 0' }}>
                +{totalElev} <span style={{ fontSize: '1.4rem' }}>m</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '360px', margin: '0 auto 24px' }}>
                That's equivalent to climbing <strong>Mount Everest ({everestClimbs} times)</strong> from sea level to summit (8,848m)!
              </p>
            </div>
          )}

          {/* SLIDE 3: Sport Split & Busiest Month */}
          {activeSlide === 3 && (
            <div style={{ animation: 'fadeIn 0.35s ease', width: '100%' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📊</div>
              <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', marginBottom: '16px' }}>
                Training Breakdown
              </span>
              <h2 className="wrapped-slide-title" style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 20px 0', color: 'white' }}>
                Multisport Mastery
              </h2>

              <div className="wrapped-split-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                maxWidth: '380px',
                margin: '0 auto 18px auto'
              }}>
                <div style={{ background: 'rgba(252, 82, 0, 0.1)', border: '1px solid rgba(252, 82, 0, 0.3)', borderRadius: '14px', padding: '16px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏃</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FC5200', marginTop: '6px' }}>
                    {runsCount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Running Sessions</span>
                </div>

                <div style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '14px', padding: '16px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🚴</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00E5FF', marginTop: '6px' }}>
                    {ridesCount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cycling Sessions</span>
                </div>
              </div>

              {wrappedData?.top_month && (
                <div className="wrapped-stat-card" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '14px 20px',
                  maxWidth: '380px',
                  margin: '0 auto'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Peak Training Month</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginTop: '2px' }}>
                    👑 {wrappedData.top_month.name} ({topMonthDistKm} km)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SLIDE 4: Grand Crown & Milestones */}
          {activeSlide === 4 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>👑</div>
              <span className="badge-pill" style={{ background: 'rgba(255, 179, 0, 0.2)', color: '#FFB300', marginBottom: '16px' }}>
                Endurance Champion
              </span>
              <h2 className="wrapped-slide-title" style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 16px 0', color: 'white' }}>
                Keep Inspiring
              </h2>

              <div className="wrapped-stat-card" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '20px',
                maxWidth: '380px',
                margin: '0 auto 20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📅 Active Days:</span>
                  <strong style={{ color: 'white' }}>{activeDays} days</strong>
                </div>

                {wrappedData?.longest_workout && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>🌟 Longest Workout:</span>
                    <strong style={{ color: '#00E5FF' }}>{longestKm} km</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🏅 Marathons Equiv:</span>
                  <strong style={{ color: 'var(--primary)' }}>{marathonsEquiv} marathons</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Here's to crushing bigger distances in the next season!
              </p>
            </div>
          )}
        </div>

        {/* Slide Controls Bottom Bar */}
        <div className="wrapped-bottom-bar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          zIndex: 20
        }}>
          <button
            onClick={() => setActiveSlide(s => (s - 1 + totalSlides) % totalSlides)}
            className="icon-btn"
            style={{ padding: '8px' }}
            title="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {activeSlide + 1} of {totalSlides}
          </span>

          <button
            onClick={() => setActiveSlide(s => (s + 1) % totalSlides)}
            className="icon-btn"
            style={{ padding: '8px' }}
            title="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
