import React, { useState, useEffect } from 'react';
import { Download, Car, UserCheck, UserX } from 'lucide-react';
import AttendanceGate from './components/AttendanceGate';
import Dashboard from './components/Dashboard';
import DailyReport from './components/DailyReport';
import ByDate from './components/ByDate';
import WeeklyReport from './components/WeeklyReport';
import MonthlyReport from './components/MonthlyReport';
import { exportToPdf } from './utils/pdfExport';

export default function App() {
  // Central database state loaded from localStorage
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('taxilog_records');
    return saved ? JSON.parse(saved) : {};
  });

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared report query states so App can access them for export
  const [dailyPageOffset, setDailyPageOffset] = useState(0);

  // Helper to retrieve today's date string in YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [todayStr, setTodayStr] = useState(getTodayString());
  const [selectedDateByDate, setSelectedDateByDate] = useState(todayStr);

  // Check and update date periodically + on visibility focus
  useEffect(() => {
    const checkDate = () => {
      const dateString = getTodayString();
      setTodayStr((prev) => {
        if (prev !== dateString) {
          setSelectedDateByDate(dateString); // sync reports picker to new date too
          return dateString;
        }
        return prev;
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkDate, 10000);

    // Focus and visibility listeners
    window.addEventListener('focus', checkDate);
    document.addEventListener('visibilitychange', checkDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, []);

  // Save database modifications to localStorage automatically
  useEffect(() => {
    localStorage.setItem('taxilog_records', JSON.stringify(records));
  }, [records]);

  const todayRecord = records[todayStr];
  const attendanceStatus = todayRecord?.status; // 'present', 'absent', or undefined

  // Gatekeeper: if attendance isn't checked in for today, render the Gate
  const handleCheckIn = (status) => {
    setRecords(prev => ({
      ...prev,
      [todayStr]: {
        status,
        trips: prev[todayStr]?.trips || [],
        cng: prev[todayStr]?.cng || 0
      }
    }));
  };

  // Mutator actions passed to dashboard
  const handleAddTrip = (newTrip) => {
    setRecords(prev => {
      const todayData = prev[todayStr] || { status: 'present', trips: [], cng: 0 };
      return {
        ...prev,
        [todayStr]: {
          ...todayData,
          trips: [...todayData.trips, newTrip]
        }
      };
    });
  };

  const handleDeleteTrip = (tripId) => {
    setRecords(prev => {
      const todayData = prev[todayStr] || { status: 'present', trips: [], cng: 0 };
      return {
        ...prev,
        [todayStr]: {
          ...todayData,
          trips: todayData.trips.filter(t => t.id !== tripId)
        }
      };
    });
  };

  const handleAddCng = (amount) => {
    setRecords(prev => {
      const todayData = prev[todayStr] || { status: 'present', trips: [], cng: 0 };
      return {
        ...prev,
        [todayStr]: {
          ...todayData,
          cng: Number(todayData.cng || 0) + amount
        }
      };
    });
  };

  const handleAddExtra = (amount, reason) => {
    setRecords(prev => {
      const todayData = prev[todayStr] || { status: 'present', trips: [], cng: 0, extra: [] };
      return {
        ...prev,
        [todayStr]: {
          ...todayData,
          extra: [...(todayData.extra || []), { amount, reason }]
        }
      };
    });
  };

  const handleUpdateOdometer = (start, end) => {
    setRecords(prev => {
      const todayData = prev[todayStr] || { status: 'present', trips: [], cng: 0 };
      return {
        ...prev,
        [todayStr]: {
          ...todayData,
          startKm: start === '' ? undefined : Number(start),
          endKm: end === '' ? undefined : Number(end)
        }
      };
    });
  };

  // Generate date calculations in App for clean PDF outputs
  const handleExportPdf = () => {
    let exportData = {};

    if (activeTab === 'dashboard') {
      exportData = {
        todayRecord: records[todayStr],
        attendanceStatus
      };
    } else if (activeTab === 'daily') {
      const getDaysForPage = (page) => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - (page * 7) - i);
          days.push(d);
        }
        return days;
      };

      const daysList = getDaysForPage(dailyPageOffset);
      const chartData = daysList.map(date => {
        const dateKey = date.toISOString().split('T')[0];
        const dayRecord = records[dateKey] || { trips: [], cng: 0, extra: [], status: 'absent' };
        const trips = dayRecord.trips || [];
        const earnings = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
        const cng = Number(dayRecord.cng || 0);
        const extraTotal = (dayRecord.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const net = earnings - cng - extraTotal;
        const tripsCount = trips.length;
        const km = trips.reduce((sum, t) => sum + Number(t.km || 0), 0);

        const dateLabel = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const fullDateLabel = date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

        return {
          dateKey,
          dateLabel,
          fullDateLabel,
          earnings,
          cng,
          extra: extraTotal,
          net,
          tripsCount,
          km,
          status: dayRecord.status || 'absent'
        };
      });

      exportData = {
        chartData,
        pageOffset: dailyPageOffset
      };
    } else if (activeTab === 'byDate') {
      const dayRecord = records[selectedDateByDate];
      const trips = dayRecord?.trips || [];
      const gross = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
      const cng = Number(dayRecord?.cng || 0);
      const extraTotal = (dayRecord?.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalKm = trips.reduce((sum, t) => sum + Number(t.km || 0), 0);

      exportData = {
        selectedDate: selectedDateByDate,
        hasRecord: !!dayRecord,
        trips,
        gross,
        cng,
        extra: extraTotal,
        extraList: dayRecord?.extra || [],
        net: gross - cng - extraTotal,
        totalTrips: trips.length,
        totalKm,
        startKm: dayRecord?.startKm,
        endKm: dayRecord?.endKm,
        avgFare: trips.length > 0 ? (gross / trips.length).toFixed(2) : '0.00',
        attendance: dayRecord?.status || 'absent'
      };
    } else if (activeTab === 'weekly') {
      const getWeeklyData = () => {
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
          const end = new Date();
          end.setDate(end.getDate() - (i * 7));
          const start = new Date();
          start.setDate(start.getDate() - (i * 7) - 6);

          let earnings = 0;
          let cng = 0;
          let extra = 0;
          let tripsCount = 0;
          let km = 0;
          let activeDaysCount = 0;

          const currentDay = new Date(start);
          while (currentDay <= end) {
            const yyyy = currentDay.getFullYear();
            const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDay.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            const dayRecord = records[dateKey];
            if (dayRecord) {
              activeDaysCount++;
              const trips = dayRecord.trips || [];
              earnings += trips.reduce((sum, t) => sum + Number(t.fare || 0), 0);
              cng += Number(dayRecord.cng || 0);
              extra += (dayRecord.extra || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
              tripsCount += trips.length;
              km += trips.reduce((sum, t) => sum + Number(t.km || 0), 0);
            }
            currentDay.setDate(currentDay.getDate() + 1);
          }

          const startLabel = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const endLabel = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          weeks.push({
            dateRangeLabel: `${startLabel}–${endLabel}`,
            earnings,
            cng,
            extra,
            net: earnings - cng - extra,
            tripsCount,
            km,
            activeDaysCount
          });
        }
        return weeks;
      };

      exportData = {
        chartData: getWeeklyData()
      };
    } else if (activeTab === 'monthly') {
      const monthsMap = {};
      Object.keys(records).forEach(dateKey => {
        const dayRecord = records[dateKey];
        if (!dayRecord) return;
        const dateParts = dateKey.split('-');
        if (dateParts.length !== 3) return;
        const yearMonth = `${dateParts[0]}-${dateParts[1]}`;

        if (!monthsMap[yearMonth]) {
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

      const monthlyList = Object.values(monthsMap).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

      exportData = {
        monthlyList
      };
    }

    exportToPdf(activeTab, exportData);
  };

  // Render Gate screen if today has not been checked in
  if (!attendanceStatus) {
    return <AttendanceGate onCheckIn={handleCheckIn} />;
  }

  return (
    <div className="app-container">
      {/* Header Band */}
      <header className="header">
        <div className="logo-container">
          <Car size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="logo-text">TAXILOG</h1>
            <span className="logo-sub">Taxi Log Management System</span>
          </div>
        </div>

        {/* Display-only status badge matching current check-in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
            TODAY'S STATUS:
          </span>
          {attendanceStatus === 'present' ? (
            <span className="badge badge-present" style={{ padding: '0.35rem 0.75rem', fontWeight: 'bold' }}>
              <UserCheck size={14} style={{ marginRight: '0.25rem' }} /> PRESENT
            </span>
          ) : (
            <span className="badge badge-absent" style={{ padding: '0.35rem 0.75rem', fontWeight: 'bold' }}>
              <UserX size={14} style={{ marginRight: '0.25rem' }} /> ABSENT
            </span>
          )}
        </div>
      </header>

      {/* Navigation tabs & Global PDF export button */}
      <div className="nav-and-actions" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Daily Report
          </button>
          <button 
            className={`nav-tab ${activeTab === 'byDate' ? 'active' : ''}`}
            onClick={() => setActiveTab('byDate')}
          >
            By Date
          </button>
          <button 
            className={`nav-tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`nav-tab ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly
          </button>
        </div>

        <button 
          className="btn btn-outline" 
          onClick={handleExportPdf}
          title="Export report as PDF"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      {/* Tab content view router */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            todayRecord={todayRecord}
            onAddTrip={handleAddTrip}
            onDeleteTrip={handleDeleteTrip}
            onAddCng={handleAddCng}
            onAddExtra={handleAddExtra}
            onUpdateOdometer={handleUpdateOdometer}
            attendanceStatus={attendanceStatus}
          />
        )}
        {activeTab === 'daily' && (
          <DailyReport 
            records={records}
            pageOffset={dailyPageOffset}
            setPageOffset={setDailyPageOffset}
          />
        )}
        {activeTab === 'byDate' && (
          <ByDate 
            records={records}
            selectedDate={selectedDateByDate}
            setSelectedDate={setSelectedDateByDate}
          />
        )}
        {activeTab === 'weekly' && (
          <WeeklyReport 
            records={records}
          />
        )}
        {activeTab === 'monthly' && (
          <MonthlyReport 
            records={records}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="footer">
        <div>
          Powered by <span className="footer-brand">TAXILOG</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} TAXILOG. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
