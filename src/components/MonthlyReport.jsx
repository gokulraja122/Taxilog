import React from 'react';
import { Calendar, Route, IndianRupee, TrendingUp } from 'lucide-react';

export default function MonthlyReport({ records = {} }) {
  
  // Aggregate data by month
  const getMonthlyData = () => {
    const monthsMap = {};
    
    Object.keys(records).forEach(dateKey => {
      const dayRecord = records[dateKey];
      if (!dayRecord) return;
      
      const dateParts = dateKey.split('-');
      if (dateParts.length !== 3) return;
      const yearMonth = `${dateParts[0]}-${dateParts[1]}`; // e.g. "2026-06"
      
      if (!monthsMap[yearMonth]) {
        // Parse date to get Month name
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, 1);
        const monthName = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        monthsMap[yearMonth] = {
          yearMonth,
          monthName,
          earnings: 0,
          cng: 0,
          extra: 0,
          tripsCount: 0,
          km: 0,
          loggedDays: 0,
        };
      }
      
      const trips = dayRecord.trips || [];
      monthsMap[yearMonth].earnings += trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
      monthsMap[yearMonth].cng += Number(dayRecord.cng || 0);
      monthsMap[yearMonth].extra += (dayRecord.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      monthsMap[yearMonth].tripsCount += trips.length;
      monthsMap[yearMonth].km += trips.reduce((sum, t) => sum + Number(t.km || 0), 0);
      monthsMap[yearMonth].loggedDays += 1;
    });
    
    // Sort chronological
    return Object.values(monthsMap).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  };

  const monthlyList = getMonthlyData();

  // Totals for all months combined
  const totalEarnings = monthlyList.reduce((sum, m) => sum + m.earnings, 0);
  const totalCng = monthlyList.reduce((sum, m) => sum + m.cng, 0);
  const totalExtra = monthlyList.reduce((sum, m) => sum + m.extra, 0);
  const totalNet = totalEarnings - totalCng - totalExtra;
  const totalTrips = monthlyList.reduce((sum, m) => sum + m.tripsCount, 0);
  const totalKm = monthlyList.reduce((sum, m) => sum + m.km, 0);
  const totalLoggedDays = monthlyList.reduce((sum, m) => sum + m.loggedDays, 0);

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Monthly Summary Panel */}
      <div className="panel">
        <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
            <span>Monthly Performance Report</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            (Aggregated from 30-day local history)
          </span>
        </h2>

        {monthlyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-dark)', borderRadius: '6px' }}>
            No historical records found. Attendance or trip logs must be entered first to construct monthly metrics.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Logged Days</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Trips</th>
                  <th style={{ textAlign: 'right' }}>Distance</th>
                  <th style={{ textAlign: 'right' }}>Gross Earnings</th>
                  <th style={{ textAlign: 'right' }}>CNG Expense</th>
                  <th style={{ textAlign: 'right' }}>Extra Expense</th>
                  <th style={{ textAlign: 'right' }}>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyList.map(m => {
                  const net = m.earnings - m.cng - m.extra;
                  return (
                    <tr key={m.yearMonth}>
                      <td className="font-heading" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-white)' }}>
                        {m.monthName}
                      </td>
                      <td className="font-number" style={{ textAlign: 'center' }}>
                        {m.loggedDays} {m.loggedDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="font-number" style={{ textAlign: 'center' }}>
                        {m.tripsCount}
                      </td>
                      <td className="font-number" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {m.km > 0 ? `${m.km.toFixed(1)} km` : '-'}
                      </td>
                      <td className="font-number" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                        {formatCurrency(m.earnings)}
                      </td>
                      <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>
                        {formatCurrency(m.cng)}
                      </td>
                      <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>
                        {formatCurrency(m.extra)}
                      </td>
                      <td className="font-number" style={{ textAlign: 'right', color: net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="row-total">
                  <td>TOTAL PERIOD</td>
                  <td className="font-number" style={{ textAlign: 'center' }}>
                    {totalLoggedDays} days
                  </td>
                  <td className="font-number" style={{ textAlign: 'center' }}>
                    {totalTrips}
                  </td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {totalKm.toFixed(1)} km
                  </td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                    {formatCurrency(totalEarnings)}
                  </td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>
                    {formatCurrency(totalCng)}
                  </td>
                  <td className="font-number" style={{ textAlign: 'right', color: 'var(--red)' }}>
                    {formatCurrency(totalExtra)}
                  </td>
                  <td className="font-number" style={{ textAlign: 'right', color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Indicator Cards for Monthly totals */}
      {monthlyList.length > 0 && (
        <div className="stats-grid">
          
          {/* Earnings Total */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Cumulative Earnings</span>
              <IndianRupee size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div className="stat-card-value highlight-yellow">{formatCurrency(totalEarnings)}</div>
              <div className="stat-card-sub">
                <span>{totalTrips} TRIPS ACROSS ALL MONTHS</span>
              </div>
            </div>
          </div>

          {/* CNG Total */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Cumulative Fuel Expense</span>
              <TrendingUp size={16} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <div className="stat-card-value highlight-red">{formatCurrency(totalCng)}</div>
              <div className="stat-card-sub">
                <span>CNG EXPENDITURE TOTAL</span>
              </div>
            </div>
          </div>

          {/* Net Profit Total */}
          <div className="stat-card net-profit-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Cumulative Net Profit</span>
              <span className={`font-number ${totalNet >= 0 ? 'highlight-green' : 'highlight-red'}`} style={{ color: totalNet >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
              </span>
            </div>
            <div className="net-bar-container">
              <div className="net-bar-track">
                <div 
                  className={`net-bar-fill ${totalNet >= 0 ? 'positive' : 'negative'}`}
                  style={{ width: `${totalEarnings > 0 ? Math.max(0, Math.min(100, (totalNet / totalEarnings) * 100)) : 0}%` }}
                />
              </div>
              <div className="net-breakdown">
                <span>Earnings: {formatCurrency(totalEarnings)}</span>
                <span>CNG: {formatCurrency(totalCng)}</span>
                <span>Extra: {formatCurrency(totalExtra)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
