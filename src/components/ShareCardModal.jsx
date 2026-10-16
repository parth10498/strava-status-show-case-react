import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Square
} from 'lucide-react';
import { decodePolyline, formatDuration, formatPaceOrSpeed } from '../utils/polyline';

const THEMES = [
  { id: 'orange', name: 'Strava Orange', primary: '#FC5200', glow: '#FF6B2B', bg1: '#111827', bg2: '#030712' },
  { id: 'cyan', name: 'Cyber Cyan', primary: '#00F0FF', glow: '#38BDF8', bg1: '#0B132B', bg2: '#020617' },
  { id: 'lime', name: 'Neon Emerald', primary: '#10B981', glow: '#34D399', bg1: '#062016', bg2: '#02100A' },
  { id: 'purple', name: 'Sunset Violet', primary: '#A855F7', glow: '#C084FC', bg1: '#1E1035', bg2: '#0A0515' }
];

export default function ShareCardModal({ activity, athlete, weather, onClose }) {
  const canvasRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState('story'); // 'story' (9:16) or 'square' (1:1)
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(true);

  const isRun = activity?.sport_type === 'Run' || activity?.type === 'Run';
  const isRide = activity?.sport_type === 'Ride' || activity?.type === 'Ride' || activity?.sport_type?.includes('Ride');
  const rawDist = Number(activity?.distance);
  const distKm = (!isNaN(rawDist) && rawDist >= 0) ? (rawDist / 1000.0).toFixed(2) : '0.00';
  const paceOrSpeed = activity ? formatPaceOrSpeed(activity.sport_type || activity.type, activity.average_speed) : '--:--';
  const timeFormatted = activity ? formatDuration(activity.moving_time) : '0m';
  const rawElev = Number(activity?.total_elevation_gain);
  const elevationM = (!isNaN(rawElev) && rawElev >= 0) ? Math.round(rawElev) : 0;

  const dateStr = activity?.start_date ? new Date(activity.start_date).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }) : '';

  const athleteName = athlete ? `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() : 'Strava Athlete';

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activity) return;

    setRendering(true);
    const ctx = canvas.getContext('2d');

    // Dimensions
    const width = 1080;
    const height = aspectRatio === 'story' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, selectedTheme.bg1);
    bgGrad.addColorStop(1, selectedTheme.bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Radial Glow Top Right
    const radialGlow = ctx.createRadialGradient(width * 0.85, height * 0.15, 50, width * 0.85, height * 0.15, 600);
    radialGlow.addColorStop(0, `${selectedTheme.primary}33`);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Header: Athlete Monogram/Brand
    const padX = 90;
    let currY = aspectRatio === 'story' ? 140 : 100;

    // Athlete Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, currY, 320, 68, 34);
    ctx.fill();
    ctx.stroke();

    // Small avatar circle
    ctx.fillStyle = selectedTheme.primary;
    ctx.beginPath();
    ctx.arc(padX + 34, currY + 34, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((athlete?.firstname?.[0] || 'S').toUpperCase(), padX + 34, currY + 34);

    // Athlete Name Text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(athleteName, padX + 70, currY + 34);

    // Sport Tag Pill right aligned
    const sportTag = isRun ? '🏃 RUN' : isRide ? '🚴 RIDE' : '✨ WORKOUT';
    ctx.fillStyle = `${selectedTheme.primary}26`;
    ctx.strokeStyle = selectedTheme.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - padX - 160, currY, 160, 68, 34);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = selectedTheme.primary;
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sportTag, width - padX - 80, currY + 34);

    currY += 120;

    // 3. Activity Title & Date
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px Outfit, sans-serif';
    ctx.textAlign = 'left';
    const actName = activity?.name || 'Workout';
    const displayTitle = actName.length > 28 ? actName.slice(0, 27) + '...' : actName;
    ctx.fillText(displayTitle, padX, currY);

    currY += 75;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px Inter, sans-serif';
    const weatherSnippet = weather?.temperature ? ` • ☀️ ${weather.temperature}°C ${weather.weather_description || ''}` : '';
    ctx.fillText(`${dateStr}${weatherSnippet}`, padX, currY);

    // 4. GPS Route Map Silhouette
    const polylineStr = activity.summary_polyline;
    const coords = polylineStr ? decodePolyline(polylineStr) : [];

    const mapBoxY = currY + 60;
    const mapBoxHeight = aspectRatio === 'story' ? 700 : 360;
    const mapBoxWidth = width - padX * 2;

    // Glass backdrop for map
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, mapBoxY, mapBoxWidth, mapBoxHeight, 28);
    ctx.fill();
    ctx.stroke();

    if (coords.length > 2) {
      // Find coordinate boundaries
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      coords.forEach(([lat, lng]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });

      const dLat = maxLat - minLat || 0.001;
      const dLng = maxLng - minLng || 0.001;

      // Fit with padding
      const padMap = 60;
      const drawW = mapBoxWidth - padMap * 2;
      const drawH = mapBoxHeight - padMap * 2;

      const scale = Math.min(drawW / dLng, drawH / dLat);
      const offsetX = padX + padMap + (drawW - dLng * scale) / 2;
      const offsetY = mapBoxY + padMap + (drawH - dLat * scale) / 2;

      const toCanvasX = (lng) => offsetX + (lng - minLng) * scale;
      const toCanvasY = (lat) => offsetY + (maxLat - lat) * scale;

      // Glow polyline
      ctx.shadowColor = selectedTheme.primary;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = selectedTheme.primary;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(toCanvasX(coords[0][1]), toCanvasY(coords[0][0]));
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(toCanvasX(coords[i][1]), toCanvasY(coords[i][0]));
      }
      ctx.stroke();

      // Reset shadow for core sharp stroke
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Start Marker (Green)
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(toCanvasX(coords[0][1]), toCanvasY(coords[0][0]), 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Finish Marker (Red)
      const lastPt = coords[coords.length - 1];
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(toCanvasX(lastPt[1]), toCanvasY(lastPt[0]), 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // No GPS placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏃 Indoor / Treadmill Workout Track', width / 2, mapBoxY + mapBoxHeight / 2);
    }

    // 5. Stat HUD Blocks (2x2 Grid)
    currY = mapBoxY + mapBoxHeight + 50;

    const stats = [
      { label: 'DISTANCE', val: distKm, unit: 'km', color: selectedTheme.primary },
      { label: 'TIME', val: timeFormatted, unit: '', color: '#FFFFFF' },
      { label: isRun ? 'AVG PACE' : 'AVG SPEED', val: paceOrSpeed, unit: '', color: '#FFFFFF' },
      { label: 'ELEVATION', val: `+${elevationM}`, unit: 'm', color: '#10B981' }
    ];

    const blockW = (width - padX * 2 - 30) / 2;
    const blockH = aspectRatio === 'story' ? 140 : 100;

    stats.forEach((s, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = padX + col * (blockW + 30);
      const by = currY + row * (blockH + 25);

      // Glass Card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, blockW, blockH, 20);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(s.label, bx + 28, by + 22);

      // Value
      ctx.fillStyle = s.color;
      ctx.font = 'bold 44px Outfit, sans-serif';
      ctx.fillText(s.val, bx + 28, by + 56);

      // Unit
      if (s.unit) {
        const valWidth = ctx.measureText(s.val).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillText(s.unit, bx + 28 + valWidth + 8, by + 74);
      }
    });

    // 6. Watermark Footer
    currY += blockH * 2 + 70;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STRAVA STATUS • PERFORMANCE & MILESTONE TRACKER', width / 2, currY);

    setRendering(false);
  }, [activity, athlete, weather, aspectRatio, selectedTheme]);

  // Handle Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const safeName = (activity?.name || 'workout').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${safeName}_share_card.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } catch (err) {
      alert('Could not copy to clipboard directly. Please use the Download button.');
    }
  };

  if (!activity) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="glass-card share-card-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderColor: selectedTheme.primary,
          boxShadow: `0 0 40px ${selectedTheme.primary}33, 0 25px 60px rgba(0,0,0,0.9)`
        }}
      >
        {/* Header */}
        <div className="share-card-header" style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📸</span>
              <span>Social Share Card Generator</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Export high-resolution Instagram Story (9:16) or WhatsApp (1:1) cards with your route silhouette and stats.
            </p>
          </div>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Studio Body */}
        <div className="share-card-studio-body">
          {/* Card Canvas Preview Viewport */}
          <div className="share-card-canvas-viewport">
            <canvas 
              ref={canvasRef} 
              style={{
                maxWidth: '100%',
                maxHeight: '520px',
                borderRadius: '16px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>

          {/* Controls Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Format toggle */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Card Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setAspectRatio('story')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: aspectRatio === 'story' ? selectedTheme.primary : 'var(--border-subtle)',
                    background: aspectRatio === 'story' ? `${selectedTheme.primary}26` : 'rgba(255,255,255,0.04)',
                    color: aspectRatio === 'story' ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={16} />
                  <span>Story (9:16)</span>
                </button>

                <button
                  onClick={() => setAspectRatio('square')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: aspectRatio === 'square' ? selectedTheme.primary : 'var(--border-subtle)',
                    background: aspectRatio === 'square' ? `${selectedTheme.primary}26` : 'rgba(255,255,255,0.04)',
                    color: aspectRatio === 'square' ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Square size={16} />
                  <span>Square (1:1)</span>
                </button>
              </div>
            </div>

            {/* Theme Presets */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Color Aesthetic
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: selectedTheme.id === theme.id ? theme.primary : 'var(--border-subtle)',
                      background: selectedTheme.id === theme.id ? `${theme.primary}20` : 'rgba(255,255,255,0.04)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.primary }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{theme.name}</span>
                    </div>
                    {selectedTheme.id === theme.id && <Check size={16} style={{ color: theme.primary }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={18} />
                <span>Download High-Res PNG</span>
              </button>

              <button
                onClick={handleCopy}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Copy size={18} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
