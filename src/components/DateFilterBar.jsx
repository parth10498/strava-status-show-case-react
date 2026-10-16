import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X, ChevronDown, Clock, Check, RotateCcw } from 'lucide-react';

const MONTH_NAMES = [
  { code: 1, name: 'January', short: 'Jan' },
  { code: 2, name: 'February', short: 'Feb' },
  { code: 3, name: 'March', short: 'Mar' },
  { code: 4, name: 'April', short: 'Apr' },
  { code: 5, name: 'May', short: 'May' },
  { code: 6, name: 'June', short: 'Jun' },
  { code: 7, name: 'July', short: 'Jul' },
  { code: 8, name: 'August', short: 'Aug' },
  { code: 9, name: 'September', short: 'Sep' },
  { code: 10, name: 'October', short: 'Oct' },
  { code: 11, name: 'November', short: 'Nov' },
  { code: 12, name: 'December', short: 'Dec' },
];

export default function DateFilterBar({ 
  availableYears = [2026], 
  currentFilter = {}, 
  onFilterChange,
  totalMatching = null
}) {
  const [selectedYear, setSelectedYear] = useState(currentFilter.year || '');
  const [selectedMonth, setSelectedMonth] = useState(currentFilter.month || '');
  const [startDate, setStartDate] = useState(currentFilter.startDate || '');
  const [endDate, setEndDate] = useState(currentFilter.endDate || '');
  const [preset, setPreset] = useState(currentFilter.preset || 'all');
  const [showCustomRange, setShowCustomRange] = useState(preset === 'custom');

  // Keep internal state aligned if parent filter changes externally
  useEffect(() => {
    setSelectedYear(currentFilter.year || '');
    setSelectedMonth(currentFilter.month || '');
    setStartDate(currentFilter.startDate || '');
    setEndDate(currentFilter.endDate || '');
    setPreset(currentFilter.preset || 'all');
    setShowCustomRange(currentFilter.preset === 'custom');
  }, [currentFilter]);

  const handlePresetClick = (presetKey) => {
    setPreset(presetKey);
    const now = new Date();
    const currentYear = now.getFullYear();

    if (presetKey === 'all') {
      setSelectedYear('');
      setSelectedMonth('');
      setStartDate('');
      setEndDate('');
      setShowCustomRange(false);
      onFilterChange({ year: null, month: null, startDate: null, endDate: null, preset: 'all' });
    } else if (presetKey === 'this_year') {
      const yr = availableYears.includes(currentYear) ? currentYear : (availableYears[0] || 2026);
      setSelectedYear(yr);
      setSelectedMonth('');
      setStartDate('');
      setEndDate('');
      setShowCustomRange(false);
      onFilterChange({ year: yr, month: null, startDate: null, endDate: null, preset: 'this_year' });
    } else if (presetKey === 'last_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const start = d.toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setSelectedYear('');
      setSelectedMonth('');
      setStartDate(start);
      setEndDate(end);
      setShowCustomRange(false);
      onFilterChange({ year: null, month: null, startDate: start, endDate: end, preset: 'last_30' });
    } else if (presetKey === 'last_90') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      const start = d.toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setSelectedYear('');
      setSelectedMonth('');
      setStartDate(start);
      setEndDate(end);
      setShowCustomRange(false);
      onFilterChange({ year: null, month: null, startDate: start, endDate: end, preset: 'last_90' });
    } else if (presetKey === 'custom') {
      setShowCustomRange(true);
    }
  };

  const handleYearChange = (e) => {
    const yr = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedYear(yr || '');
    setPreset('dropdown');
    setShowCustomRange(false);
    onFilterChange({ 
      year: yr, 
      month: selectedMonth ? parseInt(selectedMonth, 10) : null, 
      startDate: null, 
      endDate: null, 
      preset: 'dropdown' 
    });
  };

  const handleMonthChange = (e) => {
    const mo = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedMonth(mo || '');
    setPreset('dropdown');
    setShowCustomRange(false);
    onFilterChange({ 
      year: selectedYear ? parseInt(selectedYear, 10) : null, 
      month: mo, 
      startDate: null, 
      endDate: null, 
      preset: 'dropdown' 
    });
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!startDate && !endDate) return;
    setPreset('custom');
    onFilterChange({
      year: null,
      month: null,
      startDate: startDate || null,
      endDate: endDate || null,
      preset: 'custom'
    });
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    setPreset('all');
    setShowCustomRange(false);
    onFilterChange({ year: null, month: null, startDate: null, endDate: null, preset: 'all' });
  };

  const isFiltered = preset !== 'all' || selectedYear || selectedMonth || startDate || endDate;

  // Build active filter label
  let filterSummary = 'All Time Stats';
  if (preset === 'this_year') {
    filterSummary = `This Year (${selectedYear || 'Active Year'})`;
  } else if (preset === 'last_30') {
    filterSummary = 'Past 30 Days';
  } else if (preset === 'last_90') {
    filterSummary = 'Past 90 Days';
  } else if (preset === 'custom' && (startDate || endDate)) {
    filterSummary = `Custom Range: ${startDate || 'Start'} → ${endDate || 'Latest'}`;
  } else if (selectedYear && selectedMonth) {
    const mObj = MONTH_NAMES.find(m => m.code === parseInt(selectedMonth, 10));
    filterSummary = `${mObj?.name || 'Month ' + selectedMonth} ${selectedYear}`;
  } else if (selectedYear) {
    filterSummary = `Year ${selectedYear}`;
  } else if (selectedMonth) {
    const mObj = MONTH_NAMES.find(m => m.code === parseInt(selectedMonth, 10));
    filterSummary = `Every ${mObj?.name || 'Month ' + selectedMonth} (All Years)`;
  }

  return (
    <div className="date-filter-bar glass-card">
      <div className="date-filter-top">
        {/* Left: Section Label & Active Tag */}
        <div className="filter-headline">
          <div className="filter-badge-icon">
            <Calendar size={18} />
          </div>
          <div>
            <div className="filter-heading">Date &amp; Period Filter</div>
            <div className="filter-subheading">
              Currently viewing: <strong className="filter-active-highlight">{filterSummary}</strong>
            </div>
          </div>
        </div>

        {/* Right: Reset Action if filtered */}
        {isFiltered && (
          <button 
            className="filter-reset-btn" 
            onClick={handleReset}
            title="Reset filters to All Time"
          >
            <RotateCcw size={13} />
            <span>Reset to All Time</span>
          </button>
        )}
      </div>

      {/* Quick Preset Buttons */}
      <div className="filter-controls-row">
        <div className="filter-presets-group">
          <button 
            className={`preset-pill ${preset === 'all' && !selectedYear && !selectedMonth ? 'active' : ''}`}
            onClick={() => handlePresetClick('all')}
          >
            All Time
          </button>

          <button 
            className={`preset-pill ${preset === 'this_year' ? 'active' : ''}`}
            onClick={() => handlePresetClick('this_year')}
          >
            This Year (2026)
          </button>

          <button 
            className={`preset-pill ${preset === 'last_30' ? 'active' : ''}`}
            onClick={() => handlePresetClick('last_30')}
          >
            Last 30 Days
          </button>

          <button 
            className={`preset-pill ${preset === 'last_90' ? 'active' : ''}`}
            onClick={() => handlePresetClick('last_90')}
          >
            Last 90 Days
          </button>

          <button 
            className={`preset-pill ${preset === 'custom' || showCustomRange ? 'active' : ''}`}
            onClick={() => handlePresetClick('custom')}
          >
            Custom Range...
          </button>
        </div>

        {/* Year and Month Dropdowns */}
        <div className="filter-dropdowns-group">
          {/* Year Select */}
          <div className="select-wrapper">
            <span className="select-prefix">Year:</span>
            <select 
              value={selectedYear} 
              onChange={handleYearChange}
              className="filter-select"
            >
              <option value="">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>

          {/* Month Select */}
          <div className="select-wrapper">
            <span className="select-prefix">Month:</span>
            <select 
              value={selectedMonth} 
              onChange={handleMonthChange}
              className="filter-select"
            >
              <option value="">All Months</option>
              {MONTH_NAMES.map(m => (
                <option key={m.code} value={m.code}>{m.short} - {m.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
        </div>
      </div>

      {/* Collapsible Custom Date Range Picker */}
      {showCustomRange && (
        <form onSubmit={handleApplyCustomRange} className="custom-range-drawer">
          <div className="custom-range-inputs">
            <div className="date-input-field">
              <label>From Date:</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="date-picker-input"
              />
            </div>

            <div className="date-input-field">
              <label>To Date:</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="date-picker-input"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              <Check size={14} />
              <span>Apply Range</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowCustomRange(false)}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
