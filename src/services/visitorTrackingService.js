/**
 * Visitor Tracking & Telegram Notification Service
 * 
 * Fetches visitor details using IP geolocation + browser telemetry
 * and sends formatted visitor analytics alerts & smart action alerts to Telegram.
 */

import { formatDuration } from '../utils/polyline.js';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8796752002:AAHHKJODKDs9d4lvL0hXikAOiG3UhcxFVFk';
const ENV_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '675436492';

const STORAGE_KEYS = {
  TOTAL_VISITS: 'strava_total_visits',
  LAST_VISIT_TIME: 'strava_last_visit_time',
  VISITOR_ID: 'strava_visitor_id',
  CACHED_CHAT_ID: 'strava_telegram_chat_id',
  SESSION_NOTIFIED: 'strava_session_notified',
  MUTED_UNTIL: 'strava_telegram_muted_until',
  IP_CACHE: 'strava_visitor_ip_cache',
  LAST_UPDATE_ID: 'strava_telegram_last_update_id'
};

// In-memory cache for IP details
let inMemoryIpCache = null;

/**
 * Check if notifications are currently muted
 */
export function isMuted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTED_UNTIL);
    if (!raw) return false;
    const until = Number(raw);
    if (!isNaN(until) && Date.now() < until) {
      return true;
    }
    localStorage.removeItem(STORAGE_KEYS.MUTED_UNTIL);
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Generate or retrieve a persistent anonymous visitor ID
 */
function getVisitorId() {
  let vid = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
  if (!vid) {
    vid = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.VISITOR_ID, vid);
  }
  return vid;
}

/**
 * Update visit counters and return visit statistics
 */
export function recordVisit() {
  const visitorId = getVisitorId();
  const rawVisits = localStorage.getItem(STORAGE_KEYS.TOTAL_VISITS);
  const totalVisits = (parseInt(rawVisits, 10) || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.TOTAL_VISITS, totalVisits.toString());

  const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT_TIME);
  const nowIso = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.LAST_VISIT_TIME, nowIso);

  const isReturning = Boolean(rawVisits && parseInt(rawVisits, 10) > 0);

  return {
    visitorId,
    totalVisits,
    isReturning,
    lastVisitDate: lastVisit ? new Date(lastVisit).toLocaleString() : 'First recorded visit'
  };
}

/**
 * Parse client device, OS, browser, and hardware info
 */
export function getClientEnvironment() {
  if (typeof window === 'undefined') {
    return {
      os: 'Unknown',
      browser: 'Unknown',
      deviceType: 'Desktop 💻',
      screenRes: '1920x1080',
      viewport: '1440x900',
      pixelRatio: '1x',
      language: 'en',
      connectionType: 'Standard',
      pageUrl: '',
      referrer: 'Direct'
    };
  }

  const ua = navigator.userAgent || '';
  
  // OS Detection
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10 / 11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser Detection
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';

  // Device Form Factor
  let deviceType = 'Desktop 💻';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'Tablet 📟';
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated/i.test(ua)) {
    deviceType = 'Mobile 📱';
  }

  // Screen & Display
  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const pixelRatio = window.devicePixelRatio ? `${window.devicePixelRatio}x` : '1x';

  // Language & Connection
  const language = navigator.language || navigator.userLanguage || 'Unknown';
  const connectionType = navigator.connection?.effectiveType ? `${navigator.connection.effectiveType.toUpperCase()} (${navigator.connection.type || 'network'})` : 'Standard';

  return {
    os,
    browser,
    deviceType,
    screenRes,
    viewport,
    pixelRatio,
    language,
    connectionType,
    userAgent: ua,
    pageUrl: window.location.href,
    referrer: document.referrer || 'Direct / Bookmark'
  };
}

/**
 * Fetch visitor geographic and network details using public IP APIs with fallback
 */
export async function fetchIpDetails() {
  // Strategy 1: ipapi.co (detailed, reliable)
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && !data.error) {
        return {
          ip: data.ip,
          city: data.city || 'Unknown City',
          region: data.region || 'Unknown Region',
          regionCode: data.region_code || '',
          country: data.country_name || 'Unknown Country',
          countryCode: data.country_code || '',
          postal: data.postal || 'N/A',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone || 'UTC',
          isp: data.org || data.asn || 'Unknown Provider',
          asn: data.asn || 'N/A',
          currency: data.currency ? `${data.currency} (${data.currency_name || ''})` : 'N/A',
          callingCode: data.country_calling_code || '',
          source: 'ipapi.co'
        };
      }
    }
  } catch (err) {
    console.warn('[VisitorTracker] ipapi.co query failed, trying secondary fallback:', err.message);
  }

  // Strategy 2: ipwho.is (CORS friendly, fast fallback)
  try {
    const res = await fetch('https://ipwho.is/', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.ip) {
        return {
          ip: data.ip,
          city: data.city || 'Unknown City',
          region: data.region || 'Unknown Region',
          regionCode: data.region_code || '',
          country: data.country || 'Unknown Country',
          countryCode: data.country_code || '',
          postal: data.postal || 'N/A',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone?.id || 'UTC',
          isp: data.connection?.isp || data.connection?.org || 'Unknown Provider',
          asn: data.connection?.asn ? `AS${data.connection.asn}` : 'N/A',
          currency: data.currency ? `${data.currency.code || ''} (${data.currency.name || ''})` : 'N/A',
          callingCode: data.calling_code ? `+${data.calling_code}` : '',
          source: 'ipwho.is'
        };
      }
    }
  } catch (err) {
    console.warn('[VisitorTracker] ipwho.is fallback failed:', err.message);
  }

  // Strategy 3: basic ipify fallback if both geolocation APIs fail
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip,
        city: 'Surat',
        region: 'Gujarat',
        country: 'India',
        countryCode: 'IN',
        postal: 'N/A',
        latitude: 21.1702,
        longitude: 72.8311,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        isp: 'Standard ISP',
        source: 'ipify'
      };
    }
  } catch (err) {
    console.error('[VisitorTracker] All IP discovery methods failed:', err);
  }

  return {
    ip: 'Unknown IP',
    city: 'Surat',
    region: 'Gujarat',
    country: 'India',
    countryCode: 'IN',
    postal: 'N/A',
    latitude: 21.1702,
    longitude: 72.8311,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    isp: 'Unknown ISP',
    source: 'offline/fallback'
  };
}

/**
 * Cached IP retrieval for instant sub-second trigger dispatch
 */
export async function getOrFetchIpDetails() {
  if (inMemoryIpCache) return inMemoryIpCache;

  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.IP_CACHE);
    if (sessionRaw) {
      inMemoryIpCache = JSON.parse(sessionRaw);
      return inMemoryIpCache;
    }
  } catch (e) {}

  inMemoryIpCache = await fetchIpDetails();
  try {
    sessionStorage.setItem(STORAGE_KEYS.IP_CACHE, JSON.stringify(inMemoryIpCache));
  } catch (e) {}
  return inMemoryIpCache;
}

/**
 * Synchronize mute and command updates from Telegram bot
 */
export async function syncMuteState(botToken = BOT_TOKEN) {
  if (!botToken) return isMuted();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=25`, {
      cache: 'no-cache'
    });
    const json = await res.json();

    if (!json.ok || !Array.isArray(json.result)) {
      return isMuted();
    }

    let maxUpdateId = null;

    for (const update of json.result) {
      if (update.update_id) {
        maxUpdateId = Math.max(maxUpdateId || 0, update.update_id);
      }

      // 1. Handle Inline Button callback query ("🔕 Mute for 2 hours")
      if (update.callback_query) {
        const cq = update.callback_query;
        if (cq.data === 'mute_2h') {
          const muteDurationMs = 2 * 60 * 60 * 1000;
          const mutedUntil = Date.now() + muteDurationMs;
          localStorage.setItem(STORAGE_KEYS.MUTED_UNTIL, mutedUntil.toString());

          // Answer callback query with native toast banner
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: cq.id,
                text: '🔕 Smart alerts muted for 2 hours!',
                show_alert: false
              })
            });
          } catch (e) {}

          // Send confirmation message to the chat
          try {
            const untilTimeStr = new Date(mutedUntil).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit'
            });
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: cq.message?.chat?.id || cq.from?.id,
                text: `🔕 <b>Smart Alerts Muted for 2 Hours</b>\n\nVisitor alerts are paused until <b>${untilTimeStr}</b>.\n\nType <code>/unmute</code> anytime to resume notifications early.`,
                parse_mode: 'HTML'
              })
            });
          } catch (e) {}
        }
      }

      // 2. Handle Text Commands (/mute, /unmute, /status)
      if (update.message && update.message.text) {
        const text = update.message.text.trim().toLowerCase();
        const chatId = update.message.chat?.id;

        if (chatId) {
          localStorage.setItem(STORAGE_KEYS.CACHED_CHAT_ID, chatId.toString());
        }

        if (text === '/mute' || text === '/mute_2h' || text === '/mute 2h') {
          const mutedUntil = Date.now() + 2 * 60 * 60 * 1000;
          localStorage.setItem(STORAGE_KEYS.MUTED_UNTIL, mutedUntil.toString());
          const untilTimeStr = new Date(mutedUntil).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          });
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🔕 <b>Alerts Muted for 2 Hours</b>\n\nVisitor alerts paused until <b>${untilTimeStr}</b>.\nType <code>/unmute</code> to re-enable alerts.`,
                parse_mode: 'HTML'
              })
            });
          } catch (e) {}
        } else if (text === '/unmute') {
          localStorage.removeItem(STORAGE_KEYS.MUTED_UNTIL);
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🔔 <b>Alerts Resumed</b>\n\nSmart visitor alerts are active! You will receive notifications for site visits, route inspections, Season Wrapped, and GPX downloads.`,
                parse_mode: 'HTML'
              })
            });
          } catch (e) {}
        }
      }
    }

    // Acknowledge update stream to avoid reprocessing
    if (maxUpdateId) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${maxUpdateId + 1}`);
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[VisitorTracker] Non-critical error syncing Telegram updates:', err.message);
  }

  return isMuted();
}

/**
 * Query Telegram getUpdates to automatically detect chat_id
 */
export async function detectChatId(botToken = BOT_TOKEN) {
  if (!botToken) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
      cache: 'no-cache'
    });
    const json = await res.json();

    if (json.ok && Array.isArray(json.result) && json.result.length > 0) {
      for (let i = json.result.length - 1; i >= 0; i--) {
        const item = json.result[i];
        const chat = item.message?.chat || item.my_chat_member?.chat || item.callback_query?.message?.chat;
        if (chat && chat.id) {
          const foundId = chat.id.toString();
          localStorage.setItem(STORAGE_KEYS.CACHED_CHAT_ID, foundId);
          console.log('[VisitorTracker] Successfully detected Telegram Chat ID:', foundId);
          return foundId;
        }
      }
    }
  } catch (err) {
    console.warn('[VisitorTracker] Unable to detect Telegram chat ID via getUpdates:', err);
  }
  return null;
}

/**
 * Get active Telegram Chat ID from environment, localStorage cache, or auto-detection
 */
export async function getActiveChatId() {
  if (ENV_CHAT_ID) return ENV_CHAT_ID;
  const cached = localStorage.getItem(STORAGE_KEYS.CACHED_CHAT_ID);
  if (cached) return cached;
  return await detectChatId();
}

/**
 * Convert ISO 2-letter country code into flag emoji
 */
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Build Interactive Inline Telegram Buttons for all alerts
 * [📍 Open in Google Maps]
 * [🏃‍♂️ View Parth's Strava]
 * [🔕 Mute for 2 hours]
 */
export function buildInlineKeyboard(ipData) {
  const lat = Number(ipData?.latitude);
  const lng = Number(ipData?.longitude);
  const hasGps = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const mapsUrl = hasGps
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ipData?.city, ipData?.region, ipData?.country].filter(Boolean).join(', ') || 'Surat, Gujarat, India')}`;

  const stravaUrl = 'https://www.strava.com/athletes/69326795';

  return {
    inline_keyboard: [
      [
        {
          text: '📍 Open in Google Maps',
          url: mapsUrl
        }
      ],
      [
        {
          text: "🏃‍♂️ View Parth's Strava",
          url: stravaUrl
        }
      ],
      [
        {
          text: '🔕 Mute for 2 hours',
          callback_data: 'mute_2h'
        }
      ]
    ]
  };
}

/**
 * Format HTML Telegram notification message with all visitor & IP details
 */
export function buildTelegramMessage(visitStats, ipData, clientEnv) {
  const flag = getCountryFlag(ipData.countryCode);
  const now = new Date();
  const timeString = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: ipData.timezone && ipData.timezone !== 'UTC' ? ipData.timezone : undefined
  });

  const mapsUrl = (ipData.latitude && ipData.longitude)
    ? `https://www.google.com/maps?q=${ipData.latitude},${ipData.longitude}`
    : null;

  const visitorTag = visitStats.isReturning 
    ? `🔄 <b>Returning Visitor</b> (Visit #${visitStats.totalVisits})`
    : `✨ <b>New First-Time Visitor</b>`;

  return `
🏃‍♂️ <b>STRAVA DASHBOARD — VISITOR ALERT</b>
━━━━━━━━━━━━━━━━━━━━━
${visitorTag}
📊 <b>Total Site Visits:</b> <code>${visitStats.totalVisits}</code>
🆔 <b>Visitor ID:</b> <code>${visitStats.visitorId}</code>

🌐 <b>NETWORK & IP DETAILS</b>
• <b>IP Address:</b> <code>${ipData.ip}</code>
• <b>Location:</b> ${flag} <b>${ipData.city}</b>, ${ipData.region ? ipData.region + ', ' : ''}${ipData.country} ${ipData.countryCode ? `(${ipData.countryCode})` : ''}
• <b>Postal / PIN:</b> <code>${ipData.postal || 'N/A'}</code>
• <b>ISP / Carrier:</b> ${ipData.isp}
• <b>ASN:</b> <code>${ipData.asn || 'N/A'}</code>
• <b>Timezone:</b> ${ipData.timezone}
• <b>Local Time:</b> ${timeString}
${mapsUrl ? `• 📍 <b>GPS Coordinates:</b> <a href="${mapsUrl}">${ipData.latitude}, ${ipData.longitude} (Open in Maps)</a>` : ''}

💻 <b>DEVICE & CLIENT SPECS</b>
• <b>Device:</b> ${clientEnv.deviceType}
• <b>Operating System:</b> <b>${clientEnv.os}</b>
• <b>Browser:</b> <b>${clientEnv.browser}</b>
• <b>Screen Resolution:</b> <code>${clientEnv.screenRes}</code> (Viewport: ${clientEnv.viewport})
• <b>Pixel Ratio:</b> ${clientEnv.pixelRatio}
• <b>Language:</b> ${clientEnv.language}
• <b>Network Speed:</b> ${clientEnv.connectionType}

🔗 <b>TRAFFIC CONTEXT</b>
• <b>Page:</b> <code>${clientEnv.pageUrl}</code>
• <b>Referrer:</b> <i>${clientEnv.referrer}</i>
━━━━━━━━━━━━━━━━━━━━━
🕒 <i>Timestamp: ${new Date().toUTCString()}</i>
`.trim();
}

/**
 * Format Smart Action Alerts for high-intent interactions:
 * - Route playback inspection
 * - Season Wrapped storyboard open
 * - GPX / TCX route download
 */
export function buildActionAlertMessage(actionType, actionData, ipData, clientEnv, visitStats) {
  const flag = getCountryFlag(ipData.countryCode);
  const city = ipData?.city && ipData.city !== 'Unknown' && ipData.city !== 'Unknown City' ? ipData.city : 'Surat';
  const locationStr = `${flag} <b>${ipData.city || 'Surat'}</b>, ${ipData.region ? ipData.region + ', ' : ''}${ipData.country || 'India'}`;
  const now = new Date();
  const timeString = now.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: ipData.timezone && ipData.timezone !== 'UTC' ? ipData.timezone : undefined
  });

  if (actionType === 'route_playback') {
    const act = actionData?.activity || {};
    const rawDist = Number(act.distance);
    const distKm = (!isNaN(rawDist) && rawDist > 0) ? (rawDist / 1000).toFixed(1) : '21.1';
    const name = act.name || 'Half Marathon';
    const sport = act.sport_type || act.type || 'Run';
    const timeFormatted = act.moving_time ? formatDuration(act.moving_time) : '1h 45m';
    const elev = Math.round(Number(act.total_elevation_gain) || 0);

    const headline = `Visitor from ${city} is inspecting your ${distKm} km ${name} route!`;

    return `
🗺️ <b>ROUTE PLAYBACK INSPECTION ALERT</b>
━━━━━━━━━━━━━━━━━━━━━
👀 <i>"${headline}"</i>

🏃‍♂️ <b>Route Inspected:</b> <b>${name}</b>
📊 <b>Sport:</b> ${sport} | 📏 <b>Distance:</b> <code>${distKm} km</code>
⏱️ <b>Moving Time:</b> <code>${timeFormatted}</code> | ⛰️ <b>Elevation:</b> <code>+${elev}m</code>

👤 <b>VISITOR INTELLIGENCE:</b>
• <b>Location:</b> ${locationStr}
• <b>IP Address:</b> <code>${ipData.ip}</code>
• <b>ISP / Carrier:</b> ${ipData.isp}
• <b>Device:</b> ${clientEnv.deviceType} (${clientEnv.os} • ${clientEnv.browser})
• <b>Local Time:</b> ${timeString}
━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Smart Real-Time Trigger</i>
`.trim();
  }

  if (actionType === 'season_wrapped') {
    const year = actionData?.year || 2026;
    const headline = `Visitor from ${city} opened your ${year} Strava Wrapped Story!`;

    return `
🎁 <b>SEASON WRAPPED STORYBOARD ALERT</b>
━━━━━━━━━━━━━━━━━━━━━
✨ <i>"${headline}"</i>

🎉 <b>Action:</b> Exploring Interactive ${year} Season Recap Storyboard
👤 <b>VISITOR INTELLIGENCE:</b>
• <b>Location:</b> ${locationStr}
• <b>IP Address:</b> <code>${ipData.ip}</code>
• <b>ISP / Carrier:</b> ${ipData.isp}
• <b>Device:</b> ${clientEnv.deviceType} (${clientEnv.os} • ${clientEnv.browser})
• <b>Local Time:</b> ${timeString}
━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Smart Real-Time Trigger</i>
`.trim();
  }

  if (actionType === 'download_gpx') {
    const act = actionData?.activity || {};
    const format = (actionData?.format || 'gpx').toUpperCase();
    const rawDist = Number(act.distance);
    const distKm = (!isNaN(rawDist) && rawDist > 0) ? (rawDist / 1000).toFixed(1) : '';
    const name = act.name || 'Route';
    const sport = act.sport_type || act.type || 'Workout';

    const distPart = distKm ? `${distKm} km ` : '';
    const headline = `Visitor from ${city} downloaded the ${format} route for ${distPart}${name}!`;

    return `
📥 <b>GPS ROUTE DOWNLOAD ALERT</b>
━━━━━━━━━━━━━━━━━━━━━
🚀 <i>"${headline}"</i>

📂 <b>File Exported:</b> <code>${format} GPS Route</code>
🗺️ <b>Activity:</b> <b>${name}</b> (${sport})
${distKm ? `📏 <b>Distance:</b> <code>${distKm} km</code>\n` : ''}👤 <b>VISITOR INTELLIGENCE:</b>
• <b>Location:</b> ${locationStr}
• <b>IP Address:</b> <code>${ipData.ip}</code>
• <b>ISP / Carrier:</b> ${ipData.isp}
• <b>Device:</b> ${clientEnv.deviceType} (${clientEnv.os} • ${clientEnv.browser})
• <b>Local Time:</b> ${timeString}
━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Smart Real-Time Trigger</i>
`.trim();
  }

  return `⚡ <b>VISITOR ACTION ALERT:</b> ${actionType}`;
}

/**
 * Dispatch a Smart Action Alert to Telegram (Route playback, Season Wrapped, GPX download)
 */
export async function trackVisitorAction(actionType, actionData = {}, options = {}) {
  const { force = false } = options;

  // 1. Check if alerts are muted
  if (isMuted() && !force) {
    console.log('[VisitorTracker] Smart alerts are muted. Skipping action alert:', actionType);
    return { success: false, reason: 'muted' };
  }

  // 2. Action Throttling per session to prevent spam
  if (!force) {
    let throttleKey = null;
    if (actionType === 'route_playback') {
      const actId = actionData?.activity?.id || 'default';
      throttleKey = `strava_alert_playback_${actId}`;
    } else if (actionType === 'season_wrapped') {
      throttleKey = `strava_alert_wrapped`;
    } else if (actionType === 'download_gpx') {
      const actId = actionData?.activity?.id || actionData?.activityId || 'default';
      const fmt = actionData?.format || 'gpx';
      throttleKey = `strava_alert_dl_${actId}_${fmt}`;
    }

    if (throttleKey) {
      const lastSent = sessionStorage.getItem(throttleKey);
      if (lastSent && Date.now() - Number(lastSent) < 15 * 60 * 1000) {
        console.log(`[VisitorTracker] Action '${actionType}' throttled for session (sent < 15 min ago).`);
        return { success: false, reason: 'throttled' };
      }
      sessionStorage.setItem(throttleKey, Date.now().toString());
    }
  }

  // 3. Gather visitor context (uses cached IP for instant dispatch)
  const visitStats = recordVisit();
  const clientEnv = getClientEnvironment();
  const ipData = await getOrFetchIpDetails();

  // 4. Resolve Chat ID
  const chatId = await getActiveChatId();
  if (!chatId) {
    return { success: false, reason: 'missing_chat_id' };
  }

  // 5. Build message text and interactive buttons
  const messageText = buildActionAlertMessage(actionType, actionData, ipData, clientEnv, visitStats);
  const replyMarkup = buildInlineKeyboard(ipData);

  // 6. Send to Telegram
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: replyMarkup
      })
    });

    const result = await res.json();
    if (result.ok) {
      console.log(`[VisitorTracker] Smart Alert for '${actionType}' sent successfully to Telegram!`);
      return { success: true, result };
    } else {
      console.error('[VisitorTracker] Telegram error on action alert:', result);
      return { success: false, error: result };
    }
  } catch (err) {
    console.error(`[VisitorTracker] Failed to send '${actionType}' alert:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Send the visitor alert message to Telegram
 */
export async function sendTelegramNotification(options = {}) {
  const { force = false } = options;

  if (isMuted() && !force) {
    console.log('[VisitorTracker] Alerts currently muted, skipping site visit notification.');
    return { success: false, reason: 'muted' };
  }

  // Session throttle: Avoid blasting the user with notifications on every hot reload or refresh
  if (!force) {
    const sessionSent = sessionStorage.getItem(STORAGE_KEYS.SESSION_NOTIFIED);
    if (sessionSent) {
      console.log('[VisitorTracker] Visit alert already sent for this browser session. Pass force=true to bypass.');
      return { success: false, reason: 'throttled_session' };
    }
  }

  // 1. Gather all visitor data
  const visitStats = recordVisit();
  const clientEnv = getClientEnvironment();
  const ipData = await getOrFetchIpDetails();

  // 2. Identify chat ID
  let chatId = await getActiveChatId();

  if (!chatId) {
    return {
      success: false,
      reason: 'missing_chat_id'
    };
  }

  // 3. Construct Telegram HTML payload & inline buttons
  const messageText = buildTelegramMessage(visitStats, ipData, clientEnv);
  const replyMarkup = buildInlineKeyboard(ipData);

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: replyMarkup
      })
    });

    const result = await res.json();
    if (result.ok) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_NOTIFIED, Date.now().toString());
      console.log('[VisitorTracker] Telegram notification sent successfully!', {
        chatId,
        totalVisits: visitStats.totalVisits,
        ip: ipData.ip,
        city: ipData.city
      });
      return { success: true, result, visitStats, ipData };
    } else {
      console.error('[VisitorTracker] Telegram API returned error:', result);
      return { success: false, error: result };
    }
  } catch (err) {
    console.error('[VisitorTracker] Failed to send Telegram alert:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize visitor tracking automatically on site load
 */
export function initVisitorTracking() {
  if (typeof window === 'undefined') return;

  // Make manual test helper available in browser console: window.testTelegramAlert()
  window.testTelegramAlert = () => sendTelegramNotification({ force: true });
  window.testActionAlert = (type = 'route_playback', data = {}) => trackVisitorAction(type, data, { force: true });
  window.detectTelegramBot = () => detectChatId();

  // 1. Record visit count in local storage without sending notification
  try {
    recordVisit();
  } catch (e) {
    // Ignore storage issues
  }

  // 2. Check mute state on start
  syncMuteState().catch(() => {});

  // 3. Automatically sync mute status when the user switches back to browser tab
  window.addEventListener('focus', () => {
    syncMuteState().catch(() => {});
  });

  // 4. Periodic background sync (every 45s) while page is open
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncMuteState().catch(() => {});
    }
  }, 45000);
}
