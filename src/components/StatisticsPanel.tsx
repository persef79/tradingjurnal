import React from 'react';
import { JournalStatistics } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface StatisticsPanelProps {
  statistics: JournalStatistics;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Trading Performance
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Profit/Loss */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              statistics.totalProfit >= 0 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P/L</p>
              <p className={`text-xl font-bold ${
                statistics.totalProfit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(statistics.totalProfit)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Win Rate */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatPercent(statistics.winRate)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Winning Trades */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Winning Trades</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {statistics.winningTrades}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  / {statistics.totalTrades}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Losing Trades */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Losing Trades</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {statistics.losingTrades}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  / {statistics.totalTrades}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Average Win */}
        <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Win</span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(statistics.averageWin)}
          </span>
        </div>
        
        {/* Average Loss */}
        <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Loss</span>
          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(statistics.averageLoss)}
          </span>
        </div>
        
        {/* Largest Win */}
        <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Largest Win</span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(statistics.largestWin)}
          </span>
        </div>
        
        {/* Largest Loss */}
        <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Largest Loss</span>
          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(statistics.largestLoss)}
          </span>
        </div>
      </div>
      
      {/* Profit Factor */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
          Additional Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit Factor</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {calculateProfitFactor(statistics)}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Win/Loss Ratio</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {calculateWinLossRatio(statistics)}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk-Reward Ratio</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {calculateRiskRewardRatio(statistics)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions to calculate additional metrics
function calculateProfitFactor(statistics: JournalStatistics): string {
  if (statistics.losingTrades === 0 || statistics.averageLoss === 0) {
    return "∞";
  }
  
  const grossProfit = statistics.winningTrades * statistics.averageWin;
  const grossLoss = Math.abs(statistics.losingTrades * statistics.averageLoss);
  
  return (grossProfit / grossLoss).toFixed(2);
}

function calculateWinLossRatio(statistics: JournalStatistics): string {
  if (statistics.losingTrades === 0) {
    return "∞";
  }
  
  return (statistics.winningTrades / statistics.losingTrades).toFixed(2);
}

function calculateRiskRewardRatio(statistics: JournalStatistics): string {
  if (statistics.averageLoss === 0) {
    return "∞";
  }
  
  return (Math.abs(statistics.averageWin) / Math.abs(statistics.averageLoss)).toFixed(2);
}

export default StatisticsPanel;