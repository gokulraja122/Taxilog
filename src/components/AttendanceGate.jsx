import React from 'react';
import { UserCheck, UserX, Car } from 'lucide-react';

export default function AttendanceGate({ onCheckIn }) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="gate-container">
      <div className="gate-card">
        <div className="gate-logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Car size={36} className="highlight-yellow" style={{ color: 'var(--primary)' }} />
          <span className="gate-logo">TAXILOG</span>
        </div>
        <div className="gate-date">{formattedDate}</div>
        
        <h2 className="gate-title">Driver Attendance Gate</h2>
        
        <div className="gate-options">
          <button 
            className="gate-btn gate-btn-present"
            onClick={() => onCheckIn('present')}
          >
            <UserCheck size={28} />
            Present Today
          </button>
          
          <button 
            className="gate-btn gate-btn-absent"
            onClick={() => onCheckIn('absent')}
          >
            <UserX size={28} />
            Absent Today
          </button>
        </div>
      </div>
    </div>
  );
}
