import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPdf(activeTab, data) {
  const todayStr = new Date().toISOString().split('T')[0];
  let fileTitle = 'report';
  let reportHeaderTitle = 'Report';
  let bodyHtml = '';

  // Helper to format currency
  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  if (activeTab === 'dashboard') {
    fileTitle = `taxilog-dashboard-${todayStr}`;
    reportHeaderTitle = 'Today\'s Dashboard';

    const trips = data.todayRecord?.trips || [];
    const cng = Number(data.todayRecord?.cng || 0);
    const extraList = data.todayRecord?.extra || [];
    const extraTotal = extraList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalEarnings = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
    const tripCount = trips.length;
    const avgFare = tripCount > 0 ? (totalEarnings / tripCount).toFixed(2) : '0.00';
    const totalKm = trips.reduce((sum, t) => sum + Number(t.km || 0), 0);
    const netProfit = totalEarnings - cng - extraTotal;
    const status = data.attendanceStatus === 'present' ? 'PRESENT' : 'ABSENT';

    bodyHtml = `
      <div class="pdf-meta">
        <div><strong>Driver Status:</strong> ${status}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="pdf-stats-row" style="grid-template-columns: repeat(5, 1fr);">
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Today's Earnings</div>
          <div class="pdf-stat-value" style="color: var(--primary);">${formatCurrency(totalEarnings)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Trips Today</div>
          <div class="pdf-stat-value">${String(tripCount).padStart(2, '0')}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">CNG Expense</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(cng)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Extra Expense</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(extraTotal)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Net Profit</div>
          <div class="pdf-stat-value" style="color: ${netProfit >= 0 ? 'var(--green)' : 'var(--red)'};">
            ${formatCurrency(netProfit)}
          </div>
        </div>
      </div>

      ${extraList.length > 0 ? `
        <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem; margin-top: 1.5rem;">
          Extra Expenses Detail
        </h3>
        <table class="pdf-table">
          <thead>
            <tr>
              <th style="width: 60px;">#</th>
              <th>Reason</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${extraList.map((e, idx) => `
              <tr>
                <td class="font-number" style="color: var(--text-muted);">${String(idx + 1).padStart(2, '0')}</td>
                <td>${e.reason}</td>
                <td class="font-number" style="text-align: right; color: var(--red); font-weight: bold;">${formatCurrency(e.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem; margin-top: 1.5rem;">
        Today's Trip Log
      </h3>
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width: 60px;">#</th>
            <th style="width: 100px;">Time</th>
            <th>Route</th>
            <th style="width: 120px; text-align: right;">Distance</th>
            <th style="width: 120px; text-align: right;">Fare</th>
          </tr>
        </thead>
        <tbody>
          ${trips.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No trips logged today.</td>
            </tr>
          ` : trips.map((t, idx) => `
            <tr>
              <td class="font-number" style="color: var(--text-muted);">${String(idx + 1).padStart(2, '0')}</td>
              <td class="font-number">${t.time}</td>
              <td>${t.from} &rarr; ${t.to}</td>
              <td class="font-number" style="text-align: right;">${t.km} km</td>
              <td class="font-number" style="text-align: right; font-weight: bold; color: var(--text-white);">${formatCurrency(t.fare)}</td>
            </tr>
          `).join('')}
          ${trips.length > 0 ? `
            <tr class="row-total">
              <td colspan="3" style="font-family: var(--font-heading);">TOTALS</td>
              <td class="font-number" style="text-align: right; color: var(--primary);">${totalKm.toFixed(1)} km</td>
              <td class="font-number" style="text-align: right; color: var(--green);">${formatCurrency(totalEarnings)}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    `;
  } else if (activeTab === 'daily') {
    fileTitle = `taxilog-daily-report-${todayStr}`;
    reportHeaderTitle = 'Daily Report';

    const chartData = data.chartData || [];
    const totalEarnings = chartData.reduce((sum, d) => sum + d.earnings, 0);
    const totalCng = chartData.reduce((sum, d) => sum + d.cng, 0);
    const totalExtra = chartData.reduce((sum, d) => sum + (d.extra || 0), 0);
    const totalNet = totalEarnings - totalCng - totalExtra;
    const totalTrips = chartData.reduce((sum, d) => sum + d.tripsCount, 0);
    const totalKm = chartData.reduce((sum, d) => sum + (d.km || 0), 0);

    bodyHtml = `
      <div class="pdf-meta">
        <div><strong>Report Period:</strong> Last 7 Days (Page ${data.pageOffset + 1})</div>
        <div><strong>Exported:</strong> ${new Date().toLocaleString('en-IN')}</div>
      </div>

      <div class="pdf-stats-row" style="grid-template-columns: repeat(6, 1fr);">
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Earnings</div>
          <div class="pdf-stat-value" style="color: var(--primary);">${formatCurrency(totalEarnings)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Trips</div>
          <div class="pdf-stat-value">${String(totalTrips).padStart(2, '0')}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Distance</div>
          <div class="pdf-stat-value" style="color: var(--text-secondary);">${totalKm.toFixed(1)} km</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total CNG</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalCng)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Extra</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalExtra)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Net Profit</div>
          <div class="pdf-stat-value" style="color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
            ${formatCurrency(totalNet)}
          </div>
        </div>
      </div>

      <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem;">
        Day-by-Day Summary
      </h3>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Date</th>
            <th style="width: 80px; text-align: center;">Status</th>
            <th style="width: 80px; text-align: center;">Trips</th>
            <th style="text-align: right;">Distance</th>
            <th style="text-align: right;">Earnings</th>
            <th style="text-align: right;">CNG</th>
            <th style="text-align: right;">Extra</th>
            <th style="text-align: right;">Net Profit</th>
          </tr>
        </thead>
        <tbody>
          ${chartData.slice().reverse().map(d => `
            <tr>
              <td class="font-number" style="font-weight: bold;">${d.fullDateLabel}</td>
              <td style="text-align: center;">
                <span class="badge ${d.status === 'present' ? 'badge-present' : 'badge-absent'}">
                  ${d.status.toUpperCase()}
                </span>
              </td>
              <td class="font-number" style="text-align: center;">${d.tripsCount}</td>
              <td class="font-number" style="text-align: right; color: var(--text-secondary);">${d.km > 0 ? `${d.km.toFixed(1)} km` : '-'}</td>
              <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(d.earnings)}</td>
              <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(d.cng)}</td>
              <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(d.extra || 0)}</td>
              <td class="font-number" style="text-align: right; font-weight: bold; color: ${d.net >= 0 ? 'var(--green)' : 'var(--red)'};">
                ${d.net >= 0 ? '+' : ''}${formatCurrency(d.net)}
              </td>
            </tr>
          `).join('')}
          <tr class="row-total">
            <td colspan="2" style="font-family: var(--font-heading);">PERIOD TOTALS</td>
            <td class="font-number" style="text-align: center;">${totalTrips}</td>
            <td class="font-number" style="text-align: right; color: var(--text-secondary);">${totalKm.toFixed(1)} km</td>
            <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(totalEarnings)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalCng)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalExtra)}</td>
            <td class="font-number" style="text-align: right; color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
              ${totalNet >= 0 ? '+' : ''}${formatCurrency(totalNet)}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (activeTab === 'byDate') {
    const selectedDate = data.selectedDate;
    fileTitle = `taxilog-report-${selectedDate}`;
    reportHeaderTitle = `Report: ${selectedDate}`;

    const hasRecord = data.hasRecord;
    
    if (!hasRecord) {
      bodyHtml = `
        <div class="pdf-meta">
          <div><strong>Selected Date:</strong> ${selectedDate}</div>
          <div><strong>Status:</strong> NO RECORD</div>
        </div>
        <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); border: 1px dashed var(--border-dark); border-radius: 6px;">
          No records logged on this date.
        </div>
      `;
    } else {
      const trips = data.trips || [];
      const gross = data.gross || 0;
      const cng = data.cng || 0;
      const extra = data.extra || 0;
      const extraList = data.extraList || [];
      const net = data.net || 0;
      const totalTrips = data.totalTrips || 0;
      const totalKm = data.totalKm || 0;
      const avgFare = data.avgFare || '0.00';
      const attendance = data.attendance || 'absent';

      bodyHtml = `
        <div class="pdf-meta">
          <div><strong>Selected Date:</strong> ${selectedDate}</div>
          <div><strong>Attendance Status:</strong> ${attendance.toUpperCase()}</div>
        </div>

        <div class="pdf-stats-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 2rem;">
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Gross Earnings</div>
            <div class="pdf-stat-value" style="color: var(--primary); font-size: 1.7rem;">${formatCurrency(gross)}</div>
          </div>
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">CNG Expense</div>
            <div class="pdf-stat-value" style="color: var(--red); font-size: 1.7rem;">${formatCurrency(cng)}</div>
          </div>
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Extra Expense</div>
            <div class="pdf-stat-value" style="color: var(--red); font-size: 1.7rem;">${formatCurrency(extra)}</div>
          </div>
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Net Profit</div>
            <div class="pdf-stat-value" style="color: ${net >= 0 ? 'var(--green)' : 'var(--red)'}; font-size: 1.7rem;">${formatCurrency(net)}</div>
          </div>
        </div>

        <div class="pdf-stats-row" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Total Trips</div>
            <div class="pdf-stat-value" style="font-size: 1.7rem;">${String(totalTrips).padStart(2, '0')}</div>
          </div>
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Total Distance</div>
            <div class="pdf-stat-value" style="color: var(--text-secondary); font-size: 1.7rem;">${totalKm.toFixed(1)} km</div>
          </div>
          <div class="pdf-stat-pill">
            <div class="pdf-stat-label">Avg Fare / Trip</div>
            <div class="pdf-stat-value" style="color: var(--primary); font-size: 1.7rem;">${formatCurrency(avgFare)}</div>
          </div>
        </div>

        ${extraList.length > 0 ? `
          <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem; margin-top: 1.5rem;">
            Extra Expenses Details
          </h3>
          <table class="pdf-table">
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Reason</th>
                <th style="width: 120px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${extraList.map((e, idx) => `
                <tr>
                  <td class="font-number" style="color: var(--text-muted);">${String(idx + 1).padStart(2, '0')}</td>
                  <td>${e.reason}</td>
                  <td class="font-number" style="text-align: right; color: var(--red); font-weight: bold;">${formatCurrency(e.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem; margin-top: 1.5rem;">
          Trip Details
        </h3>
        <table class="pdf-table">
          <thead>
            <tr>
              <th style="width: 60px;">#</th>
              <th style="width: 100px;">Time</th>
              <th>Route</th>
              <th style="width: 120px; text-align: right;">Distance</th>
              <th style="width: 120px; text-align: right;">Fare</th>
            </tr>
          </thead>
          <tbody>
            ${trips.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No trips logged on this date.</td>
              </tr>
            ` : trips.map((t, idx) => `
              <tr>
                <td class="font-number" style="color: var(--text-muted);">${String(idx + 1).padStart(2, '0')}</td>
                <td class="font-number">${t.time}</td>
                <td>${t.from} &rarr; ${t.to}</td>
                <td class="font-number" style="text-align: right;">${t.km} km</td>
                <td class="font-number" style="text-align: right; font-weight: bold;">${formatCurrency(t.fare)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } else if (activeTab === 'weekly') {
    fileTitle = `taxilog-weekly-report-${todayStr}`;
    reportHeaderTitle = 'Weekly Report';

    const chartData = data.chartData || [];
    const totalEarnings = chartData.reduce((sum, w) => sum + w.earnings, 0);
    const totalCng = chartData.reduce((sum, w) => sum + w.cng, 0);
    const totalExtra = chartData.reduce((sum, w) => sum + (w.extra || 0), 0);
    const totalNet = totalEarnings - totalCng - totalExtra;
    const totalTrips = chartData.reduce((sum, w) => sum + w.tripsCount, 0);
    const totalKm = chartData.reduce((sum, w) => sum + (w.km || 0), 0);

    bodyHtml = `
      <div class="pdf-meta">
        <div><strong>Report Period:</strong> Last 4 Weeks</div>
        <div><strong>Exported:</strong> ${new Date().toLocaleString('en-IN')}</div>
      </div>

      <div class="pdf-stats-row" style="grid-template-columns: repeat(6, 1fr);">
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Earnings</div>
          <div class="pdf-stat-value" style="color: var(--primary);">${formatCurrency(totalEarnings)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Trips</div>
          <div class="pdf-stat-value">${String(totalTrips).padStart(2, '0')}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Distance</div>
          <div class="pdf-stat-value" style="color: var(--text-secondary);">${totalKm.toFixed(1)} km</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total CNG</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalCng)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Extra</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalExtra)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Net Profit</div>
          <div class="pdf-stat-value" style="color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
            ${formatCurrency(totalNet)}
          </div>
        </div>
      </div>

      <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem;">
        Weekly Aggregation
      </h3>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Week Range</th>
            <th style="width: 110px; text-align: center;">Logged Days</th>
            <th style="width: 80px; text-align: center;">Trips</th>
            <th style="text-align: right;">Distance</th>
            <th style="text-align: right;">Earnings</th>
            <th style="text-align: right;">CNG</th>
            <th style="text-align: right;">Extra</th>
            <th style="text-align: right;">Net Profit</th>
          </tr>
        </thead>
        <tbody>
          ${chartData.slice().reverse().map(w => `
            <tr>
              <td class="font-heading" style="font-weight: bold; font-size: 1.05rem;">${w.dateRangeLabel}</td>
              <td class="font-number" style="text-align: center;">${w.activeDaysCount} days</td>
              <td class="font-number" style="text-align: center;">${w.tripsCount}</td>
              <td class="font-number" style="text-align: right; color: var(--text-secondary);">${w.km > 0 ? `${w.km.toFixed(1)} km` : '-'}</td>
              <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(w.earnings)}</td>
              <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(w.cng)}</td>
              <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(w.extra || 0)}</td>
              <td class="font-number" style="text-align: right; font-weight: bold; color: ${w.net >= 0 ? 'var(--green)' : 'var(--red)'};">
                ${w.net >= 0 ? '+' : ''}${formatCurrency(w.net)}
              </td>
            </tr>
          `).join('')}
          <tr class="row-total">
            <td colspan="2" style="font-family: var(--font-heading);">PERIOD TOTALS</td>
            <td class="font-number" style="text-align: center;">${totalTrips}</td>
            <td class="font-number" style="text-align: right; color: var(--text-secondary);">${totalKm.toFixed(1)} km</td>
            <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(totalEarnings)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalCng)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalExtra)}</td>
            <td class="font-number" style="text-align: right; color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
              ${totalNet >= 0 ? '+' : ''}${formatCurrency(totalNet)}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (activeTab === 'monthly') {
    fileTitle = `taxilog-monthly-report-${todayStr}`;
    reportHeaderTitle = 'Monthly Report';

    const monthlyList = data.monthlyList || [];
    const totalEarnings = monthlyList.reduce((sum, m) => sum + m.earnings, 0);
    const totalCng = monthlyList.reduce((sum, m) => sum + m.cng, 0);
    const totalExtra = monthlyList.reduce((sum, m) => sum + (m.extra || 0), 0);
    const totalNet = totalEarnings - totalCng - totalExtra;
    const totalTrips = monthlyList.reduce((sum, m) => sum + m.tripsCount, 0);
    const totalKm = monthlyList.reduce((sum, m) => sum + (m.km || 0), 0);
    const totalLoggedDays = monthlyList.reduce((sum, m) => sum + m.loggedDays, 0);

    bodyHtml = `
      <div class="pdf-meta">
        <div><strong>Report Period:</strong> Historical Months</div>
        <div><strong>Exported:</strong> ${new Date().toLocaleString('en-IN')}</div>
      </div>

      <div class="pdf-stats-row" style="grid-template-columns: repeat(6, 1fr);">
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Earnings</div>
          <div class="pdf-stat-value" style="color: var(--primary);">${formatCurrency(totalEarnings)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Trips</div>
          <div class="pdf-stat-value">${String(totalTrips).padStart(2, '0')}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Distance</div>
          <div class="pdf-stat-value" style="color: var(--text-secondary);">${totalKm.toFixed(1)} km</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total CNG</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalCng)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Total Extra</div>
          <div class="pdf-stat-value" style="color: var(--red);">${formatCurrency(totalExtra)}</div>
        </div>
        <div class="pdf-stat-pill">
          <div class="pdf-stat-label">Net Profit</div>
          <div class="pdf-stat-value" style="color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
            ${formatCurrency(totalNet)}
          </div>
        </div>
      </div>

      <h3 class="font-heading" style="margin-bottom: 1rem; font-size: 1.25rem; border-bottom: 1px solid var(--border-dark); padding-bottom: 0.25rem;">
        Monthly Aggregation
      </h3>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Month</th>
            <th style="width: 120px; text-align: center;">Logged Days</th>
            <th style="width: 80px; text-align: center;">Trips</th>
            <th style="text-align: right;">Distance</th>
            <th style="text-align: right;">Gross Earnings</th>
            <th style="text-align: right;">CNG Expense</th>
            <th style="text-align: right;">Extra Expense</th>
            <th style="text-align: right;">Net Profit</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyList.map(m => {
            const net = m.earnings - m.cng - (m.extra || 0);
            return `
              <tr>
                <td class="font-heading" style="font-weight: bold; font-size: 1.1rem;">${m.monthName}</td>
                <td class="font-number" style="text-align: center;">${m.loggedDays} days</td>
                <td class="font-number" style="text-align: center;">${m.tripsCount}</td>
                <td class="font-number" style="text-align: right; color: var(--text-secondary);">${m.km > 0 ? `${m.km.toFixed(1)} km` : '-'}</td>
                <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(m.earnings)}</td>
                <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(m.cng)}</td>
                <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(m.extra || 0)}</td>
                <td class="font-number" style="text-align: right; font-weight: bold; color: ${net >= 0 ? 'var(--green)' : 'var(--red)'};">
                  ${net >= 0 ? '+' : ''}${formatCurrency(net)}
                </td>
              </tr>
            `;
          }).join('')}
          <tr class="row-total">
            <td>TOTAL PERIOD</td>
            <td class="font-number" style="text-align: center;">${totalLoggedDays} days</td>
            <td class="font-number" style="text-align: center;">${totalTrips}</td>
            <td class="font-number" style="text-align: right; color: var(--text-secondary);">${totalKm.toFixed(1)} km</td>
            <td class="font-number" style="text-align: right; color: var(--primary);">${formatCurrency(totalEarnings)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalCng)}</td>
            <td class="font-number" style="text-align: right; color: var(--red);">${formatCurrency(totalExtra)}</td>
            <td class="font-number" style="text-align: right; color: ${totalNet >= 0 ? 'var(--green)' : 'var(--red)'};">
              ${totalNet >= 0 ? '+' : ''}${formatCurrency(totalNet)}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // Construct the full offscreen DOM node to pass to html2canvas
  const exportNode = document.createElement('div');
  exportNode.className = 'pdf-export-hidden-container';
  exportNode.innerHTML = `
    <div class="pdf-header-band">
      <span class="pdf-logo">TAXILOG</span>
      <span class="pdf-title">${reportHeaderTitle}</span>
    </div>
    <div class="pdf-body">
      ${bodyHtml}
    </div>
    <div class="pdf-footer-band">
      <span>Generated by TAXILOG &copy; ${new Date().getFullYear()}</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  // Append node to body to ensure CSS styles apply
  document.body.appendChild(exportNode);

  try {
    // Generate Canvas using html2canvas
    const canvas = await html2canvas(exportNode, {
      backgroundColor: '#000000',
      scale: 2, // improve quality
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create jsPDF instance
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Canvas aspect ratio calculations
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = pdfWidth - 20; // 10mm margins on left/right
    const imgHeight = (canvasHeight * imgWidth) / canvasWidth;

    // Center image on the page with a 10mm top margin
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
    
    // Save generated PDF
    pdf.save(`${fileTitle}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Clean up temporary DOM node
    document.body.removeChild(exportNode);
  }
}
