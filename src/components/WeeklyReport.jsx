import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, Route, IndianRupee, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-date">{data.dateRangeLabel}</div>
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

export default function WeeklyReport({ records = {} }) {
  // Helper to format Date as YYYY-MM-DD
  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Generate the last 4 weeks (oldest to newest for chronological chart display)
  const getWeeklyData = () => {
    const weeks = [];
    
    // We want 4 weeks back: Week 0 (current 7 days), Week 1 (7-13 days ago), Week 2 (14-20 days ago), Week 3 (21-27 days ago)
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - (i * 7));
      
      const start = new Date();
      start.setDate(start.getDate() - (i * 7) - 6);

      // Aggregate all days in [start, end]
      let earnings = 0;
      let cng = 0;
      let extra = 0;
      let tripsCount = 0;
      let activeDaysCount = 0;

      // Loop through each day of this week
      const currentDay = new Date(start);
      while (currentDay <= end) {
        const dateKey = formatDateKey(currentDay);
        const dayRecord = records[dateKey];
        if (dayRecord) {
          activeDaysCount++;
          const trips = dayRecord.trips || [];
          earnings += trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
          cng += Number(dayRecord.cng || 0);
          extra += (dayRecord.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
          tripsCount += trips.length;
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }

      const startLabel = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const endLabel = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dateRangeLabel = `${startLabel}–${endLabel}`; // en dash

      weeks.push({
        id: `week-${i}`,
        dateRangeLabel,
        earnings,
        cng,
        extra,
        net: earnings - cng - extra,
        tripsCount,
        activeDaysCount
      });
    }

    return weeks;
  };

  const chartData = getWeeklyData();

  // Totals for all 4 weeks combined
  const totalEarnings = chartData.reduce((sum, w) => sum + w.earnings, 0);
  const totalCng = chartData.reduce((sum, w) => sum + w.cng, 0);
  const totalExtra = chartData.reduce((sum, w) => sum + w.extra, 0);
  const totalNet = totalEarnings - totalCng - totalExtra;
  const totalTrips = chartData.reduce((sum, w) => sum + w.tripsCount, 0);

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Weekly Charts */}
      <div className="report-chart-card">
        <div className="report-chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
            <span>Weekly Report (Last 4 Weeks)</span>
          </div>
        </div>

        {/* Double Stacked Bar Charts */}
        <div className="double-chart-container">
          
          {/* Earnings Chart */}
          <div className="single-chart-wrapper">
            <div className="chart-subtitle">
              <span className="color-indicator" style={{ backgroundColor: 'var(--primary)' }}></span>
              Weekly Gross Earnings (₹)
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dateRangeLabel" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-heading)' }} />
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
              Weekly CNG Expense (₹)
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dateRangeLabel" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-heading)' }} />
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
            Weekly Net Profit Breakdown
          </div>
          {chartData.map(w => {
            const hasEarnings = w.earnings > 0;
            const netPercent = hasEarnings ? Math.max(0, Math.min(100, (w.net / w.earnings) * 100)) : 0;
            return (
              <div key={w.id} className="mini-bar-row">
                <div className="mini-bar-label font-heading" style={{ fontSize: '0.8rem' }}>{w.dateRangeLabel}</div>
                <div className="mini-bar-track">
                  <div 
                    className="mini-bar-fill" 
                    style={{ 
                      width: `${netPercent}%`, 
                      backgroundColor: w.net >= 0 ? 'var(--green)' : 'var(--red)' 
                    }}
                  />
                </div>
                <div className={`mini-bar-value font-number ${w.net >= 0 ? 'highlight-green' : 'highlight-red'}`} style={{ color: w.net >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.85rem' }}>
                  {w.net >= 0 ? '+' : ''}{formatCurrency(w.net)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Table Card */}
      <div className="panel">
        <h2 className="panel-title">Weekly Summary</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Week Range</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Logged Days</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Trips</th>
                <th style={{ textAlign: 'right' }}>Earnings</th>
                <th style={{ textAlign: 'right' }}>CNG</th>
                <th style={{ textAlign: 'right' }}>Extra</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice().reverse().map(w => (
                <tr key={w.id}>
                  <td className="font-heading" style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-white)' }}>{w.dateRangeLabel}</td>
                  <td className="font-number" style={{ textAlign: 'center' }}>{w.activeDaysCount} {w.activeDaysCount === 1 ? 'day' : 'days'}</td>
                  <td className="font-number" style={{ textAlign: 'center' }}>{w.tripsCount}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(w.earnings)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(w.cng)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatCurrency(w.extra)}</td>
                  <td className="font-number" style={{ textAlign: 'right', color: w.net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                    {w.net >= 0 ? '+' : ''}{formatCurrency(w.net)}
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
