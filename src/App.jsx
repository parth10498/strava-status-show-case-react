import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthBanner from './components/AuthBanner';
import HeroStats from './components/HeroStats';
import DateFilterBar from './components/DateFilterBar';
import RunningSection from './components/RunningSection';
import CyclingSection from './components/CyclingSection';
import OtherSportsSection from './components/OtherSportsSection';
import YearlyMonthlySection from './components/YearlyMonthlySection';
import RouteExplorer from './components/RouteExplorer';
import ActivitiesList from './components/ActivitiesList';
import RouteMapModal from './components/RouteMapModal';
import AllActivityHeatmap from './components/AllActivityHeatmap';
import TrainingConsistency from './components/TrainingConsistency';
import HallOfFame from './components/HallOfFame';
import GearManager from './components/GearManager';
import StravaWrappedModal from './components/StravaWrappedModal';
import { 
  getSystemStatus, 
  calculateStats, 
  seedDemoData 
} from './services/stravaDataService';
import { initVisitorTracking } from './services/visitorTrackingService';
import './App.css';

export default function App() {
  const [status, setStatus] = useState({ 
    is_authenticated: true, 
    athlete: null, 
    last_sync_time: null, 
    total_activities: 0 
  });
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('running');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Date filtering state
  const [dateFilter, setDateFilter] = useState({
    year: null,
    month: null,
    startDate: null,
    endDate: null,
    preset: 'all'
  });

  // Modals state
  const [selectedActivityForMap, setSelectedActivityForMap] = useState(null);
  const [showWrappedModal, setShowWrappedModal] = useState(false);
  const [heatmapSport, setHeatmapSport] = useState('all');

  const handleOpenHeatmap = (sport = 'all') => {
    setHeatmapSport(sport);
    setActiveTab('heatmap');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Load stats with active date filters directly from client-side service
  const loadStatsWithFilter = useCallback((filterObj = dateFilter) => {
    try {
      const currentStatus = getSystemStatus();
      const currentStats = calculateStats(filterObj);
      setStatus(currentStatus);
      setStats(currentStats);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  // Handle filter changes from DateFilterBar or YearlyMonthlySection
  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    loadStatsWithFilter(newFilter);
  };

  // Helper when clicking a specific year in YearlyMonthlySection
  const handleSelectYear = (yr) => {
    const newFilter = {
      year: yr,
      month: null,
      startDate: null,
      endDate: null,
      preset: 'dropdown'
    };
    setDateFilter(newFilter);
    loadStatsWithFilter(newFilter);
  };

  // Helper when clicking a specific month in YearlyMonthlySection
  const handleSelectMonth = (yr, mo) => {
    const newFilter = {
      year: yr,
      month: mo,
      startDate: null,
      endDate: null,
      preset: 'dropdown'
    };
    setDateFilter(newFilter);
    loadStatsWithFilter(newFilter);
  };

  useEffect(() => {
    loadStatsWithFilter();
  }, [loadStatsWithFilter]);

  // Initialize visitor tracking
  useEffect(() => {
    initVisitorTracking();
  }, []);

  // Handle Sync / Refresh
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      loadStatsWithFilter();
      setRefreshTrigger(t => t + 1);
      setSyncing(false);
      setNotification({ type: 'success', text: '✨ Dashboard synced with local storage dataset!' });
      setTimeout(() => setNotification(null), 4000);
    }, 400);
  };

  // Handle Seed Demo Data
  const handleSeedDemo = () => {
    try {
      const res = seedDemoData();
      if (res.success) {
        setNotification({ 
          type: 'success', 
          text: `🚀 Loaded sample milestone activities demonstrating 5k, 10k, 15k, 21k runs & 20k-200k cycling!` 
        });
        loadStatsWithFilter();
        setRefreshTrigger(t => t + 1);
        setTimeout(() => setNotification(null), 6000);
      }
    } catch (err) {
      alert('Failed to seed demo data.');
    }
  };

  // Handle Connect Strava
  const handleConnect = () => {
    handleSeedDemo();
  };

  const runningCount = stats?.running?.count || 0;
  const cyclingCount = stats?.cycling?.count || 0;
  const otherCount = stats?.other_sports?.total_count || 0;
  const availableYears = stats?.available_years || [2026];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div 
          className="glass-card" 
          style={{
            padding: '14px 20px',
            marginBottom: '20px',
            borderLeft: `4px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '10px'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{notification.text}</span>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar 
        athlete={status.athlete}
        isAuth={status.is_authenticated}
        syncing={syncing}
        onSync={handleSync}
        onConnect={handleConnect}
        onSeedDemo={handleSeedDemo}
        lastSyncTime={status.last_sync_time}
        onOpenWrapped={() => setShowWrappedModal(true)}
      />

      {/* Auth Banner if no activities */}
      <AuthBanner 
        isAuth={status.is_authenticated}
        onConnect={handleConnect}
        onSeedDemo={handleSeedDemo}
        totalActivities={status.total_activities}
      />

      {/* Date & Period Filter Bar */}
      <DateFilterBar 
        availableYears={availableYears}
        currentFilter={dateFilter}
        onFilterChange={handleDateFilterChange}
        totalMatching={stats?.overall?.total_activities}
      />

      {/* Hero Stats */}
      <HeroStats 
        overall={stats?.overall}
        runningCount={runningCount}
        cyclingCount={cyclingCount}
        otherCount={otherCount}
      />

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn run-tab ${activeTab === 'running' ? 'active' : ''}`}
          onClick={() => setActiveTab('running')}
        >
          <span>🏃 Running</span>
          <span className="tab-pill">{runningCount}</span>
        </button>

        <button 
          className={`tab-btn ride-tab ${activeTab === 'cycling' ? 'active' : ''}`}
          onClick={() => setActiveTab('cycling')}
        >
          <span>🚴 Cycling</span>
          <span className="tab-pill">{cyclingCount}</span>
        </button>

        <button 
          className={`tab-btn map-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => {
            setHeatmapSport('all');
            setActiveTab('heatmap');
          }}
        >
          <span>🗺️ Heatmap</span>
          <span className="tab-pill">{stats?.overall?.total_activities || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'consistency' ? 'active' : ''}`}
          onClick={() => setActiveTab('consistency')}
        >
          <span>📅 Consistency &amp; Goals</span>
          <span className="tab-pill">365d</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'halloffame' ? 'active' : ''}`}
          onClick={() => setActiveTab('halloffame')}
        >
          <span>🏆 Trophies &amp; PRs</span>
          <span className="tab-pill">25 Badges</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'gear' ? 'active' : ''}`}
          onClick={() => setActiveTab('gear')}
        >
          <span>👟 Gear Odometer</span>
          <span className="tab-pill">Shoes/Bikes</span>
        </button>

        <button 
          className={`tab-btn map-tab ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <span>🗺️ Route Explorer</span>
          <span className="tab-pill">Leaflet</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => setActiveTab('other')}
        >
          <span>✨ Other Sports</span>
          <span className="tab-pill">{otherCount}</span>
        </button>

        <button 
          className={`tab-btn analytics-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span>📊 Year &amp; Month Stats</span>
          <span className="tab-pill">{availableYears.length} yrs</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <span>📋 Workout Feed</span>
          <span className="tab-pill">{stats?.overall?.total_activities || status.total_activities}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'running' && (
          <RunningSection 
            running={stats?.running} 
            onViewHeatmap={() => handleOpenHeatmap('run')}
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)}
          />
        )}

        {activeTab === 'cycling' && (
          <CyclingSection 
            cycling={stats?.cycling} 
            onViewHeatmap={() => handleOpenHeatmap('ride')}
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)}
          />
        )}

        {activeTab === 'heatmap' && (
          <AllActivityHeatmap 
            initialSport={heatmapSport}
            onSportChange={(sp) => setHeatmapSport(sp)}
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)} 
          />
        )}

        {activeTab === 'consistency' && (
          <TrainingConsistency />
        )}

        {activeTab === 'halloffame' && (
          <HallOfFame 
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)} 
          />
        )}

        {activeTab === 'gear' && (
          <GearManager />
        )}

        {activeTab === 'other' && (
          <OtherSportsSection 
            otherSports={stats?.other_sports} 
            allSportsBreakdown={stats?.all_sports_breakdown} 
            onViewHeatmap={() => handleOpenHeatmap('other')}
          />
        )}

        {activeTab === 'analytics' && (
          <YearlyMonthlySection 
            yearlyBreakdown={stats?.yearly_breakdown || []}
            monthlyBreakdown={stats?.monthly_breakdown || {}}
            availableYears={availableYears}
            onSelectYear={handleSelectYear}
            onSelectMonth={handleSelectMonth}
          />
        )}

        {activeTab === 'routes' && (
          <RouteExplorer 
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)}
            externalFilter={dateFilter}
            onViewHeatmap={(sp) => handleOpenHeatmap(sp || 'all')}
          />
        )}

        {activeTab === 'feed' && (
          <ActivitiesList 
            refreshTrigger={refreshTrigger}
            onSelectActivityForMap={(act) => setSelectedActivityForMap(act)}
            externalFilter={dateFilter}
          />
        )}
      </main>

      {/* Interactive Leaflet Route Map Modal */}
      {selectedActivityForMap && (
        <RouteMapModal 
          activity={selectedActivityForMap}
          athlete={status.athlete}
          onClose={() => setSelectedActivityForMap(null)}
        />
      )}
      {/* Strava Wrapped Annual Story Modal */}
      {showWrappedModal && (
        <StravaWrappedModal
          year={dateFilter?.year || 2026}
          athlete={status.athlete}
          onClose={() => setShowWrappedModal(false)}
        />
      )}

      {/* Footer */}
      <footer style={{ marginTop: '50px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <p>Built with Pure React &amp; Leaflet OpenStreetMap • Personal Strava Analytics</p>
      </footer>
    </div>
  );
}
