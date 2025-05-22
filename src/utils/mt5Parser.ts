import { Trade, JournalData, DayJournal } from '../types';

/**
 * Parse MT5 CSV report data
 * Expected format: 
 * Deal,Time,Type,Direction,Volume,Price,Order,Commission,Swap,Profit
 */
export function parseMT5Data(csvData: string): JournalData {
  const lines = csvData.trim().split('\n');
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const trades: Trade[] = [];
  let currentTradeId = '';
  let currentTrade: Partial<Trade> = {};
  
  dataLines.forEach(line => {
    const [
      deal, 
      time, 
      type, 
      direction, 
      volume, 
      price, 
      order, 
      commission, 
      swap, 
      profit
    ] = line.split(',').map(item => item.trim());
    
    // Parse open position
    if (type === 'buy' || type === 'sell') {
      currentTradeId = order;
      currentTrade = {
        id: order,
        symbol: deal.split(' ')[0], // Extract symbol from deal text
        type: type as 'buy' | 'sell',
        openTime: new Date(time),
        openPrice: parseFloat(price),
        volume: parseFloat(volume),
        commission: parseFloat(commission),
        swap: parseFloat(swap),
      };
    } 
    // Parse close position
    else if (type === 'close' && order === currentTradeId) {
      if (currentTrade.id) {
        trades.push({
          ...currentTrade as Trade,
          closeTime: new Date(time),
          closePrice: parseFloat(price),
          profit: parseFloat(profit),
          commission: (currentTrade.commission || 0) + parseFloat(commission),
          swap: (currentTrade.swap || 0) + parseFloat(swap),
        });
      }
      currentTrade = {};
    }
  });
  
  // Group trades by day
  const dayJournals: Record<string, DayJournal> = {};
  
  trades.forEach(trade => {
    const dateStr = trade.closeTime.toISOString().split('T')[0];
    
    if (!dayJournals[dateStr]) {
      dayJournals[dateStr] = {
        date: dateStr,
        trades: [],
        observations: '',
        totalProfit: 0,
        tradeCount: 0
      };
    }
    
    dayJournals[dateStr].trades.push(trade);
    dayJournals[dateStr].totalProfit += trade.profit;
    dayJournals[dateStr].tradeCount += 1;
  });
  
  // Calculate statistics
  const statistics = calculateStatistics(trades);
  
  return {
    days: dayJournals,
    statistics
  };
}

export function calculateStatistics(trades: Trade[]) {
  const winningTrades = trades.filter(trade => trade.profit > 0);
  const losingTrades = trades.filter(trade => trade.profit <= 0);
  
  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const averageWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length 
    : 0;
    
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(trade => trade.profit)) 
    : 0;
    
  const largestLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(trade => trade.profit)) 
    : 0;
  
  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalProfit,
    winRate,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss
  };
}

export function exportToCSV(journalData: JournalData): string {
  let csv = "Date,Symbol,Type,Open Time,Close Time,Open Price,Close Price,Volume,Profit,Observations\n";
  
  Object.values(journalData.days).forEach(day => {
    day.trades.forEach(trade => {
      csv += `${day.date},${trade.symbol},${trade.type},${trade.openTime.toISOString()},${trade.closeTime.toISOString()},${trade.openPrice},${trade.closePrice},${trade.volume},${trade.profit},"${day.observations}"\n`;
    });
  });
  
  return csv;
}