import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, Route, IndianRupee, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-date">{data.fullDateLabel}</div>
        <div className="tooltip-item">
          <span className="tooltip-label">Earnings:</span>
          <span className="tooltip-value yellow">₹{Number(data.earnings).toLocaleString('en-IN')}</span>
        </div>
        <div className="tooltip-item">
          <span className="tooltip-label">CNG Expense:</span>
          <span className="tooltip-value red">₹{Number(data.cng).toLocaleString('en-IN')}</span>
        </div>
        <div className="tooltip-item">
          <span className="tooltip-label">Extra Expense:</span>
          <span className="tooltip-value red">₹{Number(data.extra || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="tooltip-item" style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
          <span className="tooltip-label">Net Profit:</span>
          <span className={`tooltip-value ${data.net >= 0 ? 'green' : 'red'}`} style={{ color: data.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ₹{Number(data.net).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DailyReport({ records = {}, pageOffset, setPageOffset }) {
  // Helper to format ISO Date key: YYYY-MM-DD
  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Get 7 days for the current page offset (oldest to newest for chronological chart display)
  const getDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (pageOffset * 7) - i);
      days.push(d);
    }
    return days;
  };

  const daysList = getDays();

  // Map days to records data
  const chartData = daysList.map(date => {
    const dateKey = formatDateKey(date);
    const dayRecord = records[dateKey] || { trips: [], cng: 0, extra: [], status: 'absent' };
    
    const trips = dayRecord.trips || [];
    const earnings = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
    const cng = Number(dayRecord.cng || 0);
    const extra = (dayRecord.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const net = earnings - cng - extra;
    const tripsCount = trips.length;

    // Formatting date labels
    const dateLabel = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); // e.g. "12 Jun"
    const fullDateLabel = date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return {
      dateKey,
      dateLabel,
      fullDateLabel,
      earnings,
      cng,
      extra,
      net,
      tripsCount,
      status: dayRecord.status || 'absent'
    };
  });

  // Totals for the current page
  const totalEarnings = chartData.reduce((sum, d) => sum + d.earnings, 0);
  const totalCng = chartData.reduce((sum, d) => sum + d.cng, 0);
  const totalExtra = chartData.reduce((sum, d) => sum + d.extra, 0);
  const totalNet = totalEarnings - totalCng - totalExtra;
  const totalTrips = chartData.reduce((sum, d) => sum + d.tripsCount, 0);

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Chart Card */}
      <div className="report-chart-card">
        <div className="report-chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
            <span>Daily Report (Last 7 Days)</span>
          </div>
          
          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setPageOffset(prev => prev + 1)}
              title="Older"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              PAGE {pageOffset + 1}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setPageOffset(prev => Math.max(0, prev - 1))}
              disabled={pageOffset === 0}
              title="Newer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Double Stacked Bar Charts to avoid internal key collision */}
        <div className="double-chart-container">
          
          {/* Earnings Chart */}
          <div className="single-chart-wrapper">
            <div className="chart-subtitle">
              <span className="color-indicator" style={{ backgroundColor: 'var(--primary)' }}></span>
              Gross Earnings (₹)
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dateLabel" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-number)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-number)' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="earnings" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CNG Expense Chart */}
          <div className="single-chart-wrapper">
            <div className="chart-subtitle">
              <span className="color-indicator" style={{ backgroundColor: 'var(--red)' }}></span>
              CNG Expense (₹)
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dateLabel" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-number)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-number)' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="cng" fill="var(--red)" radius={[4, 4, 0, 0]} name="CNG Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Mini Net Profit Bar Breakdown */}
        <div className="mini-bars-breakdown">
          <div className="chart-subtitle" style={{ marginBottom: '0.25rem' }}>
            <span className="color-indicator" style={{ backgroundColor: 'var(--green)' }}></span>
            Net Profit Breakdown (Current Period)
          </div>
          {chartData.map(d => {
            const hasEarnings = d.earnings > 0;
            const netPercent = hasEarnings ? Math.max(0, Math.min(100, (d.net / d.earnings) * 100)) : 0;
            return (
              <div key={d.dateKey} className="mini-bar-row">
                <div className="mini-bar-label font-number" style={{ fontSize: '0.8rem' }}>{d.dateLabel}</div>
                <div className="mini-bar-track">
                  <div 
                    className="mini-bar-fill" 
                    style={{ 
                      width: `${netPercent}%`, 
                      backgroundColor: d.net >= 0 ? 'var(--green)' : 'var(--red)' 
                    }}
                  />
                </div>
                <div className={`mini-bar-value font-number ${d.net >= 0 ? 'highlight-green' : 'highlight-red'}`} style={{ color: d.net >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.85rem' }}>
                  {d.net >= 0 ? '+' : ''}{formatCurrency(d.net)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Table Card */}
      <div className="panel">
        <h2 className="panel-title">Summary Breakdown</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Earnings</th>
                <th style={{ textAlign: 'right' }}>CNG</th>
                <th style={{ textAlign: 'right' }}>Extra</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice().reverse().map(d => (
                <tr key={d.dateKey}>
                  <td className="font-number" style={{ fontWeight: 'bold' }}>{d.fullDateLabel}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${d.status === 'present' ? 'badge-present' : 'badge-absent'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>
                      {d.status}
                    </span>
                  </td>
                  <td className="font-number" style={{ textAlign: 'center' }}>{d.tripsCount}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(d.earnings)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(d.cng)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(d.extra)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: d.net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                    {d.net >= 0 ? '+' : ''}{formatCurrency(d.net)}
                  </td>
                </tr>
              ))}
              <tr className="row-total">
                <td colSpan="2">PERIOD TOTALS</td>
                <td className="font-number" style={{ textAlign: 'center' }}>{totalTrips}</td>
                <td className="font-number" style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(totalEarnings)}</td>
                <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(totalCng)}</td>
                <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(totalExtra)}</td>
                <td className="font-number" style={{ textAlign: 'right', color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
