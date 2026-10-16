/**
 * Map Tile Service
 * Manages map tile providers, CARTO API key storage, and free watermark-free dark basemaps.
 */

export const DEFAULT_CARTO_API_KEY = 'cb1_4maj_1_d43a2ca735bbda304d2547e4';

export const getCartoApiKey = () => {
  if (typeof window === 'undefined') return DEFAULT_CARTO_API_KEY;
  return localStorage.getItem('carto_api_key') || import.meta.env.VITE_CARTO_API_KEY || DEFAULT_CARTO_API_KEY;
};

export const setCartoApiKey = (key) => {
  if (typeof window === 'undefined') return;
  const cleanKey = (key || '').trim();
  if (!cleanKey) {
    localStorage.removeItem('carto_api_key');
  } else {
    localStorage.setItem('carto_api_key', cleanKey);
  }
};

export const getBasemapProviders = (cartoKey = getCartoApiKey()) => {
  const keyParam = cartoKey ? `?key=${cartoKey}` : '';

  return {
    dark: {
      id: 'dark',
      name: '🌌 CARTO Dark Matter (Recommended)',
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    },
    dark_nolabels: {
      id: 'dark_nolabels',
      name: '✨ CARTO Dark Minimal',
      url: `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png${keyParam}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    },
    voyager: {
      id: 'voyager',
      name: '☀️ CARTO Voyager Light',
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    },
    osm_dark: {
      id: 'osm_dark',
      name: '🌙 Midnight Dark (No Key Needed)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      className: 'leaflet-tile-dark',
      maxZoom: 19
    },
    esri_dark: {
      id: 'esri_dark',
      name: '🌑 Esri Dark Canvas',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    },
    osm: {
      id: 'osm',
      name: '🗺️ OpenStreetMap Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    }
  };
};
