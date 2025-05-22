import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarDay } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CalendarProps {
  calendarDays: CalendarDay[];
  currentMonth: Date;
  onDayClick: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: string | null;
}

const Calendar: React.FC<CalendarProps> = ({
  calendarDays,
  currentMonth,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  selectedDate,
}) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={onPrevMonth}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={onNextMonth}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const hasTrading = day.hasTrading;
          
          // Calculate classes based on profit and selection
          let dayClasses = "relative h-16 p-1 rounded-md flex flex-col items-center justify-start cursor-pointer transition-all";
          
          if (!day.isCurrentMonth) {
            dayClasses += " opacity-40";
          }
          
          if (isSelected) {
            dayClasses += " ring-2 ring-blue-500 dark:ring-blue-400";
          }
          
          if (hasTrading) {
            if (day.profit > 0) {
              dayClasses += " bg-green-50 dark:bg-green-900/20";
            } else if (day.profit < 0) {
              dayClasses += " bg-red-50 dark:bg-red-900/20";
            } else {
              dayClasses += " bg-gray-50 dark:bg-gray-700/30";
            }
          } else {
            dayClasses += " hover:bg-gray-100 dark:hover:bg-gray-700/50";
          }
          
          return (
            <div
              key={day.date}
              className={dayClasses}
              onClick={() => hasTrading && onDayClick(day.date)}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {day.dayOfMonth}
              </span>
              
              {hasTrading && (
                <>
                  <span className={`text-xs mt-1 font-semibold ${day.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(day.profit)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {day.tradeCount} {day.tradeCount === 1 ? 'trade' : 'trades'}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;