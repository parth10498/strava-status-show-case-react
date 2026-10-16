/**
 * Trophy & Achievement Badges Engine
 * 
 * Analyzes all activities to evaluate athlete milestones, speed achievements,
 * climbing peaks, streaks, and dedication badges.
 */

// Format pace helper (min/km)
function formatPace(secondsPerKm) {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s < 10 ? '0' : ''}${s} /km`;
}

// Calculate Athlete Level from total XP
export function getAthleteLevel(xp) {
  if (xp >= 1000) return { level: 10, title: 'Immortal Legend', icon: '👑', next: null, min: 1000 };
  if (xp >= 800) return { level: 9, title: 'Endurance Master', icon: '💎', next: 1000, min: 800 };
  if (xp >= 650) return { level: 8, title: 'Grandmaster Athlete', icon: '🎖️', next: 800, min: 650 };
  if (xp >= 500) return { level: 7, title: 'Elite Centurion', icon: '🏆', next: 650, min: 500 };
  if (xp >= 380) return { level: 6, title: 'Trailblazer', icon: '⚡', next: 500, min: 380 };
  if (xp >= 260) return { level: 5, title: 'Road Warrior', icon: '🔥', next: 380, min: 260 };
  if (xp >= 160) return { level: 4, title: 'Seasoned Runner', icon: '🏃', next: 260, min: 160 };
  if (xp >= 80) return { level: 3, title: 'Active Challenger', icon: '🚴', next: 160, min: 80 };
  if (xp >= 30) return { level: 2, title: 'Rising Contender', icon: '🥉', next: 80, min: 30 };
  return { level: 1, title: 'Novice Explorer', icon: '🌱', next: 30, min: 0 };
}

/**
 * Evaluate all badges against an activities array
 */
export function calculateBadges(activities = []) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return {
      badges: [],
      totalXp: 0,
      maxXp: 0,
      unlockedCount: 0,
      totalCount: 0,
      levelInfo: getAthleteLevel(0)
    };
  }

  // Pre-filter sports
  const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');
  const rides = activities.filter(a => a.type === 'Ride' || a.sport_type === 'Ride');

  // Max distances
  const maxRunKm = runs.reduce((m, a) => Math.max(m, (a.distance || 0) / 1000), 0);
  const maxRideKm = rides.reduce((m, a) => Math.max(m, (a.distance || 0) / 1000), 0);
  const maxElevSingle = activities.reduce((m, a) => Math.max(m, a.total_elevation_gain || 0), 0);
  const maxSpeedKmh = activities.reduce((m, a) => Math.max(m, (a.max_speed || 0) * 3.6), 0);

  // Totals
  const totalKmAll = activities.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const totalElevAll = activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
  const totalRunKm = runs.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const totalRideKm = rides.reduce((s, a) => s + (a.distance || 0) / 1000, 0);

  // Consecutive active day streak calculation
  const uniqueDates = Array.from(new Set(
    activities.map(a => (a.start_date_local || a.start_date || '').split('T')[0]).filter(Boolean)
  )).sort();

  let maxStreakDays = uniqueDates.length > 0 ? 1 : 0;
  let currStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      currStreak++;
      if (currStreak > maxStreakDays) maxStreakDays = currStreak;
    } else {
      currStreak = 1;
    }
  }

  // Fast 5K Pace calculation
  let best5kPaceSec = 99999;
  let best5kActivity = null;
  runs.forEach(a => {
    const km = (a.distance || 0) / 1000;
    if (km >= 4.8 && a.moving_time > 0) {
      const paceSec = a.moving_time / km;
      if (paceSec < best5kPaceSec) {
        best5kPaceSec = paceSec;
        best5kActivity = a;
      }
    }
  });

  // Fast ride (avg speed >= 28 km/h for >= 15 km)
  let bestFastRide = null;
  rides.forEach(a => {
    const km = (a.distance || 0) / 1000;
    const avgKmh = (a.average_speed || 0) * 3.6;
    if (km >= 15 && avgKmh >= 28) {
      if (!bestFastRide || avgKmh > (bestFastRide.average_speed * 3.6)) {
        bestFastRide = a;
      }
    }
  });

  // Early morning (4:30 AM to 6:30 AM)
  const earlyWorkouts = activities.filter(a => {
    const d = new Date(a.start_date_local || a.start_date);
    const m = d.getHours() * 60 + d.getMinutes();
    return m >= (4 * 60 + 30) && m <= (6 * 60 + 30);
  });

  // Night owl (After 8:00 PM or before 4:00 AM)
  const nightWorkouts = activities.filter(a => {
    const d = new Date(a.start_date_local || a.start_date);
    const h = d.getHours();
    return h >= 20 || h < 4;
  });

  // Weekend warrior calculation (active Sat & Sun in same weekend)
  const weekendsMap = new Map();
  activities.forEach(a => {
    const d = new Date(a.start_date_local || a.start_date);
    const day = d.getDay(); // 0 Sun, 6 Sat
    if (day === 0 || day === 6) {
      const year = d.getFullYear();
      // Approx week number
      const oneJan = new Date(year, 0, 1);
      const weekNum = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
      const key = `${year}-W${weekNum}`;
      if (!weekendsMap.has(key)) weekendsMap.set(key, { sat: false, sun: false, act: a });
      if (day === 6) weekendsMap.get(key).sat = true;
      if (day === 0) weekendsMap.get(key).sun = true;
    }
  });
  let weekendWarriorMatches = 0;
  let weekendSampleAct = null;
  weekendsMap.forEach(v => {
    if (v.sat && v.sun) {
      weekendWarriorMatches++;
      if (!weekendSampleAct) weekendSampleAct = v.act;
    }
  });

  // Helper to find qualifying activity for distance
  const findQualifying = (list, minKm) => list.find(a => ((a.distance || 0) / 1000) >= minKm);
  const findElevQualifying = (minElev) => activities.find(a => (a.total_elevation_gain || 0) >= minElev);

  // -------------------------------------------------------------
  // BADGES DEFINITION CATALOG
  // -------------------------------------------------------------
  const definitions = [
    // RUNNING DISTANCES
    {
      id: 'run_5k',
      title: '5K Finisher',
      desc: 'Complete any running workout of at least 5.0 km.',
      category: 'running',
      tier: 'bronze',
      xp: 20,
      icon: '🥉',
      accent: '#f97316',
      unlocked: maxRunKm >= 5.0,
      qualifying: findQualifying(runs, 5.0),
      progress: { current: maxRunKm, target: 5.0, unit: 'km', pct: Math.min(100, Math.round((maxRunKm / 5.0) * 100)) }
    },
    {
      id: 'run_10k',
      title: '10K Crusher',
      desc: 'Break the double-digit barrier with a 10.0+ km run.',
      category: 'running',
      tier: 'silver',
      xp: 40,
      icon: '🥈',
      accent: '#fb923c',
      unlocked: maxRunKm >= 10.0,
      qualifying: findQualifying(runs, 10.0),
      progress: { current: maxRunKm, target: 10.0, unit: 'km', pct: Math.min(100, Math.round((maxRunKm / 10.0) * 100)) }
    },
    {
      id: 'run_15k',
      title: '15K Long Stride',
      desc: 'Push endurance deep into the pain cave with a 15.0+ km run.',
      category: 'running',
      tier: 'silver',
      xp: 60,
      icon: '🎖️',
      accent: '#fdba74',
      unlocked: maxRunKm >= 15.0,
      qualifying: findQualifying(runs, 15.0),
      progress: { current: maxRunKm, target: 15.0, unit: 'km', pct: Math.min(100, Math.round((maxRunKm / 15.0) * 100)) }
    },
    {
      id: 'run_half',
      title: 'Half Marathon Finisher',
      desc: 'Conquer the official 21.097 km half-marathon distance.',
      category: 'running',
      tier: 'gold',
      xp: 100,
      icon: '🥇',
      accent: '#f59e0b',
      unlocked: maxRunKm >= 21.097,
      qualifying: findQualifying(runs, 21.097),
      progress: { current: maxRunKm, target: 21.1, unit: 'km', pct: Math.min(100, Math.round((maxRunKm / 21.1) * 100)) }
    },
    {
      id: 'run_marathon',
      title: 'Marathon Legend',
      desc: 'The holy grail of road endurance: complete a full 42.195 km marathon.',
      category: 'running',
      tier: 'diamond',
      xp: 150,
      icon: '👑',
      accent: '#e11d48',
      unlocked: maxRunKm >= 42.195,
      qualifying: findQualifying(runs, 42.195),
      progress: { current: maxRunKm, target: 42.2, unit: 'km', pct: Math.min(100, Math.round((maxRunKm / 42.2) * 100)) }
    },

    // CYCLING DISTANCES
    {
      id: 'ride_25k',
      title: '25K Smooth Roller',
      desc: 'Spin through a solid 25.0+ km cycling tour.',
      category: 'cycling',
      tier: 'bronze',
      xp: 20,
      icon: '🚴',
      accent: '#06b6d4',
      unlocked: maxRideKm >= 25.0,
      qualifying: findQualifying(rides, 25.0),
      progress: { current: maxRideKm, target: 25.0, unit: 'km', pct: Math.min(100, Math.round((maxRideKm / 25.0) * 100)) }
    },
    {
      id: 'ride_50k',
      title: 'Half Century (50K)',
      desc: 'Pedal past 50.0 km in a single endurance ride.',
      category: 'cycling',
      tier: 'silver',
      xp: 50,
      icon: '🥈',
      accent: '#0ea5e9',
      unlocked: maxRideKm >= 50.0,
      qualifying: findQualifying(rides, 50.0),
      progress: { current: maxRideKm, target: 50.0, unit: 'km', pct: Math.min(100, Math.round((maxRideKm / 50.0) * 100)) }
    },
    {
      id: 'ride_100k',
      title: 'Metric Century (100K)',
      desc: 'The cyclist milestone: break into the triple digits with a 100+ km ride.',
      category: 'cycling',
      tier: 'gold',
      xp: 100,
      icon: '🥇',
      accent: '#38bdf8',
      unlocked: maxRideKm >= 100.0,
      qualifying: findQualifying(rides, 100.0),
      progress: { current: maxRideKm, target: 100.0, unit: 'km', pct: Math.min(100, Math.round((maxRideKm / 100.0) * 100)) }
    },
    {
      id: 'ride_200k',
      title: 'Double Century Brevet (200K)',
      desc: 'The ultra-distance club: cover 200.0+ km in a single monumental brevet.',
      category: 'cycling',
      tier: 'diamond',
      xp: 150,
      icon: '💎',
      accent: '#a855f7',
      unlocked: maxRideKm >= 200.0,
      qualifying: findQualifying(rides, 200.0),
      progress: { current: maxRideKm, target: 200.0, unit: 'km', pct: Math.min(100, Math.round((maxRideKm / 200.0) * 100)) }
    },

    // SPEED & PERFORMANCE
    {
      id: 'speed_sub5',
      title: 'Sub-5 Pace Club',
      desc: 'Run a 5K workout with an average pace faster than 5:00 /km.',
      category: 'speed',
      tier: 'gold',
      xp: 75,
      icon: '⚡',
      accent: '#eab308',
      unlocked: best5kPaceSec <= 300,
      qualifying: best5kPaceSec <= 300 ? best5kActivity : null,
      progress: { 
        current: best5kPaceSec < 99999 ? formatPace(best5kPaceSec) : '--:--', 
        target: '5:00 /km', 
        unit: '', 
        pct: best5kPaceSec <= 300 ? 100 : Math.max(0, Math.round((300 / Math.max(300, best5kPaceSec)) * 100)) 
      }
    },
    {
      id: 'speed_mach45',
      title: 'Mach 45 Speedster',
      desc: 'Hit a maximum recorded speed of at least 45.0 km/h.',
      category: 'speed',
      tier: 'silver',
      xp: 40,
      icon: '🚀',
      accent: '#ec4899',
      unlocked: maxSpeedKmh >= 45.0,
      qualifying: activities.find(a => (a.max_speed || 0) * 3.6 >= 45.0),
      progress: { current: maxSpeedKmh.toFixed(1), target: '45.0', unit: 'km/h', pct: Math.min(100, Math.round((maxSpeedKmh / 45.0) * 100)) }
    },
    {
      id: 'speed_rocket_ride',
      title: 'Aero Rocket Ride',
      desc: 'Maintain a 28.0+ km/h average speed over a 15+ km bike workout.',
      category: 'speed',
      tier: 'gold',
      xp: 75,
      icon: '🏎️',
      accent: '#f43f5e',
      unlocked: Boolean(bestFastRide),
      qualifying: bestFastRide,
      progress: { 
        current: bestFastRide ? ((bestFastRide.average_speed || 0) * 3.6).toFixed(1) : '24.2', 
        target: '28.0', 
        unit: 'km/h', 
        pct: bestFastRide ? 100 : 86 
      }
    },

    // CLIMBING & ELEVATION
    {
      id: 'climb_hill',
      title: 'Hill Grinder (100m+)',
      desc: 'Ascend over 100 meters of elevation in a single workout.',
      category: 'climbing',
      tier: 'bronze',
      xp: 25,
      icon: '🧗',
      accent: '#10b981',
      unlocked: maxElevSingle >= 100,
      qualifying: findElevQualifying(100),
      progress: { current: Math.round(maxElevSingle), target: 100, unit: 'm', pct: Math.min(100, Math.round((maxElevSingle / 100) * 100)) }
    },
    {
      id: 'climb_goat',
      title: 'Mountain Goat (250m+)',
      desc: 'Conquer serious gradients with 250+ meters of elevation gain in one session.',
      category: 'climbing',
      tier: 'silver',
      xp: 50,
      icon: '🏔️',
      accent: '#059669',
      unlocked: maxElevSingle >= 250,
      qualifying: findElevQualifying(250),
      progress: { current: Math.round(maxElevSingle), target: 250, unit: 'm', pct: Math.min(100, Math.round((maxElevSingle / 250) * 100)) }
    },
    {
      id: 'climb_high_altitude',
      title: 'High Altitude Beast (450m+)',
      desc: 'Sky-high elevation: claim over 450 meters of vertical climb in a single ride.',
      category: 'climbing',
      tier: 'gold',
      xp: 90,
      icon: '🌋',
      accent: '#8b5cf6',
      unlocked: maxElevSingle >= 450,
      qualifying: findElevQualifying(450),
      progress: { current: Math.round(maxElevSingle), target: 450, unit: 'm', pct: Math.min(100, Math.round((maxElevSingle / 450) * 100)) }
    },
    {
      id: 'climb_everest_base',
      title: 'Everest Basecamp Cumulative',
      desc: 'Accumulate over 5,000 meters of total vertical elevation.',
      category: 'climbing',
      tier: 'diamond',
      xp: 120,
      icon: '⛰️',
      accent: '#6366f1',
      unlocked: totalElevAll >= 5000,
      qualifying: null,
      progress: { current: Math.round(totalElevAll), target: 5000, unit: 'm', pct: Math.min(100, Math.round((totalElevAll / 5000) * 100)) }
    },

    // STREAKS & CONSISTENCY
    {
      id: 'streak_hat_trick',
      title: 'Hat-Trick (3 Days)',
      desc: 'Maintain momentum with activities on 3 consecutive days.',
      category: 'streaks',
      tier: 'bronze',
      xp: 20,
      icon: '🔥',
      accent: '#f97316',
      unlocked: maxStreakDays >= 3,
      qualifying: null,
      progress: { current: maxStreakDays, target: 3, unit: 'days', pct: Math.min(100, Math.round((maxStreakDays / 3) * 100)) }
    },
    {
      id: 'streak_7_day',
      title: '7-Day Iron Streak',
      desc: 'Unstoppable consistency: log workouts for 7 consecutive days.',
      category: 'streaks',
      tier: 'silver',
      xp: 50,
      icon: '⚡',
      accent: '#eab308',
      unlocked: maxStreakDays >= 7,
      qualifying: null,
      progress: { current: maxStreakDays, target: 7, unit: 'days', pct: Math.min(100, Math.round((maxStreakDays / 7) * 100)) }
    },
    {
      id: 'streak_30_day',
      title: '30-Day Relentless',
      desc: 'A full month of non-stop dedication: active on 30 consecutive days.',
      category: 'streaks',
      tier: 'diamond',
      xp: 120,
      icon: '🛡️',
      accent: '#a855f7',
      unlocked: maxStreakDays >= 30,
      qualifying: null,
      progress: { current: maxStreakDays, target: 30, unit: 'days', pct: Math.min(100, Math.round((maxStreakDays / 30) * 100)) }
    },

    // LIFESTYLE & DEDICATION
    {
      id: 'life_early_bird',
      title: 'Dawn Patrol (Early Bird)',
      desc: 'Rise before the sun: start a workout between 4:30 AM and 6:30 AM.',
      category: 'lifestyle',
      tier: 'silver',
      xp: 35,
      icon: '🌅',
      accent: '#f59e0b',
      unlocked: earlyWorkouts.length > 0,
      qualifying: earlyWorkouts[0] || null,
      progress: { current: earlyWorkouts.length, target: 1, unit: 'early runs', pct: earlyWorkouts.length > 0 ? 100 : 0 }
    },
    {
      id: 'life_night_owl',
      title: 'Night Owl Crusher',
      desc: 'Dominate under streetlights: start a workout after 8:00 PM.',
      category: 'lifestyle',
      tier: 'bronze',
      xp: 25,
      icon: '🌙',
      accent: '#38bdf8',
      unlocked: nightWorkouts.length > 0,
      qualifying: nightWorkouts[0] || null,
      progress: { current: nightWorkouts.length, target: 1, unit: 'night sessions', pct: nightWorkouts.length > 0 ? 100 : 0 }
    },
    {
      id: 'life_weekend_warrior',
      title: 'Weekend Warrior',
      desc: 'Active on both Saturday AND Sunday in the same weekend.',
      category: 'lifestyle',
      tier: 'silver',
      xp: 45,
      icon: '🏖️',
      accent: '#14b8a6',
      unlocked: weekendWarriorMatches > 0,
      qualifying: weekendSampleAct,
      progress: { current: weekendWarriorMatches, target: 1, unit: 'weekends', pct: weekendWarriorMatches > 0 ? 100 : 0 }
    },
    {
      id: 'total_centurion_100',
      title: 'Century Workouts (100+)',
      desc: 'Join the centurion club by recording 100 total lifetime workouts.',
      category: 'lifestyle',
      tier: 'gold',
      xp: 80,
      icon: '💯',
      accent: '#06b6d4',
      unlocked: activities.length >= 100,
      qualifying: activities[99] || null,
      progress: { current: activities.length, target: 100, unit: 'activities', pct: Math.min(100, Math.round((activities.length / 100) * 100)) }
    },
    {
      id: 'total_triple_century',
      title: '300 Club (Triple Century)',
      desc: 'Massive milestone: reach 300+ total recorded workouts.',
      category: 'lifestyle',
      tier: 'diamond',
      xp: 140,
      icon: '🏆',
      accent: '#ec4899',
      unlocked: activities.length >= 300,
      qualifying: activities[299] || null,
      progress: { current: activities.length, target: 300, unit: 'activities', pct: Math.min(100, Math.round((activities.length / 300) * 100)) }
    },
    {
      id: 'total_distance_2500',
      title: '2,500 KM Endurance Titan',
      desc: 'Cover over 2,500 total kilometers across running and cycling.',
      category: 'lifestyle',
      tier: 'diamond',
      xp: 150,
      icon: '🌍',
      accent: '#10b981',
      unlocked: totalKmAll >= 2500,
      qualifying: null,
      progress: { current: Math.round(totalKmAll), target: 2500, unit: 'km', pct: Math.min(100, Math.round((totalKmAll / 2500) * 100)) }
    }
  ];

  // Calculate totals
  const totalXp = definitions.filter(b => b.unlocked).reduce((sum, b) => sum + b.xp, 0);
  const maxXp = definitions.reduce((sum, b) => sum + b.xp, 0);
  const unlockedCount = definitions.filter(b => b.unlocked).length;

  return {
    badges: definitions,
    totalXp,
    maxXp,
    unlockedCount,
    totalCount: definitions.length,
    levelInfo: getAthleteLevel(totalXp)
  };
}
