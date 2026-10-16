import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Lock, 
  CheckCircle, 
  ExternalLink, 
  ChevronRight, 
  Zap, 
  Flame, 
  Compass, 
  ShieldCheck, 
  X
} from 'lucide-react';
import { calculateBadges } from '../utils/badgeService';
import { getStore } from '../services/stravaDataService';

export default function TrophyBadgesCabinet({ onSelectActivityForMap }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unlocked', 'locked'
  const [inspectedBadge, setInspectedBadge] = useState(null);

  // Load activities and calculate badges dynamically
  const badgeData = useMemo(() => {
    try {
      const store = getStore();
      return calculateBadges(store.activities || []);
    } catch (e) {
      console.error('Failed to calculate badges:', e);
      return calculateBadges([]);
    }
  }, []);

  const { badges, totalXp, maxXp, unlockedCount, totalCount, levelInfo } = badgeData;

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return badges.filter(b => {
      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      // Status filter
      if (statusFilter === 'unlocked' && !b.unlocked) return false;
      if (statusFilter === 'locked' && b.unlocked) return false;
      return true;
    });
  }, [badges, selectedCategory, statusFilter]);

  const categories = [
    { id: 'all', label: 'All Badges', icon: '🌟', count: badges.length },
    { id: 'running', label: 'Running', icon: '🏃', count: badges.filter(b => b.category === 'running').length },
    { id: 'cycling', label: 'Cycling', icon: '🚴', count: badges.filter(b => b.category === 'cycling').length },
    { id: 'speed', label: 'Speed & PR', icon: '⚡', count: badges.filter(b => b.category === 'speed').length },
    { id: 'climbing', label: 'Climbing', icon: '⛰️', count: badges.filter(b => b.category === 'climbing').length },
    { id: 'streaks', label: 'Streaks', icon: '🔥', count: badges.filter(b => b.category === 'streaks').length },
    { id: 'lifestyle', label: 'Dedication', icon: '🌙', count: badges.filter(b => b.category === 'lifestyle').length }
  ];

  const completionPct = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);
  const xpPct = Math.round((totalXp / Math.max(1, maxXp)) * 100);

  // Tier Colors
  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'diamond':
        return { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c084fc', label: 'DIAMOND' };
      case 'gold':
        return { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#fde047', label: 'GOLD' };
      case 'silver':
        return { bg: 'rgba(148, 163, 184, 0.2)', border: '#94a3b8', text: '#cbd5e1', label: 'SILVER' };
      default:
        return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fdba74', label: 'BRONZE' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Athlete Level & Trophy Progress Banner */}
      <div 
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: 'radial-gradient(ellipse at 15% 50%, rgba(252, 82, 0, 0.15), transparent 70%), radial-gradient(ellipse at 85% 50%, rgba(168, 85, 247, 0.15), transparent 70%), var(--bg-card)',
          border: '1px solid rgba(252, 82, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Athlete Rank & Level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #FC5200, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 0 25px rgba(252, 82, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              position: 'relative'
            }}>
              <span>{levelInfo.icon}</span>
              <div style={{
                position: 'absolute',
                bottom: '-6px',
                background: '#0f172a',
                border: '1px solid #FC5200',
                color: '#FC5200',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '8px',
                letterSpacing: '0.5px'
              }}>
                LVL {levelInfo.level}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  letterSpacing: '1px', 
                  color: 'var(--primary)', 
                  textTransform: 'uppercase' 
                }}>
                  Athlete Mastery Rank
                </span>
                <span style={{ 
                  background: 'rgba(252, 82, 0, 0.2)', 
                  border: '1px solid rgba(252, 82, 0, 0.4)', 
                  color: '#FC5200', 
                  fontSize: '0.7rem', 
                  padding: '1px 8px', 
                  borderRadius: '12px',
                  fontWeight: 700 
                }}>
                  Top Tier
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
                {levelInfo.title}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {unlockedCount} of {totalCount} trophies claimed • {totalXp} Total Trophy XP
              </p>
            </div>
          </div>

          {/* XP & Badges Counter Blocks */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '130px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Trophies Unlocked
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e', fontFamily: 'var(--font-display)' }}>
                {unlockedCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ {totalCount}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {completionPct}% Complete
              </span>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '130px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Endurance XP
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FC5200', fontFamily: 'var(--font-display)' }}>
                {totalXp} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>XP</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {maxXp - totalXp} XP to Max
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <span>Overall Trophy Mastery Progress</span>
            <strong style={{ color: 'white' }}>{totalXp} / {maxXp} XP ({xpPct}%)</strong>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div 
              style={{
                width: `${xpPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FC5200, #f59e0b, #a855f7)',
                borderRadius: '999px',
                transition: 'width 1s ease-out',
                boxShadow: '0 0 12px rgba(252, 82, 0, 0.5)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="section-card glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="btn"
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  background: selectedCategory === cat.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedCategory === cat.id ? 'white' : 'var(--text-secondary)',
                  border: selectedCategory === cat.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  opacity: 0.7, 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1px 5px', 
                  borderRadius: '6px' 
                }}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Unlocked / Locked Segmented Control */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: statusFilter === 'all' ? 'white' : 'var(--text-dim)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All ({badges.length})
            </button>
            <button
              onClick={() => setStatusFilter('unlocked')}
              style={{
                background: statusFilter === 'unlocked' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                color: statusFilter === 'unlocked' ? '#4ade80' : 'var(--text-dim)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              onClick={() => setStatusFilter('locked')}
              style={{
                background: statusFilter === 'locked' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: statusFilter === 'locked' ? '#f87171' : 'var(--text-dim)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Locked ({totalCount - unlockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredBadges.map(badge => {
          const tierStyle = getTierBadgeStyle(badge.tier);

          return (
            <div
              key={badge.id}
              onClick={() => setInspectedBadge(badge)}
              className="glass-card"
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: badge.unlocked ? `${badge.accent}45` : 'var(--border-subtle)',
                background: badge.unlocked 
                  ? `radial-gradient(circle at 90% 10%, ${badge.accent}12, transparent 65%), var(--bg-card)`
                  : 'rgba(255, 255, 255, 0.02)',
                opacity: badge.unlocked ? 1 : 0.78,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = badge.accent;
                e.currentTarget.style.boxShadow = `0 8px 20px -6px ${badge.accent}33`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = badge.unlocked ? `${badge.accent}45` : 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                {/* Header: Tier tag & XP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: tierStyle.bg,
                    border: `1px solid ${tierStyle.border}`,
                    color: tierStyle.text
                  }}>
                    {tierStyle.label}
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: badge.unlocked ? badge.accent : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <span>+{badge.xp}</span>
                    <span style={{ fontSize: '0.65rem' }}>XP</span>
                  </span>
                </div>

                {/* Badge Icon & Info */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: badge.unlocked 
                      ? `linear-gradient(135deg, ${badge.accent}33, ${badge.accent}11)` 
                      : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${badge.unlocked ? badge.accent : 'rgba(255, 255, 255, 0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0,
                    boxShadow: badge.unlocked ? `0 0 16px ${badge.accent}30` : 'none',
                    filter: badge.unlocked ? 'none' : 'grayscale(100%) opacity(50%)'
                  }}>
                    {badge.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '0.98rem', 
                      fontWeight: 700, 
                      color: badge.unlocked ? 'white' : 'var(--text-secondary)' 
                    }}>
                      {badge.title}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.78rem', 
                      color: 'var(--text-muted)', 
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {badge.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Progress or Unlock Badge */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                {badge.unlocked ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '0.78rem', fontWeight: 700 }}>
                      <CheckCircle size={14} />
                      <span>UNLOCKED</span>
                    </div>

                    {badge.qualifying ? (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectActivityForMap) onSelectActivityForMap(badge.qualifying);
                        }}
                        style={{
                          fontSize: '0.72rem',
                          color: badge.accent,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          textDecoration: 'underline'
                        }}
                      >
                        <span>View Workout</span>
                        <ExternalLink size={11} />
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Lifetime Record</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={11} />
                        <span>In Progress</span>
                      </span>
                      <strong style={{ color: 'var(--text-secondary)' }}>
                        {badge.progress.current} / {badge.progress.target} {badge.progress.unit} ({badge.progress.pct}%)
                      </strong>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{
                          width: `${badge.progress.pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #64748b, #94a3b8)',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Inspection Modal */}
      {inspectedBadge && (
        <div className="modal-backdrop" onClick={() => setInspectedBadge(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-content glass-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '92%', textAlign: 'center', padding: '28px' }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setInspectedBadge(null)}
              className="btn btn-icon"
              style={{ position: 'absolute', top: '16px', right: '16px', borderRadius: '50%', padding: '6px' }}
            >
              <X size={18} />
            </button>

            {/* Glowing 3D-effect Trophy Badge */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '26px',
              margin: '0 auto 16px auto',
              background: inspectedBadge.unlocked
                ? `linear-gradient(135deg, ${inspectedBadge.accent}44, ${inspectedBadge.accent}15)`
                : 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${inspectedBadge.unlocked ? inspectedBadge.accent : 'rgba(255, 255, 255, 0.15)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: inspectedBadge.unlocked ? `0 0 30px ${inspectedBadge.accent}55` : 'none',
              filter: inspectedBadge.unlocked ? 'none' : 'grayscale(100%) opacity(40%)'
            }}>
              {inspectedBadge.icon}
            </div>

            {/* Tier Pill */}
            <span style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '12px',
              background: getTierBadgeStyle(inspectedBadge.tier).bg,
              color: getTierBadgeStyle(inspectedBadge.tier).text,
              border: `1px solid ${getTierBadgeStyle(inspectedBadge.tier).border}`,
              marginBottom: '10px'
            }}>
              {getTierBadgeStyle(inspectedBadge.tier).label} TIER • +{inspectedBadge.xp} XP
            </span>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 800, color: 'white' }}>
              {inspectedBadge.title}
            </h3>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {inspectedBadge.desc}
            </p>

            {/* Progress or Unlock Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Achievement Status:</span>
                <strong style={{ color: inspectedBadge.unlocked ? '#22c55e' : '#eab308' }}>
                  {inspectedBadge.unlocked ? '✨ Unlocked & Claimed' : '🔒 In Progress'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Progress:</span>
                <span style={{ color: 'white', fontWeight: 600 }}>
                  {inspectedBadge.progress.current} / {inspectedBadge.progress.target} {inspectedBadge.progress.unit} ({inspectedBadge.progress.pct}%)
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    width: `${inspectedBadge.progress.pct}%`,
                    height: '100%',
                    background: inspectedBadge.unlocked 
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                      : 'linear-gradient(90deg, #64748b, #94a3b8)',
                    borderRadius: '999px'
                  }}
                />
              </div>

              {inspectedBadge.qualifying && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '3px' }}>Claimed via Activity:</div>
                  <strong style={{ color: inspectedBadge.accent }}>"{inspectedBadge.qualifying.name}"</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {new Date(inspectedBadge.qualifying.start_date_local || inspectedBadge.qualifying.start_date).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })} • {((inspectedBadge.qualifying.distance || 0) / 1000).toFixed(1)} km
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {inspectedBadge.qualifying && (
                <button
                  onClick={() => {
                    const act = inspectedBadge.qualifying;
                    setInspectedBadge(null);
                    if (onSelectActivityForMap) onSelectActivityForMap(act);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} />
                  <span>View Route on Map</span>
                </button>
              )}

              <button
                onClick={() => setInspectedBadge(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
