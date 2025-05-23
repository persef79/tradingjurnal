import React, { useState } from 'react';
import { DayJournal, Trade } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import TradeDetails from './TradeDetails';

interface DailyJournalProps {
  dayJournal: DayJournal | null;
  onUpdateObservations: (date: string, observations: string) => void;
}

const DailyJournal: React.FC<DailyJournalProps> = ({ 
  dayJournal, 
  onUpdateObservations 
}) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [observations, setObservations] = useState<string>('');
  
  React.useEffect(() => {
    if (dayJournal) {
      setObservations(dayJournal.observations);
    }
  }, [dayJournal]);
  
  if (!dayJournal) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Select a trading day from the calendar
        </p>
      </div>
    );
  }
  
  const date = new Date(dayJournal.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const handleSaveObservations = () => {
    onUpdateObservations(dayJournal.date, observations);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {formattedDate}
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          dayJournal.totalProfit >= 0 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {formatCurrency(dayJournal.totalProfit)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
            Trades ({dayJournal.tradeCount})
          </h3>
          <div className="overflow-auto max-h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dayJournal.trades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{trade.symbol}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.type === 'buy' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDateTime(trade.closeTime)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      trade.profit >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(trade.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
            Trading Observations
          </h3>
          <div className="flex flex-col h-[400px]">
            <textarea
              className="w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
              placeholder="Add your observations and lessons learned for this trading day..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md 
                           transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
                onClick={handleSaveObservations}
              >
                Save Observations
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {selectedTrade && (
        <TradeDetails 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
        />
      )}
    </div>
  );
};

export default DailyJournal;