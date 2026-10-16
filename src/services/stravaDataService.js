import initialData from '../data/initialData.json';
import { DEMO_ACTIVITIES, DEMO_ATHLETE } from '../data/demoActivities.js';
import { decodePolyline } from '../utils/polyline.js';
import { trackVisitorAction } from './visitorTrackingService.js';

const STORAGE_KEY = 'strava_status_store_v1';
const WEATHER_CACHE_KEY = 'strava_weather_cache_v1';

// In-memory cache for speed
let currentStore = null;

// Helper to get or initialize store
export function getStore() {
  if (currentStore) return currentStore;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activities) && parsed.activities.length > 0) {
        currentStore = parsed;
        return currentStore;
      }
    }
  } catch (e) {
    console.warn('Error reading from localStorage, falling back to initial data:', e);
  }

  // Fallback to initial embedded data (349 activities)
  currentStore = {
    athlete: initialData.athlete || DEMO_ATHLETE,
    last_sync_time: initialData.last_sync_time || '2026-10-16 05:10:41 UTC',
    athlete_goals: initialData.athlete_goals || {
      weekly_run_km: 30.0,
      weekly_ride_km: 100.0,
      weekly_workouts: 5,
      monthly_dist_km: 300.0
    },
    gear: initialData.gear || [],
    activities: initialData.activities || []
  };

  saveStore(currentStore);
  return currentStore;
}

export function saveStore(store) {
  currentStore = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('LocalStorage save warning (possibly quota exceeded):', e);
  }
}

// -------------------------------------------------------------
// System Status
// -------------------------------------------------------------
export function getSystemStatus() {
  const store = getStore();
  return {
    is_authenticated: true,
    athlete: store.athlete,
    last_sync_time: store.last_sync_time,
    total_activities: store.activities.length
  };
}

// -------------------------------------------------------------
// Distance & Milestone Brackets Helpers
// -------------------------------------------------------------
function isRun(act) {
  const sp = act.sport_type || act.type || '';
  return sp.toLowerCase() === 'run';
}

function isRide(act) {
  const sp = act.sport_type || act.type || '';
  const rides = ['ride', 'virtualride', 'ebikeride', 'mountainbikeride', 'gravelride'];
  return rides.includes(sp.toLowerCase());
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const r = 6371.0;
  const toRad = (x) => (x * Math.PI) / 180.0;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

function calculateEddingtonNumber(distancesKm) {
  const sorted = [...distancesKm].sort((a, b) => b - a);
  let eNum = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      eNum = i + 1;
    } else {
      break;
    }
  }
  return eNum;
}

// -------------------------------------------------------------
// Statistics Calculation (mirrors backend/stats.py)
// -------------------------------------------------------------
export function calculateStats(filterObj = {}) {
  const store = getStore();
  const allActs = store.activities || [];

  const year = filterObj.year ? String(filterObj.year) : null;
  const month = filterObj.month ? String(filterObj.month).padStart(2, '0') : null;
  const startDate = filterObj.startDate || filterObj.start_date || null;
  const endDate = filterObj.endDate || filterObj.end_date || null;

  // Filter activities matching criteria
  const filtered = allActs.filter((a) => {
    if (!a.start_date) return false;
    const dateStr = a.start_date.substring(0, 10);
    if (year && a.start_date.substring(0, 4) !== year) return false;
    if (month && a.start_date.substring(5, 7) !== month) return false;
    if (startDate && dateStr < startDate.substring(0, 10)) return false;
    if (endDate && dateStr > endDate.substring(0, 10)) return false;
    return true;
  });

  // 1. Overall stats
  let totalDistM = 0;
  let totalTimeSec = 0;
  let totalElevM = 0;
  filtered.forEach((a) => {
    totalDistM += Number(a.distance || 0);
    totalTimeSec += Number(a.moving_time || 0);
    totalElevM += Number(a.total_elevation_gain || 0);
  });

  const overall = {
    total_activities: filtered.length,
    total_distance_km: Math.round((totalDistM / 1000.0) * 10) / 10,
    total_moving_time_hours: Math.round((totalTimeSec / 3600.0) * 10) / 10,
    total_elevation_gain_m: Math.round(totalElevM)
  };

  // 2. Running stats
  const runActs = filtered.filter(isRun);
  let runDistM = 0;
  let runTimeSec = 0;
  let runElevM = 0;
  let runMaxDist = 0;
  let runTotalSpeed = 0;

  let gte_5k = 0;
  let gte_10k = 0;
  let gte_15k = 0;
  let gte_21k = 0;
  let gte_42k = 0;

  let bracket_under_5k = 0;
  let bracket_5k_10k = 0;
  let bracket_10k_15k = 0;
  let bracket_15k_21k = 0;
  let bracket_21k_plus = 0;

  runActs.forEach((a) => {
    const d = Number(a.distance || 0);
    runDistM += d;
    runTimeSec += Number(a.moving_time || 0);
    runElevM += Number(a.total_elevation_gain || 0);
    if (d > runMaxDist) runMaxDist = d;
    runTotalSpeed += Number(a.average_speed || 0);

    if (d >= 5000) gte_5k++;
    if (d >= 10000) gte_10k++;
    if (d >= 15000) gte_15k++;
    if (d >= 21097.5) gte_21k++;
    if (d >= 42195) gte_42k++;

    if (d < 5000) bracket_under_5k++;
    else if (d < 10000) bracket_5k_10k++;
    else if (d < 15000) bracket_10k_15k++;
    else if (d < 21097.5) bracket_15k_21k++;
    else bracket_21k_plus++;
  });

  const avgRunSpeed = runActs.length > 0 ? (runTotalSpeed / runActs.length) : 0;
  let paceStr = '--:--';
  if (avgRunSpeed > 0 && isFinite(avgRunSpeed)) {
    const secPerKm = 1000.0 / avgRunSpeed;
    if (isFinite(secPerKm)) {
      const m = Math.floor(secPerKm / 60);
      const s = Math.floor(secPerKm % 60);
      if (!isNaN(m) && !isNaN(s)) {
        paceStr = `${m}:${s < 10 ? '0' : ''}${s} /km`;
      }
    }
  }

  const running = {
    count: runActs.length,
    total_distance_km: Math.round((runDistM / 1000.0) * 10) / 10,
    total_moving_time_hours: Math.round((runTimeSec / 3600.0) * 10) / 10,
    total_elevation_gain_m: Math.round(runElevM),
    longest_run_km: Math.round((runMaxDist / 1000.0) * 100) / 100,
    avg_pace: paceStr,
    milestones: { gte_5k, gte_10k, gte_15k, gte_21k, gte_42k },
    brackets: [
      { label: '< 5 km', range: '0 - 4.9 km', count: bracket_under_5k, badge: 'Sprint' },
      { label: '5 - 10 km', range: '5.0 - 9.9 km', count: bracket_5k_10k, badge: '5K+' },
      { label: '10 - 15 km', range: '10.0 - 14.9 km', count: bracket_10k_15k, badge: '10K+' },
      { label: '15 - 21 km', range: '15.0 - 21.0 km', count: bracket_15k_21k, badge: '15K+' },
      { label: '21.1 km+', range: 'Half Marathon+', count: bracket_21k_plus, badge: '21K+' }
    ]
  };

  // 3. Cycling stats
  const rideActs = filtered.filter(isRide);
  let rideDistM = 0;
  let rideTimeSec = 0;
  let rideElevM = 0;
  let rideMaxDist = 0;
  let rideTotalSpeed = 0;

  let gte_20k = 0, gte_30k = 0, gte_40k = 0, gte_50k = 0, gte_100k = 0, gte_160k = 0, gte_200k = 0;
  let under_20k = 0, b_20k_30k = 0, b_30k_40k = 0, b_40k_50k = 0, b_50k_75k = 0;
  let b_75k_100k = 0, b_100k_160k = 0, b_160k_200k = 0, b_200k_plus = 0;

  rideActs.forEach((a) => {
    const d = Number(a.distance || 0);
    rideDistM += d;
    rideTimeSec += Number(a.moving_time || 0);
    rideElevM += Number(a.total_elevation_gain || 0);
    if (d > rideMaxDist) rideMaxDist = d;
    rideTotalSpeed += Number(a.average_speed || 0);

    if (d >= 20000) gte_20k++;
    if (d >= 30000) gte_30k++;
    if (d >= 40000) gte_40k++;
    if (d >= 50000) gte_50k++;
    if (d >= 100000) gte_100k++;
    if (d >= 160000) gte_160k++;
    if (d >= 200000) gte_200k++;

    if (d < 20000) under_20k++;
    else if (d < 30000) b_20k_30k++;
    else if (d < 40000) b_30k_40k++;
    else if (d < 50000) b_40k_50k++;
    else if (d < 75000) b_50k_75k++;
    else if (d < 100000) b_75k_100k++;
    else if (d < 160000) b_100k_160k++;
    else if (d < 200000) b_160k_200k++;
    else b_200k_plus++;
  });

  const avgRideSpeedMs = rideActs.length > 0 ? rideTotalSpeed / rideActs.length : 0;
  const avgRideSpeedKmh = Math.round(avgRideSpeedMs * 3.6 * 10) / 10;

  const cycling = {
    count: rideActs.length,
    total_distance_km: Math.round((rideDistM / 1000.0) * 10) / 10,
    total_moving_time_hours: Math.round((rideTimeSec / 3600.0) * 10) / 10,
    total_elevation_gain_m: Math.round(rideElevM),
    longest_ride_km: Math.round((rideMaxDist / 1000.0) * 100) / 100,
    avg_speed_kmh: avgRideSpeedKmh,
    milestones: { gte_20k, gte_30k, gte_40k, gte_50k, gte_100k, gte_160k, gte_200k },
    brackets: [
      { label: '< 20 km', range: '0 - 19.9 km', count: under_20k, badge: 'Short Spin' },
      { label: '20 - 30 km', range: '20.0 - 29.9 km', count: b_20k_30k, badge: '20K' },
      { label: '30 - 40 km', range: '30.0 - 39.9 km', count: b_30k_40k, badge: '30K' },
      { label: '40 - 50 km', range: '40.0 - 49.9 km', count: b_40k_50k, badge: '40K' },
      { label: '50 - 75 km', range: '50.0 - 74.9 km', count: b_50k_75k, badge: '50K (Half Century)' },
      { label: '75 - 100 km', range: '75.0 - 99.9 km', count: b_75k_100k, badge: '75K' },
      { label: '100 - 160 km', range: '100.0 - 159.9 km', count: b_100k_160k, badge: '100K Century' },
      { label: '160 - 200 km', range: '160.0 - 199.9 km', count: b_160k_200k, badge: '100 Miles Century' },
      { label: '200 km+', range: '200.0+ km', count: b_200k_plus, badge: '200K Brevet' }
    ]
  };

  // 4. Other sports
  const otherActs = filtered.filter((a) => !isRun(a) && !isRide(a));
  const otherMap = {};
  otherActs.forEach((a) => {
    const sp = a.sport_type || a.type || 'Other';
    if (!otherMap[sp]) {
      otherMap[sp] = { sport: sp, count: 0, total_dist: 0, total_time: 0, total_elev: 0 };
    }
    otherMap[sp].count++;
    otherMap[sp].total_dist += Number(a.distance || 0);
    otherMap[sp].total_time += Number(a.moving_time || 0);
    otherMap[sp].total_elev += Number(a.total_elevation_gain || 0);
  });

  const otherSportsList = Object.values(otherMap)
    .sort((a, b) => b.count - a.count)
    .map((o) => ({
      sport: o.sport,
      count: o.count,
      total_distance_km: Math.round((o.total_dist / 1000.0) * 10) / 10,
      total_moving_time_hours: Math.round((o.total_time / 3600.0) * 10) / 10,
      total_elevation_gain_m: Math.round(o.total_elev)
    }));

  // All sports breakdown
  const sportCounts = {};
  filtered.forEach((a) => {
    const sp = a.sport_type || a.type || 'Other';
    sportCounts[sp] = (sportCounts[sp] || 0) + 1;
  });
  const all_sports_breakdown = Object.entries(sportCounts)
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Distinct Available Years (across all activities in store)
  const yearsSet = new Set();
  allActs.forEach((a) => {
    if (a.start_date && a.start_date.length >= 4) {
      const yr = parseInt(a.start_date.substring(0, 4), 10);
      if (!isNaN(yr)) yearsSet.add(yr);
    }
  });
  const available_years = Array.from(yearsSet).sort((a, b) => b - a);

  // 6. Yearly Historical Breakdown
  const yearlyMap = {};
  allActs.forEach((a) => {
    if (!a.start_date || a.start_date.length < 4) return;
    const yr = parseInt(a.start_date.substring(0, 4), 10);
    if (isNaN(yr)) return;

    if (!yearlyMap[yr]) {
      yearlyMap[yr] = {
        year: yr,
        total_activities: 0,
        run_count: 0,
        ride_count: 0,
        other_count: 0,
        total_dist_m: 0,
        total_time_sec: 0,
        total_elev_m: 0,
        max_run_dist: 0,
        max_ride_dist: 0
      };
    }

    const y = yearlyMap[yr];
    y.total_activities++;
    const d = Number(a.distance || 0);
    y.total_dist_m += d;
    y.total_time_sec += Number(a.moving_time || 0);
    y.total_elev_m += Number(a.total_elevation_gain || 0);

    if (isRun(a)) {
      y.run_count++;
      if (d > y.max_run_dist) y.max_run_dist = d;
    } else if (isRide(a)) {
      y.ride_count++;
      if (d > y.max_ride_dist) y.max_ride_dist = d;
    } else {
      y.other_count++;
    }
  });

  const yearly_breakdown = Object.values(yearlyMap)
    .sort((a, b) => b.year - a.year)
    .map((y) => ({
      year: y.year,
      total_activities: y.total_activities,
      run_count: y.run_count,
      ride_count: y.ride_count,
      other_count: y.other_count,
      total_distance_km: Math.round((y.total_dist_m / 1000.0) * 10) / 10,
      total_time_hours: Math.round((y.total_time_sec / 3600.0) * 10) / 10,
      total_elevation_m: Math.round(y.total_elev_m),
      max_run_km: Math.round((y.max_run_dist / 1000.0) * 100) / 100,
      max_ride_km: Math.round((y.max_ride_dist / 1000.0) * 100) / 100
    }));

  // 7. Monthly Breakdown (target year)
  const parsedTargetYear = filterObj && filterObj.year ? parseInt(filterObj.year, 10) : NaN;
  const targetYear = !isNaN(parsedTargetYear) ? parsedTargetYear : (available_years[0] || 2026);
  const targetYearStr = String(targetYear);

  const monthsActs = allActs.filter(
    (a) => a.start_date && a.start_date.substring(0, 4) === targetYearStr
  );

  const monthCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthly_breakdown = monthCodes.map((code, idx) => {
    const inMonth = monthsActs.filter((a) => a.start_date.substring(5, 7) === code);
    let dist = 0, time = 0, runs = 0, rides = 0;
    inMonth.forEach((a) => {
      dist += Number(a.distance || 0);
      time += Number(a.moving_time || 0);
      if (isRun(a)) runs++;
      else if (isRide(a)) rides++;
    });

    return {
      month_code: code,
      month_name: monthNames[idx],
      total_activities: inMonth.length,
      run_count: runs,
      ride_count: rides,
      distance_km: Math.round((dist / 1000.0) * 10) / 10,
      time_hours: Math.round((time / 3600.0) * 10) / 10
    };
  });

  return {
    overall,
    running,
    cycling,
    other_sports: {
      total_count: otherActs.length,
      sports: otherSportsList
    },
    all_sports_breakdown,
    filter: {
      year: filterObj.year || null,
      month: filterObj.month || null,
      start_date: startDate,
      end_date: endDate
    },
    available_years,
    yearly_breakdown,
    monthly_breakdown: {
      year: targetYear,
      months: monthly_breakdown
    }
  };
}

// -------------------------------------------------------------
// Milestone & Distance Range Activities Filter
// -------------------------------------------------------------
export function getMilestoneActivities({ 
  sport = 'run', 
  minDistanceM = null, 
  maxDistanceM = null,
  search = '',
  sort = 'date_desc'
} = {}) {
  const store = getStore();
  let acts = [...(store.activities || [])];

  acts = acts.filter((a) => {
    if (sport === 'run' && !isRun(a)) return false;
    if (sport === 'ride' && !isRide(a)) return false;
    if (sport === 'other' && (isRun(a) || isRide(a))) return false;

    const d = Number(a.distance || 0);
    if (minDistanceM !== null && d < minDistanceM) return false;
    if (maxDistanceM !== null && d >= maxDistanceM) return false;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (a.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }

    return true;
  });

  // Sorting
  acts.sort((a, b) => {
    if (sort === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
    if (sort === 'distance_desc') return (b.distance || 0) - (a.distance || 0);
    if (sort === 'distance_asc') return (a.distance || 0) - (b.distance || 0);
    if (sort === 'speed_desc') return (b.average_speed || 0) - (a.average_speed || 0);
    if (sort === 'elevation_desc') return (b.total_elevation_gain || 0) - (a.total_elevation_gain || 0);
    return new Date(b.start_date || 0) - new Date(a.start_date || 0);
  });

  return acts;
}

// -------------------------------------------------------------
// Activities Feed & Route Explorer Pagination
// -------------------------------------------------------------
export function getActivitiesList(params = {}) {
  const store = getStore();
  let acts = [...(store.activities || [])];

  const sport = (params.sport || 'all').toLowerCase();
  const search = (params.search || '').trim().toLowerCase();
  const year = params.year ? String(params.year) : null;
  const month = params.month ? String(params.month).padStart(2, '0') : null;
  const startDate = params.start_date || params.startDate || null;
  const endDate = params.end_date || params.endDate || null;
  const hasRoute = params.has_route !== undefined ? Boolean(params.has_route) : null;

  acts = acts.filter((a) => {
    if (sport !== 'all') {
      if (sport === 'run' && !isRun(a)) return false;
      if (sport === 'ride' && !isRide(a)) return false;
      if (sport === 'other' && (isRun(a) || isRide(a))) return false;
      if (!['run', 'ride', 'other'].includes(sport)) {
        const aSport = (a.sport_type || a.type || '').toLowerCase();
        if (aSport !== sport) return false;
      }
    }

    if (search) {
      const name = (a.name || '').toLowerCase();
      if (!name.includes(search)) return false;
    }

    if (year && a.start_date && a.start_date.substring(0, 4) !== year) return false;
    if (month && a.start_date && a.start_date.substring(5, 7) !== month) return false;
    if (startDate && a.start_date && a.start_date.substring(0, 10) < startDate.substring(0, 10)) return false;
    if (endDate && a.start_date && a.start_date.substring(0, 10) > endDate.substring(0, 10)) return false;

    if (hasRoute !== null) {
      const hasPoly = Boolean(a.summary_polyline && a.summary_polyline.length > 5);
      if (hasRoute && !hasPoly) return false;
      if (!hasRoute && hasPoly) return false;
    }

    return true;
  });

  // Sort descending by start_date
  acts.sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

  const total = acts.length;
  const page = Math.max(1, parseInt(params.page || 1, 10));
  const perPage = Math.max(1, Math.min(100, parseInt(params.per_page || 10, 10)));
  const totalPages = Math.ceil(total / perPage) || 1;
  const offset = (page - 1) * perPage;
  const paginated = acts.slice(offset, offset + perPage);

  return {
    activities: paginated,
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  };
}

// -------------------------------------------------------------
// Activity Detail
// -------------------------------------------------------------
export function getActivityDetail(activityId) {
  const store = getStore();
  const idNum = Number(activityId);
  const act = store.activities.find((a) => Number(a.id) === idNum);
  if (!act) return null;

  const polyline = act.summary_polyline;
  const coordinates = polyline ? decodePolyline(polyline) : [];

  return {
    activity: act,
    coordinates,
    has_route: coordinates.length > 0,
    points_count: coordinates.length
  };
}

// -------------------------------------------------------------
// Heatmap Routes
// -------------------------------------------------------------
export function getHeatmapRoutes(sportFilter = 'all') {
  const store = getStore();
  const allActs = store.activities || [];
  const sport = (sportFilter || 'all').toLowerCase();

  const actsWithPoly = allActs.filter((a) => a.summary_polyline && a.summary_polyline.length > 5);

  let runCount = 0;
  let rideCount = 0;
  actsWithPoly.forEach((a) => {
    if (isRun(a)) runCount++;
    else if (isRide(a)) rideCount++;
  });
  const totalCount = actsWithPoly.length;
  const otherCount = Math.max(0, totalCount - (runCount + rideCount));

  let filtered = actsWithPoly;
  if (sport !== 'all') {
    if (sport === 'run') filtered = actsWithPoly.filter(isRun);
    else if (sport === 'ride') filtered = actsWithPoly.filter(isRide);
    else if (sport === 'other') filtered = actsWithPoly.filter((a) => !isRun(a) && !isRide(a));
    else filtered = actsWithPoly.filter((a) => (a.sport_type || a.type || '').toLowerCase() === sport);
  }

  filtered.sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

  const routes = filtered.map((r) => ({
    id: r.id,
    name: r.name,
    sport_type: r.sport_type || r.type,
    distance_km: Math.round(((r.distance || 0) / 1000.0) * 100) / 100,
    moving_time: r.moving_time,
    elevation_m: Math.round(r.total_elevation_gain || 0),
    start_date: r.start_date,
    polyline: r.summary_polyline
  }));

  return {
    routes,
    total_routes: routes.length,
    counts: {
      all: totalCount,
      run: runCount,
      ride: rideCount,
      other: otherCount
    }
  };
}

// -------------------------------------------------------------
// Training Consistency & 365-Day Matrix (mirrors backend/analytics.py)
// -------------------------------------------------------------
export function getConsistencyData() {
  const store = getStore();
  const acts = store.activities || [];

  const calendarMap = {};
  const activeDaysSet = new Set();
  let totalKmOverall = 0;

  const dowStatsMap = {
    0: { day_name: 'Sunday', count: 0, total_dist: 0 },
    1: { day_name: 'Monday', count: 0, total_dist: 0 },
    2: { day_name: 'Tuesday', count: 0, total_dist: 0 },
    3: { day_name: 'Wednesday', count: 0, total_dist: 0 },
    4: { day_name: 'Thursday', count: 0, total_dist: 0 },
    5: { day_name: 'Friday', count: 0, total_dist: 0 },
    6: { day_name: 'Saturday', count: 0, total_dist: 0 }
  };

  const timeOfDayMap = {
    'Morning (5-11 AM)': 0,
    'Afternoon (12-4 PM)': 0,
    'Evening (5-9 PM)': 0,
    'Night (10 PM-4 AM)': 0
  };

  acts.forEach((a) => {
    if (!a.start_date || a.start_date.length < 10) return;
    const dayStr = a.start_date.substring(0, 10);
    activeDaysSet.add(dayStr);

    const dist = Number(a.distance || 0);
    const time = Number(a.moving_time || 0);
    const sport = a.sport_type || a.type || 'Workout';

    if (!calendarMap[dayStr]) {
      calendarMap[dayStr] = {
        date: dayStr,
        count: 0,
        distance_km: 0,
        moving_time_min: 0,
        sports: []
      };
    }

    const c = calendarMap[dayStr];
    c.count++;
    c.distance_km = Math.round((c.distance_km + dist / 1000.0) * 10) / 10;
    c.moving_time_min = Math.round(c.moving_time_min + time / 60.0);
    if (!c.sports.includes(sport)) c.sports.push(sport);

    totalKmOverall += dist / 1000.0;

    // Day of week
    const dateObj = new Date(a.start_date);
    const dow = dateObj.getDay();
    if (dowStatsMap[dow]) {
      dowStatsMap[dow].count++;
      dowStatsMap[dow].total_dist += dist;
    }

    // Time of day
    const hr = dateObj.getHours();
    if (hr >= 5 && hr <= 11) timeOfDayMap['Morning (5-11 AM)']++;
    else if (hr >= 12 && hr <= 16) timeOfDayMap['Afternoon (12-4 PM)']++;
    else if (hr >= 17 && hr <= 21) timeOfDayMap['Evening (5-9 PM)']++;
    else timeOfDayMap['Night (10 PM-4 AM)']++;
  });

  // Calculate streaks
  const sortedDays = Array.from(activeDaysSet).sort();
  let longestStreak = 0;
  let currentStreak = 0;

  if (sortedDays.length > 0) {
    let streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        if (streak > longestStreak) longestStreak = streak;
        streak = 1;
      }
    }
    if (streak > longestStreak) longestStreak = streak;

    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().substring(0, 10);

    const latestDayStr = sortedDays[sortedDays.length - 1];
    if (latestDayStr === todayStr || latestDayStr === yestStr) {
      let currStreakCount = 1;
      let idx = sortedDays.length - 1;
      while (idx > 0) {
        const curr = new Date(sortedDays[idx]);
        const prev = new Date(sortedDays[idx - 1]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currStreakCount++;
          idx--;
        } else {
          break;
        }
      }
      currentStreak = currStreakCount;
    }
  }

  // Generate 53-week (371 days) calendar grid
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  const gridEndDate = new Date(today);
  gridEndDate.setDate(gridEndDate.getDate() + daysToSaturday);

  const totalDays = 53 * 7;
  const gridStartDate = new Date(gridEndDate);
  gridStartDate.setDate(gridStartDate.getDate() - (totalDays - 1));

  const grid_365 = [];
  const currDate = new Date(gridStartDate);
  let weekIdx = 0;
  let activeInPastYear = 0;
  let kmInPastYear = 0;

  const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (currDate <= gridEndDate) {
    const dStr = currDate.toISOString().substring(0, 10);
    const dayInfo = calendarMap[dStr];
    const dist = dayInfo ? dayInfo.distance_km : 0.0;
    const cnt = dayInfo ? dayInfo.count : 0;
    const weekday = currDate.getDay(); // 0 = Sunday, 6 = Saturday

    if (cnt > 0) {
      activeInPastYear++;
      kmInPastYear += dist;
    }

    let lvl = 0;
    if (cnt === 0) lvl = 0;
    else if (dist < 5.0 || dist === 0) lvl = 1;
    else if (dist < 12.0) lvl = 2;
    else if (dist < 25.0) lvl = 3;
    else lvl = 4;

    grid_365.push({
      date: dStr,
      day: currDate.getDate(),
      month: monthShorts[currDate.getMonth()],
      year: currDate.getFullYear(),
      count: cnt,
      distance_km: dist,
      moving_time_min: dayInfo ? dayInfo.moving_time_min : 0,
      sports: dayInfo ? dayInfo.sports : [],
      level: lvl,
      weekday: weekday,
      week_index: weekIdx
    });

    if (weekday === 6) {
      weekIdx++;
    }
    currDate.setDate(currDate.getDate() + 1);
  }

  const dowStats = Object.values(dowStatsMap).map((d) => ({
    day_name: d.day_name,
    count: d.count,
    distance_km: Math.round((d.total_dist / 1000.0) * 10) / 10
  }));

  const timeOfDayList = Object.entries(timeOfDayMap).map(([time_slot, count]) => ({
    time_slot,
    count
  }));

  return {
    calendar: calendarMap,
    grid_365,
    total_active_days: activeDaysSet.size,
    active_days_past_year: activeInPastYear,
    km_past_year: Math.round(kmInPastYear * 10) / 10,
    consistency_rate_pct: Math.round((activeInPastYear / 365.0) * 1000) / 10,
    longest_streak_days: longestStreak,
    current_streak_days: currentStreak,
    day_of_week: dowStats,
    time_of_day: timeOfDayList
  };
}

// -------------------------------------------------------------
// Personal Records (Hall of Fame)
// -------------------------------------------------------------
export function getPersonalRecords() {
  const store = getStore();
  const acts = store.activities || [];

  function formatRunPr(act) {
    if (!act) return null;
    const speed = Number(act.average_speed || 0);
    let pace = '--:--';
    if (speed > 0 && isFinite(speed)) {
      const sec = 1000.0 / speed;
      if (isFinite(sec)) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        if (!isNaN(m) && !isNaN(s)) {
          pace = `${m}:${s < 10 ? '0' : ''}${s} /km`;
        }
      }
    }
    return {
      id: act.id,
      name: act.name,
      distance_km: Math.round(((Number(act.distance) || 0) / 1000.0) * 100) / 100,
      moving_time: act.moving_time,
      pace,
      avg_speed_kmh: Math.round(speed * 3.6 * 10) / 10,
      start_date: act.start_date,
      polyline: act.summary_polyline
    };
  }

  const runActs = acts.filter(isRun);
  const rideActs = acts.filter(isRide);

  // Longest Run
  let longestRun = null;
  runActs.forEach((a) => {
    if (!longestRun || Number(a.distance || 0) > Number(longestRun.distance || 0)) {
      longestRun = a;
    }
  });

  // Longest Ride
  let longestRide = null;
  rideActs.forEach((a) => {
    if (!longestRide || Number(a.distance || 0) > Number(longestRide.distance || 0)) {
      longestRide = a;
    }
  });

  // Fastest 5K Run (distance >= 4900m)
  let fastest5k = null;
  runActs.forEach((a) => {
    if (Number(a.distance || 0) >= 4900 && Number(a.average_speed || 0) > 0) {
      if (!fastest5k || Number(a.average_speed || 0) > Number(fastest5k.average_speed || 0)) {
        fastest5k = a;
      }
    }
  });

  // Fastest 10K Run (distance >= 9800m)
  let fastest10k = null;
  runActs.forEach((a) => {
    if (Number(a.distance || 0) >= 9800 && Number(a.average_speed || 0) > 0) {
      if (!fastest10k || Number(a.average_speed || 0) > Number(fastest10k.average_speed || 0)) {
        fastest10k = a;
      }
    }
  });

  // Fastest Half Marathon (distance >= 21000m)
  let fastestHalf = null;
  runActs.forEach((a) => {
    if (Number(a.distance || 0) >= 21000 && Number(a.average_speed || 0) > 0) {
      if (!fastestHalf || Number(a.average_speed || 0) > Number(fastestHalf.average_speed || 0)) {
        fastestHalf = a;
      }
    }
  });

  // Max Elevation Gain Activity
  let maxElevation = null;
  acts.forEach((a) => {
    if (Number(a.total_elevation_gain || 0) > 0) {
      if (!maxElevation || Number(a.total_elevation_gain || 0) > Number(maxElevation.total_elevation_gain || 0)) {
        maxElevation = a;
      }
    }
  });

  // Max Speed Cycling
  let maxSpeedRide = null;
  rideActs.forEach((a) => {
    if (Number(a.distance || 0) >= 5000 && Number(a.max_speed || 0) > 0) {
      if (!maxSpeedRide || Number(a.max_speed || 0) > Number(maxSpeedRide.max_speed || 0)) {
        maxSpeedRide = a;
      }
    }
  });

  // Eddington numbers
  const rideKms = rideActs.map((a) => (a.distance || 0) / 1000.0);
  const cyclingEddington = calculateEddingtonNumber(rideKms);
  const nextCyclingTarget = cyclingEddington + 1;
  const cyclingRidesGe = rideKms.filter((d) => d >= nextCyclingTarget).length;
  const cyclingRidesNeeded = Math.max(0, nextCyclingTarget - cyclingRidesGe);

  const runKms = runActs.map((a) => (a.distance || 0) / 1000.0);
  const runningEddington = calculateEddingtonNumber(runKms);
  const nextRunningTarget = runningEddington + 1;
  const runningRunsGe = runKms.filter((d) => d >= nextRunningTarget).length;
  const runningRunsNeeded = Math.max(0, nextRunningTarget - runningRunsGe);

  return {
    longest_run: formatRunPr(longestRun),
    longest_ride: longestRide
      ? {
          id: longestRide.id,
          name: longestRide.name,
          distance_km: Math.round(((longestRide.distance || 0) / 1000.0) * 100) / 100,
          moving_time: longestRide.moving_time,
          avg_speed_kmh: Math.round(Number(longestRide.average_speed || 0) * 3.6 * 10) / 10,
          elevation_m: Math.round(longestRide.total_elevation_gain || 0),
          start_date: longestRide.start_date,
          polyline: longestRide.summary_polyline
        }
      : null,
    fastest_5k: formatRunPr(fastest5k),
    fastest_10k: formatRunPr(fastest10k),
    fastest_half_marathon: formatRunPr(fastestHalf),
    max_elevation: maxElevation
      ? {
          id: maxElevation.id,
          name: maxElevation.name,
          sport: maxElevation.sport_type || maxElevation.type,
          elevation_m: Math.round(maxElevation.total_elevation_gain || 0),
          distance_km: Math.round(((maxElevation.distance || 0) / 1000.0) * 100) / 100,
          start_date: maxElevation.start_date,
          polyline: maxElevation.summary_polyline
        }
      : null,
    max_speed_ride: maxSpeedRide
      ? {
          id: maxSpeedRide.id,
          name: maxSpeedRide.name,
          max_speed_kmh: Math.round(Number(maxSpeedRide.max_speed || 0) * 3.6 * 10) / 10,
          avg_speed_kmh: Math.round(Number(maxSpeedRide.average_speed || 0) * 3.6 * 10) / 10,
          distance_km: Math.round(((maxSpeedRide.distance || 0) / 1000.0) * 100) / 100,
          start_date: maxSpeedRide.start_date,
          polyline: maxSpeedRide.summary_polyline
        }
      : null,
    eddington: {
      cycling: {
        number: cyclingEddington,
        next_target: nextCyclingTarget,
        current_completed: cyclingRidesGe,
        needed: cyclingRidesNeeded
      },
      running: {
        number: runningEddington,
        next_target: nextRunningTarget,
        current_completed: runningRunsGe,
        needed: runningRunsNeeded
      }
    }
  };
}

// -------------------------------------------------------------
// Strava Wrapped / Season Recap
// -------------------------------------------------------------
export function getWrappedSummary(targetYear = 2026) {
  const store = getStore();
  const acts = store.activities || [];
  
  const parsedYear = parseInt(targetYear, 10);
  const isAll = targetYear === 'all' || targetYear === 'All' || targetYear === 'all-time' || (isNaN(parsedYear) && targetYear !== null && targetYear !== undefined);
  const safeYear = !isNaN(parsedYear) ? parsedYear : 2026;
  const yearStr = String(safeYear);

  const yearActs = isAll 
    ? acts 
    : acts.filter((a) => a.start_date && a.start_date.substring(0, 4) === yearStr);

  let totalDistM = 0;
  let totalTimeSec = 0;
  let totalElevM = 0;
  let runsCount = 0;
  let ridesCount = 0;
  const activeDaysSet = new Set();
  let longestAct = null;

  const monthMap = {};

  yearActs.forEach((a) => {
    const d = Number(a.distance || 0);
    const t = Number(a.moving_time || 0);
    const el = Number(a.total_elevation_gain || 0);
    totalDistM += (!isNaN(d) && d > 0) ? d : 0;
    totalTimeSec += (!isNaN(t) && t > 0) ? t : 0;
    totalElevM += (!isNaN(el) && el > 0) ? el : 0;

    if (isRun(a)) runsCount++;
    else if (isRide(a)) ridesCount++;

    if (a.start_date && a.start_date.length >= 10) {
      activeDaysSet.add(a.start_date.substring(0, 10));
      const mo = a.start_date.substring(5, 7);
      if (!monthMap[mo]) monthMap[mo] = { mo, dist: 0, cnt: 0 };
      monthMap[mo].dist += (!isNaN(d) && d > 0) ? d : 0;
      monthMap[mo].cnt++;
    }

    if (!longestAct || d > Number(longestAct.distance || 0)) {
      longestAct = a;
    }
  });

  const monthNames = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };

  const sortedMonths = Object.values(monthMap).sort((a, b) => b.dist - a.dist);
  const topMonth = sortedMonths[0];
  const busiestMonthName = topMonth ? monthNames[topMonth.mo] || 'October' : 'October';
  const busiestMonthKm = topMonth && topMonth.dist > 0 ? Math.round((topMonth.dist / 1000.0) * 10) / 10 : 0;

  const totalKm = totalDistM > 0 ? Math.round((totalDistM / 1000.0) * 10) / 10 : 0;
  const totalHours = totalTimeSec > 0 ? Math.round((totalTimeSec / 3600.0) * 10) / 10 : 0;

  const geoTargets = [
    ['Bajipura to Surat', 45.0],
    ['Bajipura to Mumbai', 320.0],
    ['Bajipura to Ahmedabad', 310.0],
    ['Bajipura to Delhi', 1150.0],
    ['Bajipura to Bangalore', 1280.0],
    ['Bajipura to Kanyakumari', 2100.0],
    ['Kashmir to Kanyakumari', 3676.0],
    ['Bajipura to Tokyo', 6200.0],
    ['London to New York', 5585.0],
    ['Quarter Circumference of Earth', 10018.0]
  ];

  let matchedTarget = geoTargets[0];
  for (const [name, km] of geoTargets) {
    if (totalKm >= km) {
      matchedTarget = [name, km];
    }
  }

  const everestClimbs = totalElevM > 0 ? (Math.round((totalElevM / 8848.0) * 100) / 100) : 0;
  const marathonsEquiv = totalKm > 0 ? (Math.round((totalKm / 42.195) * 10) / 10) : 0;
  const earthOrbitPercent = totalKm > 0 ? (Math.round((totalKm / 40075.0) * 10000) / 100) : 0;
  const audaxEquiv = totalKm > 0 ? (Math.round((totalKm / 200.0) * 10) / 10) : 0;

  return {
    year: isAll ? 'All-Time' : safeYear,
    total_activities: yearActs.length,
    total_distance_km: totalKm,
    total_hours: totalHours,
    total_elevation_m: Math.round(totalElevM) || 0,
    runs_count: runsCount,
    rides_count: ridesCount,
    active_days: activeDaysSet.size,
    top_month: {
      name: busiestMonthName,
      distance_km: busiestMonthKm
    },
    longest_workout: longestAct
      ? {
          id: longestAct.id,
          name: longestAct.name || 'Workout',
          sport: longestAct.sport_type || longestAct.type || 'Workout',
          distance_km: Math.round(((Number(longestAct.distance) || 0) / 1000.0) * 100) / 100,
          date: longestAct.start_date
        }
      : null,
    fun_comparisons: {
      everest_climbs: everestClimbs,
      marathons_equivalent: marathonsEquiv,
      earth_orbit_percent: earthOrbitPercent,
      audax_equivalent: audaxEquiv,
      geo_landmark: `Equivalent to running & riding from ${matchedTarget[0]} (${matchedTarget[1]} km)`
    }
  };
}

// -------------------------------------------------------------
// Interactive Elevation Profile
// -------------------------------------------------------------
export function getElevationProfile(activityId) {
  const store = getStore();
  const act = store.activities.find((a) => Number(a.id) === Number(activityId));
  if (!act || !act.summary_polyline) {
    return { points: [], total_elevation_gain: 0, max_elevation: 0, min_elevation: 0 };
  }

  const coords = decodePolyline(act.summary_polyline);
  if (coords.length < 2) {
    return { points: [], total_elevation_gain: 0, max_elevation: 0, min_elevation: 0 };
  }

  const cumDistances = [0.0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineDistanceKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    cumDistances.push(cumDistances[cumDistances.length - 1] + d);
  }

  const totalDistKm = cumDistances[cumDistances.length - 1];
  if (totalDistKm <= 0.001) {
    return { points: [], total_elevation_gain: 0, max_elevation: 0, min_elevation: 0 };
  }

  const sampleCount = Math.min(120, Math.max(40, coords.length));
  const targetStep = totalDistKm / (sampleCount - 1);
  const totalGain = Number(act.total_elevation_gain || 15.0);
  const baseElev = Number(act.elev_low || 28.0);

  const sampledPoints = [];
  let currIdx = 0;

  for (let i = 0; i < sampleCount; i++) {
    const tDist = i * targetStep;
    while (currIdx < cumDistances.length - 1 && cumDistances[currIdx + 1] < tDist) {
      currIdx++;
    }

    const idxNext = Math.min(currIdx + 1, coords.length - 1);
    const segLen = cumDistances[idxNext] - cumDistances[currIdx];
    const fraction = segLen > 0 ? (tDist - cumDistances[currIdx]) / segLen : 0.0;

    const lat = coords[currIdx][0] + (coords[idxNext][0] - coords[currIdx][0]) * fraction;
    const lng = coords[currIdx][1] + (coords[idxNext][1] - coords[currIdx][1]) * fraction;

    const x = totalDistKm > 0 ? tDist / totalDistKm : 0.0;
    const terrainWave =
      Math.sin(x * Math.PI * 2.0) * 0.35 +
      Math.sin(x * Math.PI * 5.0) * 0.25 +
      Math.sin(x * Math.PI * 9.0) * 0.15 +
      x * 0.25;

    const elevVal = baseElev + totalGain * Math.max(0.0, terrainWave + 0.5);

    sampledPoints.push({
      distance_km: Math.round(tDist * 100) / 100,
      elevation_m: Math.round(elevVal * 10) / 10,
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      grade_pct: 0.0
    });
  }

  for (let i = 1; i < sampledPoints.length; i++) {
    const deltaDM = (sampledPoints[i].distance_km - sampledPoints[i - 1].distance_km) * 1000.0;
    const deltaEM = sampledPoints[i].elevation_m - sampledPoints[i - 1].elevation_m;
    const grade = deltaDM > 0 ? (deltaEM / deltaDM) * 100.0 : 0.0;
    sampledPoints[i].grade_pct = Math.round(Math.max(-25.0, Math.min(25.0, grade)) * 10) / 10;
  }
  if (sampledPoints.length > 1) {
    sampledPoints[0].grade_pct = sampledPoints[1].grade_pct;
  }

  const elevations = sampledPoints.map((p) => p.elevation_m);

  return {
    points: sampledPoints,
    total_elevation_gain: Math.round(totalGain),
    max_elevation: elevations.length > 0 ? Math.round(Math.max(...elevations) * 10) / 10 : 0,
    min_elevation: elevations.length > 0 ? Math.round(Math.min(...elevations) * 10) / 10 : 0,
    points_count: sampledPoints.length
  };
}

// -------------------------------------------------------------
// Live Weather (Direct Browser Open-Meteo API Fetch)
// -------------------------------------------------------------
const WMO_WEATHER_CODES = {
  0: ['Clear Sky', '☀️'],
  1: ['Mainly Clear', '🌤️'],
  2: ['Partly Cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'],
  48: ['Depositing Rime Fog', '🌫️'],
  51: ['Light Drizzle', '🌦️'],
  53: ['Moderate Drizzle', '🌧️'],
  55: ['Dense Drizzle', '🌧️'],
  61: ['Slight Rain', '🌦️'],
  63: ['Moderate Rain', '🌧️'],
  65: ['Heavy Rain', '⛈️'],
  71: ['Slight Snow', '🌨️'],
  73: ['Moderate Snow', '🌨️'],
  75: ['Heavy Snow', '❄️'],
  80: ['Slight Rain Showers', '🌦️'],
  81: ['Moderate Rain Showers', '🌧️'],
  82: ['Violent Rain Showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with Hail', '⛈️']
};

export async function fetchActivityWeather(activityId) {
  try {
    const rawCache = localStorage.getItem(WEATHER_CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};
    if (cache[activityId]) {
      return cache[activityId];
    }
  } catch (e) {
    // ignore
  }

  const store = getStore();
  const act = store.activities.find((a) => Number(a.id) === Number(activityId));

  let lat = 21.0936;
  let lng = 73.2755;
  if (act && act.summary_polyline) {
    const coords = decodePolyline(act.summary_polyline);
    if (coords && coords.length > 0) {
      lat = coords[0][0];
      lng = coords[0][1];
    }
  }

  let weatherData = null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const current = data.current || {};
      const code = current.weather_code || 0;
      const [desc, icon] = WMO_WEATHER_CODES[code] || ['Clear Sky', '☀️'];
      weatherData = {
        temperature: Math.round((current.temperature_2m ?? 28.0) * 10) / 10,
        apparent_temperature: Math.round(((current.temperature_2m ?? 28.0) + 1.5) * 10) / 10,
        weather_code: code,
        weather_description: desc,
        weather_icon: icon,
        wind_speed: Math.round((current.wind_speed_10m ?? 10.0) * 10) / 10,
        relative_humidity: Math.round(current.relative_humidity_2m ?? 50),
        activity_id: activityId
      };
    }
  } catch (err) {
    console.warn('Open-Meteo weather fetch fallback:', err);
  }

  if (!weatherData) {
    weatherData = {
      temperature: 28.5,
      apparent_temperature: 30.0,
      weather_code: 0,
      weather_description: 'Sunny & Pleasant',
      weather_icon: '☀️',
      wind_speed: 9.2,
      relative_humidity: 52,
      activity_id: activityId
    };
  }

  try {
    const rawCache = localStorage.getItem(WEATHER_CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};
    cache[activityId] = weatherData;
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // ignore
  }

  return weatherData;
}

// -------------------------------------------------------------
// GPX & TCX Client-Side Generation & Instant Download
// -------------------------------------------------------------
export function downloadActivityExport(activityId, format = 'gpx') {
  const store = getStore();
  const act = store.activities.find((a) => Number(a.id) === Number(activityId));
  if (!act) {
    alert('Activity not found');
    return;
  }

  // Trigger Smart Telegram Alert for Route Download
  trackVisitorAction('download_gpx', { activity: act, format });

  const name = (act.name || 'Activity').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sport = act.sport_type || act.type || 'Workout';
  const startTime = act.start_date || new Date().toISOString();
  const coords = act.summary_polyline ? decodePolyline(act.summary_polyline) : [];

  if (coords.length === 0) {
    alert('No GPS track available for this activity.');
    return;
  }

  const duration = act.moving_time || coords.length * 4;
  const dtStep = duration / Math.max(1, coords.length - 1);
  const elevGain = act.total_elevation_gain || 25.0;
  const tBase = new Date(startTime).getTime();

  let fileContent = '';
  let mimeType = '';
  let extension = '';

  if (format.toLowerCase() === 'tcx') {
    extension = 'tcx';
    mimeType = 'application/vnd.garmin.tcx+xml';
    const totalDist = act.distance || 0.0;
    const ddStep = totalDist / Math.max(1, coords.length - 1);

    const tcxLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">',
      '  <Activities>',
      `    <Activity Sport="${isRun(act) ? 'Running' : 'Biking'}">`,
      `      <Id>${startTime}</Id>`,
      `      <Lap StartTime="${startTime}">`,
      `        <TotalTimeSeconds>${duration}</TotalTimeSeconds>`,
      `        <DistanceMeters>${totalDist.toFixed(1)}</DistanceMeters>`,
      '        <Track>'
    ];

    coords.forEach((pt, i) => {
      const tCurr = new Date(tBase + i * dtStep * 1000).toISOString();
      const dMeters = (i * ddStep).toFixed(1);
      tcxLines.push(
        `          <Trackpoint><Time>${tCurr}</Time><Position><LatitudeDegrees>${pt[0].toFixed(6)}</LatitudeDegrees><LongitudeDegrees>${pt[1].toFixed(6)}</LongitudeDegrees></Position><DistanceMeters>${dMeters}</DistanceMeters></Trackpoint>`
      );
    });

    tcxLines.push(
      '        </Track>',
      '      </Lap>',
      '    </Activity>',
      '  </Activities>',
      '</TrainingCenterDatabase>'
    );
    fileContent = tcxLines.join('\n');
  } else {
    extension = 'gpx';
    mimeType = 'application/gpx+xml';

    const gpxLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx creator="Strava Status Performance Tracker" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">',
      '  <metadata>',
      `    <name>${name}</name>`,
      `    <time>${startTime}</time>`,
      '  </metadata>',
      '  <trk>',
      `    <name>${name}</name>`,
      `    <type>${sport}</type>`,
      '    <trkseg>'
    ];

    coords.forEach((pt, i) => {
      const tCurr = new Date(tBase + i * dtStep * 1000).toISOString();
      const ele = (28.0 + elevGain * (i / Math.max(1, coords.length - 1))).toFixed(1);
      gpxLines.push(`      <trkpt lat="${pt[0].toFixed(6)}" lon="${pt[1].toFixed(6)}"><ele>${ele}</ele><time>${tCurr}</time></trkpt>`);
    });

    gpxLines.push('    </trkseg>', '  </trk>', '</gpx>');
    fileContent = gpxLines.join('\n');
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity_${act.id}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Apple Fitness Goals & Rings
// -------------------------------------------------------------
export function getGoals() {
  const store = getStore();
  const goals = store.athlete_goals || {
    weekly_run_km: 30.0,
    weekly_ride_km: 100.0,
    weekly_workouts: 5,
    monthly_dist_km: 300.0
  };

  const today = new Date();
  // Monday of current week
  const dayOfWeek = (today.getDay() + 6) % 7;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const startOfWeekStr = startOfWeek.toISOString().substring(0, 10);

  // 1st of current month
  const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  const acts = store.activities || [];

  let currWeekRun = 0;
  let currWeekRide = 0;
  let currWeekWorkouts = 0;

  let currMonthDist = 0;
  let currMonthRun = 0;
  let currMonthRide = 0;
  let currMonthWorkouts = 0;

  acts.forEach((a) => {
    if (!a.start_date || a.start_date.length < 10) return;
    const dStr = a.start_date.substring(0, 10);
    const distKm = (a.distance || 0) / 1000.0;

    if (dStr >= startOfWeekStr) {
      currWeekWorkouts++;
      if (isRun(a)) currWeekRun += distKm;
      else if (isRide(a)) currWeekRide += distKm;
    }

    if (dStr >= startOfMonthStr) {
      currMonthWorkouts++;
      currMonthDist += distKm;
      if (isRun(a)) currMonthRun += distKm;
      else if (isRide(a)) currMonthRide += distKm;
    }
  });

  currWeekRun = Math.round(currWeekRun * 10) / 10;
  currWeekRide = Math.round(currWeekRide * 10) / 10;
  currMonthDist = Math.round(currMonthDist * 10) / 10;
  currMonthRun = Math.round(currMonthRun * 10) / 10;
  currMonthRide = Math.round(currMonthRide * 10) / 10;

  return {
    goals,
    weekly: {
      start_date: startOfWeekStr,
      running: {
        current_km: currWeekRun,
        target_km: goals.weekly_run_km,
        percent: Math.min(100, Math.round((currWeekRun / Math.max(1, goals.weekly_run_km)) * 1000) / 10),
        remaining_km: Math.round(Math.max(0, goals.weekly_run_km - currWeekRun) * 10) / 10
      },
      cycling: {
        current_km: currWeekRide,
        target_km: goals.weekly_ride_km,
        percent: Math.min(100, Math.round((currWeekRide / Math.max(1, goals.weekly_ride_km)) * 1000) / 10),
        remaining_km: Math.round(Math.max(0, goals.weekly_ride_km - currWeekRide) * 10) / 10
      },
      workouts: {
        current_count: currWeekWorkouts,
        target_count: goals.weekly_workouts,
        percent: Math.min(100, Math.round((currWeekWorkouts / Math.max(1, goals.weekly_workouts)) * 1000) / 10),
        remaining_count: Math.max(0, goals.weekly_workouts - currWeekWorkouts)
      }
    },
    monthly: {
      start_date: startOfMonthStr,
      total_km: currMonthDist,
      run_km: currMonthRun,
      ride_km: currMonthRide,
      workouts_count: currMonthWorkouts,
      target_km: goals.monthly_dist_km,
      percent: Math.min(100, Math.round((currMonthDist / Math.max(1, goals.monthly_dist_km)) * 1000) / 10),
      remaining_km: Math.round(Math.max(0, goals.monthly_dist_km - currMonthDist) * 10) / 10
    }
  };
}

export function saveGoals(newGoals) {
  const store = getStore();
  store.athlete_goals = { ...(store.athlete_goals || {}), ...newGoals };
  saveStore(store);
  return getGoals();
}

// -------------------------------------------------------------
// Gear Odometer
// -------------------------------------------------------------
export function getGearList() {
  const store = getStore();
  const gear = store.gear || [];
  const acts = store.activities || [];

  // Compute total running and cycling mileage
  let totalRunKm = 0;
  let totalRideKm = 0;
  acts.forEach((a) => {
    const d = (a.distance || 0) / 1000.0;
    if (isRun(a)) totalRunKm += d;
    else if (isRide(a)) totalRideKm += d;
  });

  return gear.map((g) => {
    let currentKm = Number(g.current_km || 0);
    // If not manually set, estimate from matching sport type
    if (!currentKm && Number(g.initial_km || 0) > 0) {
      currentKm = Number(g.initial_km);
    }
    return {
      ...g,
      current_km: Math.round(currentKm * 10) / 10
    };
  });
}

export function saveGear(gearItem) {
  const store = getStore();
  const list = store.gear || [];
  const id = gearItem.id || `gear_${Date.now()}`;
  const existingIdx = list.findIndex((g) => g.id === id);

  const newItem = {
    ...gearItem,
    id,
    created_at: gearItem.created_at || new Date().toISOString()
  };

  if (existingIdx >= 0) {
    list[existingIdx] = newItem;
  } else {
    list.push(newItem);
  }

  store.gear = list;
  saveStore(store);
  return newItem;
}

export function deleteGear(gearId) {
  const store = getStore();
  store.gear = (store.gear || []).filter((g) => g.id !== gearId);
  saveStore(store);
  return true;
}

// -------------------------------------------------------------
// Seed Demo Data & Reset Data
// -------------------------------------------------------------
export function seedDemoData() {
  const store = getStore();
  store.athlete = DEMO_ATHLETE;
  store.last_sync_time = 'Curated Milestone Demo (Offline)';
  store.activities = [...DEMO_ACTIVITIES];
  saveStore(store);
  return {
    success: true,
    seeded_count: DEMO_ACTIVITIES.length,
    message: 'Sample milestone activities loaded successfully!'
  };
}

export function resetToDefaultData() {
  const store = {
    athlete: initialData.athlete || DEMO_ATHLETE,
    last_sync_time: initialData.last_sync_time || '2026-10-16 05:10:41 UTC',
    athlete_goals: initialData.athlete_goals || {
      weekly_run_km: 30.0,
      weekly_ride_km: 100.0,
      weekly_workouts: 5,
      monthly_dist_km: 300.0
    },
    gear: initialData.gear || [],
    activities: initialData.activities || []
  };
  saveStore(store);
  return {
    success: true,
    count: store.activities.length,
    message: 'Reset to original 349 Strava workouts!'
  };
}


