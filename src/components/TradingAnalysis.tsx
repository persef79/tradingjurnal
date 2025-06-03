import React, { useMemo } from 'react';
import { Trade } from '../types';
import { BarChart3, Clock, Calendar } from 'lucide-react';

interface TradingAnalysisProps {
  trades: Trade[];
}

const TradingAnalysis: React.FC<TradingAnalysisProps> = ({ trades }) => {
  const timeAnalysis = useMemo(() => {
    const hourlyStats = new Array(24).fill(0).map(() => ({ wins: 0, losses: 0 }));
    const weekdayStats = new Array(7).fill(0).map(() => ({ wins: 0, losses: 0 }));
    
    trades.forEach(trade => {
      let closeTimeDate: Date | null = null;
      
      try {
        // Handle different possible formats of closeTime
        if (trade.closeTime instanceof Date) {
          closeTimeDate = trade.closeTime;
        } else if (typeof trade.closeTime === 'string' && trade.closeTime) {
          closeTimeDate = new Date(trade.closeTime);
        }
        
        // Verify we have a valid date before proceeding
        if (closeTimeDate && !isNaN(closeTimeDate.getTime())) {
          const hour = closeTimeDate.getHours();
          const weekday = closeTimeDate.getDay();
          
          if (trade.profit > 0) {
            hourlyStats[hour].wins++;
            weekdayStats[weekday].wins++;
          } else {
            hourlyStats[hour].losses++;
            weekdayStats[weekday].losses++;
          }
        }
      } catch (error) {
        console.warn('Invalid date format for trade:', trade);
      }
    });
    
    return {
      hourly: hourlyStats.map((stat, hour) => ({
        hour,
        winRate: stat.wins + stat.losses > 0 
          ? (stat.wins / (stat.wins + stat.losses)) * 100 
          : 0,
        total: stat.wins + stat.losses
      })),
      weekday: weekdayStats.map((stat, day) => ({
        day,
        winRate: stat.wins + stat.losses > 0 
          ? (stat.wins / (stat.wins + stat.losses)) * 100 
          : 0,
        total: stat.wins + stat.losses
      }))
    };
  }, [trades]);
  
  const getBestTradingTimes = () => {
    const significantTrades = 5; // Minimum trades for consideration
    return timeAnalysis.hourly
      .filter(stat => stat.total >= significantTrades)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
  };
  
  const getBestTradingDays = () => {
    const significantTrades = 5; // Minimum trades for consideration
    return timeAnalysis.weekday
      .filter(stat => stat.total >= significantTrades)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
  };
  
  const formatHour = (hour: number) => {
    return new Date(2024, 0, 1, hour).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };
  
  const getDayName = (day: number) => {
    return new Date(2024, 0, day + 4).toLocaleDateString('en-US', {
      weekday: 'long'
    });
  };
  
  const bestTimes = getBestTradingTimes();
  const bestDays = getBestTradingDays();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
        <BarChart3 className="mr-2" size={20} />
        Trading Pattern Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Trading Hours */}
        <div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <Clock className="mr-2" size={16} />
            Best Trading Hours
          </h3>
          <div className="space-y-3">
            {bestTimes.map((time, index) => (
              <div 
                key={time.hour}
                className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    {formatHour(time.hour)}
                  </span>
                  <div className="flex items-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {time.winRate.toFixed(1)}% Win Rate
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      ({time.total} trades)
                    </span>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 dark:bg-green-400 rounded-full h-2"
                    style={{ width: `${time.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Best Trading Days */}
        <div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <Calendar className="mr-2" size={16} />
            Best Trading Days
          </h3>
          <div className="space-y-3">
            {bestDays.map((day, index) => (
              <div 
                key={day.day}
                className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    {getDayName(day.day)}
                  </span>
                  <div className="flex items-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {day.winRate.toFixed(1)}% Win Rate
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      ({day.total} trades)
                    </span>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 dark:bg-green-400 rounded-full h-2"
                    style={{ width: `${day.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAnalysis;