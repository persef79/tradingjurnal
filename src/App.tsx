import React, { useState, useEffect } from 'react';
import { CalendarDay, JournalData } from './types';
import { generateCalendarDays } from './utils/formatters';
import { exportToCSV } from './utils/mt5Parser';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Components
import Header from './components/Header';
import Calendar from './components/Calendar';
import DailyJournal from './components/DailyJournal';
import StatisticsPanel from './components/StatisticsPanel';
import ImportModal from './components/ImportModal';

function App() {
  // App state
  const [journalData, setJournalData] = useState<JournalData>({
    days: {},
    statistics: {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0
    }
  });
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Load data when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'trading_data', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.data) {
              setJournalData(userData.data);
              
              // Set selected date to the most recent trading day
              const dates = Object.keys(userData.data.days).sort().reverse();
              if (dates.length > 0) {
                setSelectedDate(dates[0]);
                const [year, month] = dates[0].split('-').map(Number);
                setCurrentMonth(new Date(year, month - 1, 1));
              }
            }
          }
        } catch (error) {
          console.error('Error loading trading data:', error);
        }
      } else {
        // Reset state when user logs out
        setJournalData({
          days: {},
          statistics: {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalProfit: 0,
            winRate: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0
          }
        });
        setSelectedDate(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const journalDays = Object.entries(journalData.days).reduce(
      (acc, [date, data]) => ({
        ...acc,
        [date]: { profit: data.totalProfit, tradeCount: data.tradeCount }
      }),
      {}
    );
    
    setCalendarDays(generateCalendarDays(currentMonth, journalDays));
  }, [currentMonth, journalData]);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleImportData = (data: JournalData) => {
    setJournalData(data);
    
    const dates = Object.keys(data.days).sort().reverse();
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
      const [year, month] = dates[0].split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };
  
  const handleExportData = () => {
    if (Object.keys(journalData.days).length === 0) {
      alert('No data to export. Please import data first.');
      return;
    }
    
    const csvData = exportToCSV(journalData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_journal_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleUpdateObservations = (date: string, observations: string) => {
    setJournalData(prevData => {
      const updatedDays = { ...prevData.days };
      
      if (updatedDays[date]) {
        updatedDays[date] = {
          ...updatedDays[date],
          observations
        };
      }
      
      return {
        ...prevData,
        days: updatedDays
      };
    });
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header 
        onOpenImport={() => setShowImportModal(true)} 
        onExport={handleExportData}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <StatisticsPanel statistics={journalData.statistics} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Calendar 
              calendarDays={calendarDays}
              currentMonth={currentMonth}
              onDayClick={handleDayClick}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              selectedDate={selectedDate}
            />
          </div>
          
          <div className="lg:col-span-3">
            <DailyJournal 
              dayJournal={selectedDate ? journalData.days[selectedDate] : null}
              onUpdateObservations={handleUpdateObservations}
            />
          </div>
        </div>
      </main>
      
      {showImportModal && (
        <ImportModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImportData}
        />
      )}
    </div>
  );
}

export default App;