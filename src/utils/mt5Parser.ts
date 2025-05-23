import { Trade, JournalData, DayJournal } from '../types';

/**
 * Parse MT5 CSV report data
 * Format: Deal,Time,Type,Direction,Volume,Price,Order,Commission,Swap,Profit
 */
export function parseMT5Data(csvData: string): JournalData {
  const lines = csvData.trim().split('\n');
  const dataLines = lines.slice(1); // skip header
  const trades: Trade[] = [];
  const openQueue: Partial<Trade>[] = [];

  dataLines.forEach(line => {
    const [
      deal,
      time,
      type,
      direction,
      volumeStr,
      priceStr,
      order,
      commissionStr,
      swapStr,
      profitStr
    ] = line.split(',').map(item => item.trim());

    const volume = parseFloat(volumeStr);
    const price = parseFloat(priceStr);
    const commission = parseFloat(commissionStr);
    const swap = parseFloat(swapStr);
    const profit = parseFloat(profitStr);
    const date = new Date(time);

    if (type === 'buy' || type === 'sell') {
      openQueue.push({
        id: order,
        symbol: deal,
        type: type as 'buy' | 'sell',
        openTime: date,
        openPrice: price,
        volume,
        commission,
        swap,
      });
    } else if (type === 'close') {
      // Găsim primul trade deschis cu volum compatibil
      let remainingVolume = volume;

      while (remainingVolume > 0 && openQueue.length > 0) {
        const openTrade = openQueue[0];
        const openVolume = openTrade.volume || 0;

        const usedVolume = Math.min(openVolume, remainingVolume);

        const volumeRatio = usedVolume / openVolume;

        trades.push({
          id: order,
          symbol: deal,
          type: openTrade.type as 'buy' | 'sell',
          openTime: openTrade.openTime as Date,
          closeTime: date,
          openPrice: openTrade.openPrice as number,
          closePrice: price,
          volume: usedVolume,
          commission: (openTrade.commission || 0) * volumeRatio + commission * volumeRatio,
          swap: (openTrade.swap || 0) * volumeRatio + swap * volumeRatio,
          profit: profit * volumeRatio
        });

        remainingVolume -= usedVolume;

        if (usedVolume === openVolume) {
          openQueue.shift(); // eliminăm trade-ul complet închis
        } else {
          if (openTrade.volume) openTrade.volume -= usedVolume;
          if (openTrade.commission) openTrade.commission *= (1 - volumeRatio);
          if (openTrade.swap) openTrade.swap *= (1 - volumeRatio);
        }
      }
    }
  });

  // Grupare pe zile
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
