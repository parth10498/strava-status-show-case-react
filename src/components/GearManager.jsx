import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, RefreshCw } from 'lucide-react';

import { getGearList, saveGear, deleteGear } from '../services/stravaDataService';

export default function GearManager() {
  const [gearList, setGearList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'shoe', 'bike'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGear, setEditingGear] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    gear_type: 'shoe',
    brand: '',
    model: '',
    current_km: 0,
    target_km: 800,
    notes: ''
  });

  const loadGear = () => {
    try {
      const data = getGearList();
      setGearList(data || []);
    } catch (err) {
      console.error('Failed to load gear:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGear();
  }, []);

  const handleOpenAdd = () => {
    setEditingGear(null);
    setFormData({
      name: '',
      gear_type: 'shoe',
      brand: '',
      model: '',
      current_km: 0,
      target_km: 800,
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingGear(item);
    setFormData({
      name: item.name,
      gear_type: item.gear_type,
      brand: item.brand || '',
      model: item.model || '',
      current_km: item.current_km || 0,
      target_km: item.target_km || (item.gear_type === 'shoe' ? 800 : 5000),
      notes: item.notes || ''
    });
    setShowAddModal(true);
  };

  const handleSaveGear = (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        id: editingGear ? editingGear.id : undefined,
        current_km: parseFloat(formData.current_km) || 0,
        target_km: parseFloat(formData.target_km) || (formData.gear_type === 'shoe' ? 800 : 5000)
      };

      saveGear(payload);
      setShowAddModal(false);
      loadGear();
    } catch {
      alert('Could not save gear item.');
    }
  };

  const handleDeleteGear = (id) => {
    if (!window.confirm('Are you sure you want to delete this gear entry?')) return;
    try {
      deleteGear(id);
      loadGear();
    } catch {
      alert('Could not delete gear item.');
    }
  };

  const handleToggleRetire = (item) => {
    try {
      saveGear({ ...item, is_retired: item.is_retired ? 0 : 1 });
      loadGear();
    } catch {
      alert('Could not update gear status.');
    }
  };

  const filteredGear = gearList.filter(g => {
    if (activeTab === 'shoe') return g.gear_type === 'shoe';
    if (activeTab === 'bike') return g.gear_type === 'bike';
    return true;
  });

  const shoesCount = gearList.filter(g => g.gear_type === 'shoe').length;
  const bikesCount = gearList.filter(g => g.gear_type === 'bike').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="section-card glass-card">
        <div className="section-title-wrap">
          <div>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>👟</span>
              <span>Gear &amp; Maintenance Odometer</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Track cumulative mileage on running shoes (with 500–800 km retirement alerts) and bicycles (with chain &amp; tire wear checkpoints).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: `All Gear (${gearList.length})` },
                { id: 'shoe', label: `👟 Shoes (${shoesCount})` },
                { id: 'bike', label: `🚴 Bikes (${bikesCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: activeTab === tab.id ? 'var(--primary)' : 'var(--border-subtle)',
                    background: activeTab === tab.id ? 'rgba(252, 82, 0, 0.15)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenAdd}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Shoe or Bike</span>
            </button>
          </div>
        </div>

        {/* Gear Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="spinning" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
            <span>Scanning gear odometers...</span>
          </div>
        ) : filteredGear.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p>No gear registered in this category yet. Click "Add Shoe or Bike" above to start tracking mileage!</p>
          </div>
        ) : (
          <div className="gear-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            {filteredGear.map(item => {
              const isShoe = item.gear_type === 'shoe';
              const curKm = item.current_km || 0;
              const tgtKm = item.target_km || (isShoe ? 800 : 5000);
              const pct = Math.round((curKm / tgtKm) * 100);

              // Health Status Color
              let healthColor = '#10B981';
              let healthLabel = 'Fresh & Responsive';
              let isAlert = false;

              if (isShoe) {
                if (pct >= 100) {
                  healthColor = '#EF4444';
                  healthLabel = '⚠️ Cushioning Depleted (Retire Soon)';
                  isAlert = true;
                } else if (pct >= 80) {
                  healthColor = '#F59E0B';
                  healthLabel = 'Nearing Retirement Threshold';
                } else if (pct >= 55) {
                  healthColor = '#3B82F6';
                  healthLabel = 'Broken In & Moderate Wear';
                }
              } else {
                if (pct >= 100) {
                  healthColor = '#F59E0B';
                  healthLabel = 'Major Overhaul Recommended';
                } else {
                  healthColor = '#00E5FF';
                  healthLabel = 'Optimal Running Order';
                }
              }

              // Bike Checkpoints (2,000km chain, 3,500km tires, 5,000km cables)
              const chainKmRem = Math.max(0, 2000 - (curKm % 2000));
              const tireKmRem = Math.max(0, 3500 - (curKm % 3500));

              return (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isAlert ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-subtle)',
                    background: isAlert 
                      ? 'radial-gradient(circle at 90% 10%, rgba(239, 68, 68, 0.12), transparent 70%), var(--bg-card)'
                      : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    opacity: item.is_retired ? 0.6 : 1
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '2rem' }}>{isShoe ? '👟' : '🚴'}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 700 }}>
                            {item.name}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {item.brand} {item.model ? `• ${item.model}` : ''}
                          </span>
                        </div>
                      </div>

                      {item.is_retired ? (
                        <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                          Retired
                        </span>
                      ) : (
                        <span 
                          className="badge-pill" 
                          style={{ 
                            background: `${healthColor}20`, 
                            color: healthColor,
                            borderColor: healthColor
                          }}
                        >
                          {pct}% Wear
                        </span>
                      )}
                    </div>

                    {/* Mileage Odometer Display */}
                    <div style={{ margin: '14px 0 10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Odometer Mileage</span>
                        <div>
                          <strong style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-display)' }}>
                            {curKm.toFixed(1)}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}> / {tgtKm} km</span>
                        </div>
                      </div>

                      {/* Wear Progress Bar */}
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, pct)}%`,
                          height: '100%',
                          background: healthColor,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: healthColor, fontWeight: 600 }}>
                          {healthLabel}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {Math.max(0, tgtKm - curKm).toFixed(0)} km remaining
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                        "{item.notes}"
                      </p>
                    )}

                    {/* Specific Bike Maintenance Checkpoints */}
                    {!isShoe && !item.is_retired && (
                      <div style={{
                        marginTop: '14px',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                          <span>⛓️ Chain Inspection:</span>
                          <strong style={{ color: chainKmRem < 300 ? '#F59E0B' : '#10B981' }}>
                            {chainKmRem} km until next service
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                          <span>🚴 Tire Tread Check:</span>
                          <strong style={{ color: tireKmRem < 500 ? '#F59E0B' : '#10B981' }}>
                            {tireKmRem} km until replacement
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px'
                  }}>
                    <button
                      onClick={() => handleToggleRetire(item)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: item.is_retired ? 'var(--primary)' : 'var(--text-dim)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {item.is_retired ? 'Reactivate' : 'Mark Retired'}
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteGear(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete gear"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Gear Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)} style={{ zIndex: 1200 }}>
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '92%', maxWidth: '480px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{formData.gear_type === 'shoe' ? '👟' : '🚴'}</span>
                <span>{editingGear ? 'Edit Gear Item' : 'Add Gear Odometer'}</span>
              </h3>
              <button className="icon-btn close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGear} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Gear Type Select */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Gear Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gear_type: 'shoe', target_km: 800 })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formData.gear_type === 'shoe' ? 'var(--primary)' : 'var(--border-subtle)',
                      background: formData.gear_type === 'shoe' ? 'rgba(252, 82, 0, 0.2)' : 'transparent',
                      color: formData.gear_type === 'shoe' ? 'white' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    👟 Running Shoes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gear_type: 'bike', target_km: 5000 })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formData.gear_type === 'bike' ? '#00E5FF' : 'var(--border-subtle)',
                      background: formData.gear_type === 'bike' ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                      color: formData.gear_type === 'bike' ? 'white' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🚴 Bicycle
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Gear Nickname / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asics Novablast 4 or Trek Domane"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Brand & Model */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nike, Asics, Trek"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pegasus 40"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Current KM & Target KM */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Current Mileage (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.current_km}
                    onChange={(e) => setFormData({ ...formData, current_km: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Retirement Target (km)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={formData.target_km}
                    onChange={(e) => setFormData({ ...formData, target_km: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Notes / Training Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily long run cushion or racing flats"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '11px', fontSize: '0.9rem' }}
                >
                  {editingGear ? 'Save Changes' : 'Add to Odometer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
