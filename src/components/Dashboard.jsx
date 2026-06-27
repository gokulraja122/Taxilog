import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  UserCheck, 
  UserX, 
  Car, 
  ArrowRight, 
  TrendingUp, 
  MapPin, 
  Route, 
  IndianRupee 
} from 'lucide-react';

export default function Dashboard({ 
  todayRecord, 
  onAddTrip, 
  onDeleteTrip, 
  onAddCng, 
  onAddExtra,
  attendanceStatus 
}) {
  const [fare, setFare] = useState('');
  const [km, setKm] = useState('');
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [cngInput, setCngInput] = useState('');
  const [extraInput, setExtraInput] = useState('');

  // If status is absent, show ONLY the locked screen
  if (attendanceStatus === 'absent') {
    return (
      <div className="main-grid" style={{ gridTemplateColumns: '1fr', margin: '2rem 0' }}>
        <div className="absent-locked-screen">
          <div className="absent-icon-circle">
            <UserX size={44} className="highlight-red" style={{ color: 'var(--red)' }} />
          </div>
          <h2 className="absent-title">Absent Today</h2>
          <p className="absent-text">
            You marked yourself as absent for today. Editing and trip logging are disabled.
          </p>
          <div className="absent-link-note">
            Go to the Reports tabs to view historical performance data.
          </div>
        </div>
      </div>
    );
  }

  // Derived stats for today's record
  const trips = todayRecord?.trips || [];
  const cng = todayRecord?.cng || 0;
  const extraList = todayRecord?.extra || [];
  const extraTotal = extraList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  const totalEarnings = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
  const tripCount = trips.length;
  const avgFare = tripCount > 0 ? (totalEarnings / tripCount).toFixed(2) : '0.00';
  const totalKm = trips.reduce((sum, t) => sum + Number(t.km || 0), 0);
  const netProfit = totalEarnings - cng - extraTotal;

  // Format numbers to Indian currency style if needed, or plain numbers
  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const handleTripSubmit = (e) => {
    e.preventDefault();
    if (!fare || !km || !fromLoc || !toLoc) return;

    const newTrip = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      fare: Number(fare),
      km: Number(km),
      from: fromLoc,
      to: toLoc
    };

    onAddTrip(newTrip);
    
    // Reset form
    setFare('');
    setKm('');
    setFromLoc('');
    setToLoc('');
  };

  const handleCngSubmit = (e) => {
    e.preventDefault();
    if (!cngInput || isNaN(cngInput)) return;
    onAddCng(Number(cngInput));
    setCngInput('');
  };

  const handleExtraSubmit = (e) => {
    e.preventDefault();
    if (!extraInput || isNaN(extraInput)) return;
    const reason = window.prompt("Enter the reason for this extra expense (e.g. Toll, Parking, Wash):");
    if (reason === null) return; // User cancelled
    const cleanReason = reason.trim() || "Miscellaneous";
    onAddExtra(Number(extraInput), cleanReason);
    setExtraInput('');
  };

  // Padded trip count
  const paddedTripCount = String(tripCount).padStart(2, '0');

  // Profit bar percentage logic
  const profitPercent = totalEarnings > 0 
    ? Math.max(0, Math.min(100, (netProfit / totalEarnings) * 100)) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 4 Stat Cards + Net Profit Card Grid */}
      <div className="stats-grid">
        
        {/* Today's Earnings */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Today's Earnings</span>
            <IndianRupee size={16} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="stat-card-value highlight-yellow">{formatCurrency(totalEarnings)}</div>
            <div className="stat-card-sub">
              <span>{tripCount} {tripCount === 1 ? 'TRIP' : 'TRIPS'} LOGGED</span>
            </div>
          </div>
        </div>

        {/* Trips Today */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Trips Today</span>
            <Route size={16} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="stat-card-value font-number">{paddedTripCount}</div>
            <div className="stat-card-sub">
              <span>{formatCurrency(avgFare)} AVG FARE</span>
            </div>
          </div>
        </div>

        {/* Driver Status */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Driver Status</span>
            <UserCheck size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
              <span className="badge badge-present" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                PRESENT
              </span>
            </div>
            <div className="stat-card-sub" style={{ marginTop: '0.75rem' }}>
              <span>Marked at check-in · read only</span>
            </div>
          </div>
        </div>

        {/* CNG Expense */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">CNG Expense</span>
            <TrendingUp size={16} className="highlight-red" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <div className="stat-card-value highlight-red">{formatCurrency(cng)}</div>
            <form onSubmit={handleCngSubmit} className="cng-input-container">
              <input 
                type="number" 
                className="cng-input" 
                placeholder="Add expense" 
                value={cngInput}
                onChange={(e) => setCngInput(e.target.value)}
              />
              <button type="submit" className="cng-add-btn">
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Extra Expense */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Extra</span>
            <TrendingUp size={16} className="highlight-red" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <div className="stat-card-value highlight-red">{formatCurrency(extraTotal)}</div>
            <form onSubmit={handleExtraSubmit} className="cng-input-container">
              <input 
                type="number" 
                className="cng-input" 
                placeholder="Add extra" 
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
              />
              <button type="submit" className="cng-add-btn">
                <Plus size={16} />
              </button>
            </form>
            {extraList.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '55px', overflowY: 'auto', borderTop: '1px solid var(--border-dark)', paddingTop: '0.5rem' }}>
                {extraList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{item.reason}</span>
                    <span className="font-number" style={{ color: 'var(--text-light)' }}>₹{item.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Net Profit Bar */}
        <div className="stat-card net-profit-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Net Profit</span>
            <span className={`font-number ${netProfit >= 0 ? 'highlight-green' : 'highlight-red'}`} style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
              {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
            </span>
          </div>
          <div className="net-bar-container">
            <div className="net-bar-track">
              <div 
                className={`net-bar-fill ${netProfit >= 0 ? 'positive' : 'negative'}`}
                style={{ width: `${totalEarnings > 0 ? profitPercent : 0}%` }}
              />
            </div>
            <div className="net-breakdown">
              <span>Earnings: {formatCurrency(totalEarnings)}</span>
              <span>CNG: {formatCurrency(cng)}</span>
              <span>Extra: {formatCurrency(extraTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Form + Table */}
      <div className="main-grid">
        
        {/* Log New Trip Form */}
        <div className="panel">
          <h2 className="panel-title">
            <Car size={20} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
            Log New Trip
          </h2>
          
          <form onSubmit={handleTripSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fare (₹)</label>
              <input 
                type="number" 
                className="form-input number-input" 
                required 
                placeholder="e.g. 350"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Distance (Km)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input number-input" 
                required 
                placeholder="e.g. 8.5"
                value={km}
                onChange={(e) => setKm(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">From</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Starting Location"
                  style={{ paddingLeft: '2.25rem' }}
                  value={fromLoc}
                  onChange={(e) => setFromLoc(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">To</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <ArrowRight size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Destination Location"
                  style={{ paddingLeft: '2.25rem' }}
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              Log Trip
            </button>
          </form>
        </div>

        {/* Today's Trip Log Table */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="panel-title">
            Today's Trip Log
          </h2>
          
          <div className="table-container" style={{ flex: 1 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th style={{ width: '100px' }}>Time</th>
                  <th>Route</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Distance</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Fare</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No trips logged today yet. Use the form on the left to log your first trip.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, idx) => (
                    <tr key={trip.id} className="trip-row">
                      <td className="font-num-cell" style={{ color: 'var(--text-muted)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="font-num-cell">{trip.time}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-white)' }}>{trip.from}</span>
                          <ArrowRight size={14} style={{ color: 'var(--primary)' }} />
                          <span style={{ color: 'var(--text-white)' }}>{trip.to}</span>
                        </div>
                      </td>
                      <td className="font-num-cell" style={{ textAlign: 'right' }}>{trip.km} km</td>
                      <td className="font-num-cell" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(trip.fare)}
                      </td>
                      <td className="delete-action-cell">
                        <button 
                          className="delete-btn"
                          onClick={() => onDeleteTrip(trip.id)}
                          title="Remove Trip"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {trips.length > 0 && (
                  <tr className="row-total">
                    <td colSpan="3" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                      TOTALS
                    </td>
                    <td className="font-num-cell" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                      {totalKm.toFixed(1)} km
                    </td>
                    <td className="font-num-cell" style={{ textAlign: 'right', color: 'var(--green)' }}>
                      {formatCurrency(totalEarnings)}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
