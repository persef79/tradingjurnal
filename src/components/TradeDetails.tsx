import React from 'react';
import { X } from 'lucide-react';
import { Trade } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface TradeDetailsProps {
  trade: Trade;
  onClose: () => void;
}

const TradeDetails: React.FC<TradeDetailsProps> = ({ trade, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Trade Details - {trade.symbol}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Trade Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Trade ID:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{trade.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Symbol:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{trade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Type:</span>
                  <span className={`font-medium ${
                    trade.type === 'buy' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Volume:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{trade.volume.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Profit:</span>
                  <span className={`font-medium ${
                    trade.profit >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(trade.profit)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Execution Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Open Time:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(trade.openTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Close Time:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(trade.closeTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Open Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{trade.openPrice.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Close Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{trade.closePrice.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(trade.closeTime.getTime() - trade.openTime.getTime())}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {(trade.commission !== undefined || trade.swap !== undefined) && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Costs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trade.commission !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Commission:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(trade.commission)}</span>
                  </div>
                )}
                {trade.swap !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Swap:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(trade.swap)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Price Movement:</span>
                <span className={`font-medium ${
                  trade.type === 'buy'
                    ? trade.closePrice > trade.openPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    : trade.closePrice < trade.openPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {calculatePriceDifference(trade)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Net Result:</span>
                <span className={`font-medium ${
                  (trade.profit - (trade.commission || 0) - (trade.swap || 0)) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(trade.profit - (trade.commission || 0) - (trade.swap || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format duration
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper function to calculate price difference
function calculatePriceDifference(trade: Trade): string {
  const difference = trade.closePrice - trade.openPrice;
  const percentChange = (difference / trade.openPrice) * 100;
  
  const direction = difference > 0 ? '+' : '';
  return `${direction}${difference.toFixed(5)} (${direction}${percentChange.toFixed(2)}%)`;
}

export default TradeDetails;