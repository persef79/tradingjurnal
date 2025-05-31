import { Trade, JournalData, DayJournal } from '../types';

type CsvRow = Record<string, string>;

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(';')) return ';';
  if (headerLine.includes('\t')) return '\t';
  return ',';
}

function parseCsvToObjects(csvData: string): CsvRow[] {
  const lines = csvData.trim().split('\n');
  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows.map(line => {
    const cols = line.split(delimiter).map(c => c.trim());
    const obj: CsvRow = {};
    headers.forEach((header, i) => {
      obj[header] = cols[i] ?? '';
    });
    return obj;
  });
}

export function parseMT5Data(csvData: string): JournalData {
  const rows = parseCsvToObjects(csvData);
  const trades: Trade[] = [];
  const openTradesMap = new Map<string, Partial<Trade>>();

  rows.forEach(row => {
    const type = row.type?.toLowerCase() || '';
    const orderId = row.order || '';
    const symbol = row.deal || row.symbol || '';
    const time = row.time || '';
    const volume = parseFloat(row.volume || '0') || 0;
    const price = parseFloat(row.price || '0') || 0;
    const profit = parseFloat(row.profit || '0') || 0;
    const commission = parseFloat(row.commission || '0') || 0;
    const swap = parseFloat(row.swap || '0') || 0;

    if (!orderId || !type || !symbol) return;

    const tradeTime = new Date(time);
    if (isNaN(tradeTime.getTime())) return;

    if (type === 'buy') {
      openTradesMap.set(orderId, {
        id: orderId,
        symbol,
        type: 'buy',
        openTime: tradeTime,
        openPrice: price,
        volume,
        commission,
        swap
      });
    } else if (type === 'close') {
      const openTrade = openTradesMap.get(orderId);
      if (openTrade && openTrade.openTime) {
        trades.push({
          id: orderId,
          symbol: openTrade.symbol || symbol,
          type: openTrade.type || 'buy',
          openTime: openTrade.openTime,
          closeTime: tradeTime,
          openPrice: openTrade.openPrice || 0,
          closePrice: price,
          volume: openTrade.volume || volume,
          profit,
          commission: (openTrade.commission || 0) + commission,
          swap: (openTrade.swap || 0) + swap
        });
        openTradesMap.delete(orderId);
      }
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
    dayJournals[dateStr].tradeCount++;
  });

  // Calculate statistics
  const statistics = calculateStatistics(trades);

  return {
    days: dayJournals,
    statistics
  };
}

function calculateStatistics(trades: Trade[]) {
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
      csv += `${day.date},${trade.symbol},${trade.type},${trade.openTime?.toISOString() || ''},${
        trade.closeTime?.toISOString() || ''
      },${trade.openPrice},${trade.closePrice},${trade.volume},${trade.profit},"${
        day.observations
      }"\n`;
    });
  });

  return csv;
}