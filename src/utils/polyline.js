/**
 * Decode Google Encoded Polyline into [latitude, longitude] pairs.
 * Zero external dependencies.
 */
export function decodePolyline(encoded, precision = 5) {
  if (!encoded || typeof encoded !== 'string') return [];
  
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  const factor = Math.pow(10, precision);
  const len = encoded.length;

  try {
    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lat / factor, lng / factor]);
    }
  } catch (err) {
    console.error('Error decoding polyline string:', err);
    return [];
  }

  return coordinates;
}

/**
 * Format duration in seconds to human-readable string (e.g. 1h 24m 10s)
 */
export function formatDuration(seconds) {
  const num = Number(seconds);
  if (!num || isNaN(num) || num <= 0 || !isFinite(num)) return '0m';
  const h = Math.floor(num / 3600);
  const m = Math.floor((num % 3600) / 60);
  const s = Math.floor(num % 60);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return '0m';
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

/**
 * Format speed/pace based on sport type
 */
export function formatPaceOrSpeed(sportType, avgSpeedMs) {
  const num = Number(avgSpeedMs);
  if (!num || isNaN(num) || num <= 0 || !isFinite(num)) return '--:--';
  const isRun = sportType === 'Run' || sportType?.toLowerCase() === 'run';
  if (isRun) {
    const secPerKm = 1000.0 / num;
    if (!isFinite(secPerKm) || isNaN(secPerKm)) return '--:--';
    const m = Math.floor(secPerKm / 60);
    const s = Math.floor(secPerKm % 60);
    if (isNaN(m) || isNaN(s)) return '--:--';
    return `${m}:${s < 10 ? '0' : ''}${s} /km`;
  } else {
    const kmh = (num * 3.6).toFixed(1);
    if (isNaN(Number(kmh))) return '--:--';
    return `${kmh} km/h`;
  }
}
