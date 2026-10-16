import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  X, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Navigation, 
  Layers,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Share2,
  TrendingUp,
  Key
} from 'lucide-react';
import { decodePolyline, formatDuration, formatPaceOrSpeed } from '../utils/polyline';
import ShareCardModal from './ShareCardModal';
import CartoKeyModal from './CartoKeyModal';
import { getElevationProfile, fetchActivityWeather, downloadActivityExport } from '../services/stravaDataService';
import { getCartoApiKey, getBasemapProviders } from '../utils/mapTileService';
import { trackVisitorAction } from '../services/visitorTrackingService';

export default function RouteMapModal({ activity, athlete, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const hoverMarkerRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const playbackPolylineRef = useRef(null);

  const [cartoKey, setCartoKey] = useState(getCartoApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const tileProviders = useMemo(() => getBasemapProviders(cartoKey), [cartoKey]);

  const [tileStyle, setTileStyle] = useState(getCartoApiKey() ? 'dark' : 'osm_dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Elevation profile data
  const [elevationData, setElevationData] = useState(null);
  const [hoverElevationPoint, setHoverElevationPoint] = useState(null);

  // Weather data
  const [weather, setWeather] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // 1, 5, 15, 30
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Share Card Modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const isRun = activity?.sport_type === 'Run' || activity?.type === 'Run';
  const isRide = activity?.sport_type === 'Ride' || activity?.type === 'Ride' || activity?.sport_type?.includes('Ride');
  const themeColor = isRun ? '#FC5200' : isRide ? '#00F0FF' : '#10B981';

  // Decode or fetch polyline coordinates
  useEffect(() => {
    if (!activity) return;
    let coords = [];
    if (activity.coordinates && activity.coordinates.length > 0) {
      coords = activity.coordinates;
    } else if (activity.summary_polyline) {
      coords = decodePolyline(activity.summary_polyline);
    }
    setCoordinates(coords);
    setLoading(false);
  }, [activity]);

  // Load Elevation Profile & Weather
  useEffect(() => {
    if (!activity.id) return;

    // Elevation Profile
    try {
      const elev = getElevationProfile(activity.id);
      if (elev && elev.points && elev.points.length > 0) {
        setElevationData(elev);
      }
    } catch (err) {
      console.warn('Could not load elevation profile:', err);
    }

    // Weather
    fetchActivityWeather(activity.id)
      .then(data => {
        if (data && data.temperature !== undefined) {
          setWeather(data);
        }
      })
      .catch(err => console.warn('Could not load weather:', err));
  }, [activity.id]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || coordinates.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startPoint = coordinates[0];

    const map = L.map(mapContainerRef.current, {
      center: startPoint,
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });
    mapInstanceRef.current = map;

    const activeProvider = tileProviders[tileStyle] || tileProviders.osm_dark;
    tileLayerRef.current = L.tileLayer(activeProvider.url, {
      attribution: activeProvider.attribution,
      subdomains: activeProvider.subdomains || 'abc',
      className: activeProvider.className || '',
      maxZoom: activeProvider.maxZoom || 19
    }).addTo(map);

    // Glowing polyline outer effect
    L.polyline(coordinates, {
      color: themeColor,
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Core polyline route
    const mainPolyline = L.polyline(coordinates, {
      color: themeColor,
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Start Pin Icon
    const startIcon = L.divIcon({
      className: 'route-map-pin',
      html: `
        <div style="
          background: #10B981;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          border: 2px solid #ffffff;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.8), 0 3px 6px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span>START</span>
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 12]
    });

    // Finish Pin Icon
    const endPoint = coordinates[coordinates.length - 1];
    const finishIcon = L.divIcon({
      className: 'route-map-pin',
      html: `
        <div style="
          background: #EF4444;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          border: 2px solid #ffffff;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.8), 0 3px 6px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span>FINISH</span>
        </div>
      `,
      iconSize: [65, 24],
      iconAnchor: [32, 12]
    });

    L.marker(startPoint, { icon: startIcon }).addTo(map);
    L.marker(endPoint, { icon: finishIcon }).addTo(map);

    // Crosshair Hover Sync Marker
    const hoverIcon = L.divIcon({
      className: 'route-hover-crosshair',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid ${themeColor};
          box-shadow: 0 0 18px #FFFFFF, 0 0 10px ${themeColor};
          transform: translate(-50%, -50%);
          animation: pulse 1s infinite alternate;
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    hoverMarkerRef.current = L.marker(startPoint, { icon: hoverIcon, interactive: false });

    // Animated Playback Runner/Cyclist Marker
    const playbackIcon = L.divIcon({
      className: 'route-playback-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid ${themeColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 25px ${themeColor}, 0 5px 12px rgba(0,0,0,0.6);
          transform: translate(-50%, -50%);
        ">
          ${isRun ? '🏃' : isRide ? '🚴' : '⚡'}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    playbackMarkerRef.current = L.marker(startPoint, { icon: playbackIcon, interactive: false });

    // Polyline for covered playback track
    playbackPolylineRef.current = L.polyline([], {
      color: '#FFFFFF',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Fit bounds
    map.fitBounds(mainPolyline.getBounds(), {
      padding: [45, 45],
      maxZoom: 16,
      animate: false
    });

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [coordinates, themeColor]);

  // Seamlessly update map tile layer when tileStyle changes without recreating the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeProvider = tileProviders[tileStyle] || tileProviders.osm_dark;
    tileLayerRef.current = L.tileLayer(activeProvider.url, {
      attribution: activeProvider.attribution,
      subdomains: activeProvider.subdomains || 'abc',
      className: activeProvider.className || '',
      maxZoom: activeProvider.maxZoom || 19
    }).addTo(map);
  }, [tileStyle, cartoKey]);

  // Synchronize Hover on Elevation Profile to Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hoverMarker = hoverMarkerRef.current;
    if (!map || !hoverMarker) return;

    if (hoverElevationPoint && hoverElevationPoint.lat && hoverElevationPoint.lng) {
      hoverMarker.setLatLng([hoverElevationPoint.lat, hoverElevationPoint.lng]);
      if (!map.hasLayer(hoverMarker)) {
        hoverMarker.addTo(map);
      }
    } else {
      if (map.hasLayer(hoverMarker)) {
        map.removeLayer(hoverMarker);
      }
    }
  }, [hoverElevationPoint]);

  // Synchronize Playback Animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = playbackMarkerRef.current;
    const coveredPolyline = playbackPolylineRef.current;
    if (!map || !marker || coordinates.length < 2) return;

    if (playbackProgress > 0) {
      if (!map.hasLayer(marker)) marker.addTo(map);

      // Determine current index and position along track
      const totalPoints = coordinates.length;
      const exactIndex = playbackProgress * (totalPoints - 1);
      const floorIndex = Math.floor(exactIndex);
      const ceilIndex = Math.min(totalPoints - 1, floorIndex + 1);
      const fraction = exactIndex - floorIndex;

      const p1 = coordinates[floorIndex];
      const p2 = coordinates[ceilIndex];

      const currentLat = p1[0] + (p2[0] - p1[0]) * fraction;
      const currentLng = p1[1] + (p2[1] - p1[1]) * fraction;

      marker.setLatLng([currentLat, currentLng]);

      // Update traveled polyline
      const traveledPoints = coordinates.slice(0, floorIndex + 1);
      traveledPoints.push([currentLat, currentLng]);
      if (coveredPolyline) coveredPolyline.setLatLngs(traveledPoints);
    } else {
      if (map.hasLayer(marker)) map.removeLayer(marker);
      if (coveredPolyline) coveredPolyline.setLatLngs([]);
    }
  }, [playbackProgress, coordinates]);

  // Playback Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const durationSec = activity.moving_time || 1800; // Total duration in seconds
    const simulatedDurationSec = Math.max(10, durationSec / (playbackSpeed * 8)); // Speed-adjusted real-world playback seconds

    const animateStep = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = (timestamp - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = timestamp;

      setPlaybackProgress(prev => {
        const next = prev + (deltaSec / simulatedDurationSec);
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animateStep);
    };

    animationFrameRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, activity.moving_time]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Download GPX / TCX handler
  const handleExport = (format) => {
    downloadActivityExport(activity.id, format);
  };

  const rawDist = Number(activity?.distance);
  const distKm = (!isNaN(rawDist) && rawDist >= 0) ? (rawDist / 1000.0).toFixed(2) : '0.00';
  const dateStr = activity.start_date ? new Date(activity.start_date).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }) : '';
  const timeStr = activity.start_date ? new Date(activity.start_date).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit'
  }) : '';

  // SVG Elevation Profile Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 110;
  const padBottom = 24;
  const padTop = 12;

  const elevationSvgPath = useMemo(() => {
    if (!elevationData || !elevationData.points || elevationData.points.length < 2) return null;
    const pts = elevationData.points;
    const maxE = elevationData.max_elevation;
    const minE = Math.max(0, elevationData.min_elevation - 5);
    const dE = maxE - minE || 1;

    const maxDist = pts[pts.length - 1].distance_km || 1;

    const coords = pts.map(p => {
      const x = (p.distance_km / maxDist) * svgWidth;
      const y = svgHeight - padBottom - ((p.elevation_m - minE) / dE) * (svgHeight - padBottom - padTop);
      return [x, y];
    });

    const linePath = `M ${coords[0][0]} ${coords[0][1]} ` + coords.slice(1).map(c => `L ${c[0]} ${c[1]}`).join(' ');
    const areaPath = linePath + ` L ${svgWidth} ${svgHeight - padBottom} L 0 ${svgHeight - padBottom} Z`;

    return { linePath, areaPath, minE, maxE, maxDist };
  }, [elevationData]);

  // Handle SVG Elevation Hover
  const handleSvgMouseMove = (e) => {
    if (!elevationData || !elevationData.points) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetIdx = Math.round(pct * (elevationData.points.length - 1));
    const pt = elevationData.points[targetIdx];
    setHoverElevationPoint(pt);
  };

  if (!activity) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div 
          className={`route-map-modal glass-card ${isFullscreen ? 'fullscreen-modal' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: themeColor,
            boxShadow: `0 0 35px ${themeColor}26, 0 25px 60px rgba(0,0,0,0.85)`
          }}
        >
          {/* Modal Header */}
          <div className="route-modal-header">
            <div className="route-header-info">
              <div className="route-sport-tag" style={{ borderColor: themeColor, color: themeColor }}>
                {isRun ? '🏃 RUN' : isRide ? '🚴 RIDE' : '✨ WORKOUT'}
              </div>
              <div>
                <h2 className="route-activity-title">{activity.name}</h2>
                <div className="route-activity-meta">
                  <span><Calendar size={13} /> {dateStr} at {timeStr}</span>
                  {coordinates.length > 0 && (
                    <span>• <Navigation size={13} /> {coordinates.length} GPS Trackpoints</span>
                  )}
                  {weather && (
                    <span style={{ 
                      background: 'rgba(255, 255, 255, 0.08)', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{weather.weather_icon || '☀️'}</span>
                      <strong>{weather.temperature}°C</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{weather.weather_description}</span>
                      <span style={{ color: 'var(--text-dim)' }}>• 💨 {weather.wind_speed} km/h</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="route-header-actions">
              {/* Share Card Generator Button */}
              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(true)}
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Generate Instagram Story / WhatsApp Share Card"
              >
                <Share2 size={14} style={{ color: 'var(--primary)' }} />
                <span>Share Card</span>
              </button>

              {/* Export GPX / TCX Dropdown */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleExport('gpx')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Download GPX file for Garmin, Wahoo, Apple Watch"
                >
                  GPX
                </button>
                <button
                  onClick={() => handleExport('tcx')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Download TCX file"
                >
                  TCX
                </button>
              </div>

              {/* Map Style Selector */}
              <div className="tile-style-selector">
                <Layers size={14} style={{ color: 'var(--text-muted)' }} />
                {Object.entries(tileProviders).map(([key, prov]) => (
                  <button
                    key={key}
                    className={`tile-btn ${tileStyle === key ? 'active' : ''}`}
                    onClick={() => setTileStyle(key)}
                    title={prov.name}
                  >
                    {prov.name}
                  </button>
                ))}
                <button
                  className="tile-btn"
                  onClick={() => setShowKeyModal(true)}
                  title="Configure CARTO API Key to remove watermarks"
                  style={{
                    color: cartoKey ? '#10B981' : 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Key size={12} />
                  <span>{cartoKey ? 'Key ✓' : 'Key'}</span>
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button 
                className="icon-btn" 
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  setTimeout(() => {
                    if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
                  }, 200);
                }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              {/* External Strava link */}
              <a 
                href={`https://www.strava.com/activities/${activity.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="icon-btn"
                title="Open on Strava"
              >
                <ExternalLink size={18} />
              </a>

              {/* Close Button */}
              <button className="icon-btn close-btn" onClick={onClose} title="Close (Esc)">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Stats Strip HUD */}
          <div className="route-stats-strip">
            <div className="route-stat-item">
              <span className="route-stat-label">Distance</span>
              <span className="route-stat-val" style={{ color: themeColor }}>
                {distKm} <span className="route-stat-unit">km</span>
              </span>
            </div>

            <div className="route-stat-item">
              <span className="route-stat-label">Moving Time</span>
              <span className="route-stat-val">
                {formatDuration(activity.moving_time)}
              </span>
            </div>

            <div className="route-stat-item">
              <span className="route-stat-label">{isRun ? 'Avg Pace' : 'Avg Speed'}</span>
              <span className="route-stat-val">
                {formatPaceOrSpeed(activity.sport_type || activity.type, activity.average_speed)}
              </span>
            </div>

            <div className="route-stat-item">
              <span className="route-stat-label">Elevation Gain</span>
              <span className="route-stat-val">
                +{Math.round(activity.total_elevation_gain || 0)} <span className="route-stat-unit">m</span>
              </span>
            </div>

            {activity.max_speed > 0 && (
              <div className="route-stat-item">
                <span className="route-stat-label">Max Speed</span>
                <span className="route-stat-val">
                  {(activity.max_speed * 3.6).toFixed(1)} <span className="route-stat-unit">km/h</span>
                </span>
              </div>
            )}
          </div>

          {/* Map Canvas Container */}
          <div className="route-map-viewport" style={{ position: 'relative' }}>
            {loading ? (
              <div className="map-loader">
                <div className="spinner"></div>
                <span>Decoding GPS route coordinates...</span>
              </div>
            ) : coordinates.length === 0 ? (
              <div className="map-no-route">
                <Navigation size={48} style={{ opacity: 0.3, marginBottom: '14px' }} />
                <h3>No GPS Route Polyline Available</h3>
                <p>This activity may have been logged indoors without GPS track recording.</p>
              </div>
            ) : (
              <div ref={mapContainerRef} className="leaflet-map-element" />
            )}

            {/* Live Playback Animated HUD Badge on Map */}
            {playbackProgress > 0 && (
              <div className="route-playback-hud" style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${themeColor}`,
                borderRadius: '12px',
                padding: '10px 16px',
                zIndex: 500,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Elapsed Time</span>
                  <strong style={{ fontSize: '1rem', color: 'white', fontFamily: 'var(--font-display)' }}>
                    {formatDuration(playbackProgress * (activity.moving_time || 1800))}
                  </strong>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Distance</span>
                  <strong style={{ fontSize: '1rem', color: themeColor, fontFamily: 'var(--font-display)' }}>
                    {(((playbackProgress || 0) * (Number(activity?.distance || 0) / 1000.0))).toFixed(2)} km
                  </strong>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Progress</span>
                  <strong style={{ fontSize: '1rem', color: '#10B981', fontFamily: 'var(--font-display)' }}>
                    {Math.round(playbackProgress * 100)}%
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Animated Route Playback Toolbar */}
          {coordinates.length > 0 && (
            <div className="route-playback-toolbar" style={{
              padding: '10px 20px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap'
            }}>
              {/* Play / Pause */}
              <button
                onClick={() => {
                  const willPlay = !isPlaying;
                  setIsPlaying(willPlay);
                  if (willPlay) {
                    trackVisitorAction('route_playback', { activity });
                  }
                }}
                style={{
                  background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : `${themeColor}26`,
                  border: `1px solid ${isPlaying ? '#EF4444' : themeColor}`,
                  color: isPlaying ? '#EF4444' : themeColor,
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={isPlaying ? 'Pause Playback' : 'Play Animated Route'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
              </button>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setPlaybackProgress(0);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Restart Route"
              >
                <RotateCcw size={16} />
              </button>

              {/* Scrub Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.002"
                value={playbackProgress}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackProgress(parseFloat(e.target.value));
                }}
                style={{
                  flex: 1,
                  accentColor: themeColor,
                  cursor: 'pointer',
                  minWidth: '160px'
                }}
              />

              {/* Speed Multiplier Pills */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '4px' }}>Speed:</span>
                {[1, 5, 15, 30].map(s => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: playbackSpeed === s ? themeColor : 'rgba(255,255,255,0.08)',
                      background: playbackSpeed === s ? `${themeColor}33` : 'transparent',
                      color: playbackSpeed === s ? 'white' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Elevation Profile Graph */}
          {elevationSvgPath && (
            <div className="route-elevation-card" style={{
              padding: '12px 20px',
              background: 'rgba(10, 15, 26, 0.6)',
              borderBottom: '1px solid var(--border-subtle)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={14} style={{ color: themeColor }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Route Elevation Profile (Hover to pinpoint hills &amp; climbs on map)
                  </span>
                </div>

                {hoverElevationPoint && (
                  <div style={{
                    fontSize: '0.8rem',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    color: 'white',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <span>📍 <strong>{hoverElevationPoint.distance_km} km</strong></span>
                    <span>⛰️ <strong>{hoverElevationPoint.elevation_m}m</strong></span>
                    <span>📈 Grade: <strong>{hoverElevationPoint.grade_pct}%</strong></span>
                  </div>
                )}
              </div>

              {/* SVG Area Profile */}
              <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px` }}>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', overflow: 'visible' }}
                  onMouseMove={handleSvgMouseMove}
                  onMouseLeave={() => setHoverElevationPoint(null)}
                >
                  <defs>
                    <linearGradient id={`elev-grad-${activity.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColor} stopOpacity="0.45" />
                      <stop offset="100%" stopColor={themeColor} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area */}
                  <path d={elevationSvgPath.areaPath} fill={`url(#elev-grad-${activity.id})`} />

                  {/* Outline Path */}
                  <path d={elevationSvgPath.linePath} fill="none" stroke={themeColor} strokeWidth="2.5" />

                  {/* Horizontal Baseline */}
                  <line x1="0" y1={svgHeight - padBottom} x2={svgWidth} y2={svgHeight - padBottom} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {/* Axis Distance Markers */}
                  <text x="0" y={svgHeight - 6} fill="rgba(255,255,255,0.4)" fontSize="10">0 km</text>
                  <text x={svgWidth / 2} y={svgHeight - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">
                    {((Number(elevationSvgPath.maxDist) || 0) / 2).toFixed(1)} km
                  </text>
                  <text x={svgWidth} y={svgHeight - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">
                    {(Number(elevationSvgPath.maxDist) || 0).toFixed(1)} km
                  </text>

                  {/* Min / Max Elevation Labels */}
                  <text x="6" y={padTop + 4} fill="rgba(255,255,255,0.5)" fontSize="10">{elevationSvgPath.maxE}m</text>
                  <text x="6" y={svgHeight - padBottom - 4} fill="rgba(255,255,255,0.5)" fontSize="10">{elevationSvgPath.minE}m</text>

                  {/* Hover Crosshair Vertical Line */}
                  {hoverElevationPoint && (
                    <line
                      x1={(hoverElevationPoint.distance_km / elevationSvgPath.maxDist) * svgWidth}
                      y1="0"
                      x2={(hoverElevationPoint.distance_km / elevationSvgPath.maxDist) * svgWidth}
                      y2={svgHeight - padBottom}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="route-modal-footer">
            <div className="route-footer-left">
              <span>Powered by Leaflet.js &amp; OpenStreetMap • Open-Meteo Weather</span>
            </div>
            <div className="route-footer-right" style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-secondary"
                style={{ padding: '7px 16px', fontSize: '0.85rem' }}
              >
                <Share2 size={14} />
                <span>Create Social Card</span>
              </button>
              <a 
                href={`https://www.strava.com/activities/${activity.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.85rem' }}
              >
                <span>View Full Activity on Strava</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Share Card Studio Modal */}
      {showShareModal && (
        <ShareCardModal
          activity={activity}
          athlete={athlete}
          weather={weather}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* CARTO API Key Modal */}
      <CartoKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onKeySaved={(k) => setCartoKey(k)}
      />
    </>
  );
}
