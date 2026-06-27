import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, UserX, AlertCircle, Info } from 'lucide-react';

export default function ByDate({ records = {}, selectedDate, setSelectedDate }) {
  // Get today's date formatted as YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayString();

  // Calculate the min date (30 days ago)
  const getMinDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const minDateStr = getMinDateString();

  // Find if date has a record
  const dayRecord = records[selectedDate];
  const hasRecord = !!dayRecord;

  // Derived stats
  const trips = dayRecord?.trips || [];
  const gross = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
  const cng = Number(dayRecord?.cng || 0);
  const extraList = dayRecord?.extra || [];
  const extra = extraList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const net = gross - cng - extra;
  const totalTrips = trips.length;
  const totalKm = trips.reduce((sum, t) => sum + Number(t.km || 0), 0);
  const avgFare = totalTrips > 0 ? (gross / totalTrips).toFixed(2) : '0.00';
  const attendance = dayRecord?.status || 'No record';

  // Format date for visual representation
  const formatVisualDate = (dateStr) => {
    if (!dateStr) return '';
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return dateStr;
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Get list of all dates that actually have records to display as quick links
  const activeDates = Object.keys(records).filter(key => {
    const record = records[key];
    // A record is active if it exists
    return !!record;
  }).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Date Picker Form */}
      <div className="date-picker-container">
        <label className="date-picker-label" htmlFor="by-date-input">Select Date:</label>
        <input 
          type="date"
          id="by-date-input"
          className="date-input"
          min={minDateStr}
          max={todayStr}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          (Within last 30 days: {minDateStr} to {todayStr})
        </span>
      </div>

      {/* Available Dates Hint */}
      {activeDates.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem 1.25rem', borderRadius: '6px', border: '1px solid var(--border-dark)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
            Logged Dates:
          </span>
          {activeDates.map(dateKey => (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              style={{
                background: selectedDate === dateKey ? 'var(--primary)' : 'var(--bg-dark-3)',
                color: selectedDate === dateKey ? 'var(--bg-dark-1)' : 'var(--text-light)',
                border: '1px solid var(--border-dark)',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-number)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {dateKey}
            </button>
          ))}
        </div>
      )}

      {/* Content Rendering */}
      {hasRecord ? (
        <div className="date-breakdown-card">
          <div className="date-breakdown-header">
            <span>{selectedDate}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {formatVisualDate(selectedDate)}
            </span>
          </div>

          <div className="date-breakdown-grid">
            
            {/* Status */}
            <div className="date-breakdown-item" style={{ gridColumn: 'span 2' }}>
              <div className="date-breakdown-label">Driver Attendance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                {attendance === 'present' ? (
                  <>
                    <span className="badge badge-present" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>PRESENT</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Logged trips and CNG expenses active.</span>
                  </>
                ) : (
                  <>
                    <span className="badge badge-absent">ABSENT</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Marked absent. No operations logged.</span>
                  </>
                )}
              </div>
            </div>

            {/* Gross Earnings */}
            <div className="date-breakdown-item">
              <div className="date-breakdown-label">Gross Earnings</div>
              <div className="date-breakdown-val val-yellow">{formatCurrency(gross)}</div>
            </div>

            {/* CNG Expense */}
            <div className="date-breakdown-item">
              <div className="date-breakdown-label">CNG Expense</div>
              <div className="date-breakdown-val val-red">{formatCurrency(cng)}</div>
            </div>

            {/* Extra Expense */}
            <div className="date-breakdown-item">
              <div className="date-breakdown-label">Extra Expense</div>
              <div className="date-breakdown-val val-red">{formatCurrency(extra)}</div>
            </div>

            {/* Net Profit */}
            <div className="date-breakdown-item" style={{ borderLeft: `4px solid ${net >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
              <div className="date-breakdown-label">Net Profit</div>
              <div className={`date-breakdown-val ${net >= 0 ? 'val-green' : 'val-red'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </div>
            </div>

            {/* Extra Expenses Detail List */}
            {extraList.length > 0 && (
              <div className="date-breakdown-item" style={{ gridColumn: 'span 2' }}>
                <div className="date-breakdown-label" style={{ marginBottom: '0.5rem' }}>Extra Expenses Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {extraList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-dark-3)', borderRadius: '4px', border: '1px solid var(--border-dark)' }}>
                      <span>{item.reason}</span>
                      <span className="font-number" style={{ color: 'var(--red)', fontWeight: 'bold' }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Trips */}
            <div className="date-breakdown-item">
              <div className="date-breakdown-label">Total Trips</div>
              <div className="date-breakdown-val font-number">{String(totalTrips).padStart(2, '0')}</div>
            </div>

            {/* Total Distance */}
            <div className="date-breakdown-item">
              <div className="date-breakdown-label">Total Distance</div>
              <div className="date-breakdown-val font-number" style={{ color: 'var(--text-secondary)' }}>{totalKm.toFixed(1)} km</div>
            </div>

            {/* Avg Fare */}
            <div className="date-breakdown-item" style={{ gridColumn: 'span 2' }}>
              <div className="date-breakdown-label">Avg Fare per Trip</div>
              <div className="date-breakdown-val font-number">{formatCurrency(avgFare)}</div>
            </div>

          </div>
        </div>
      ) : (
        <div className="no-data-card">
          <div className="no-data-icon">
            <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="no-data-title">No Records Found</h3>
          <p style={{ maxWidth: '360px', margin: '0 auto', fontSize: '0.9rem' }}>
            There are no attendance or trip logs recorded on <strong>{selectedDate}</strong>. Select an option from the "Logged Dates" timeline above or check in on the dashboard.
          </p>
        </div>
      )}

    </div>
  );
}
