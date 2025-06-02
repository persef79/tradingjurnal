import { Trade, JournalData, DayJournal } from '../types';

type CsvRow = Record<string, string>;

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(';')) return ';';
  if (headerLine.includes('\t')) return '\t';
  return ',';
}

function normalizeHeader(header: string): string {
  return header.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getTradeActionType(type: string): 'open' | 'close' | '' {
  const normalizedType = type.toLowerCase().trim();
  
  if (normalizedType === 'buy') return 'open';
  if (normalizedType === 'close') return 'close';
  
  return '';
}

function getTradeDirection(direction: string): 'buy' | 'sell' {
  const normalizedDirection = direction?.toLowerCase().trim() || '';
  
  if (normalizedDirection === 'long') return 'buy';
  if (normalizedDirection === 'short') return 'sell';
  
  return 'buy'; // Default to buy if direction is unclear
}

function parseCsvToObjects(csvData: string): CsvRow[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or contains only headers');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim());
    const row: CsvRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

function parseDateTime(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
}

function parseTrades(rows: CsvRow[]): Trade[] {
  const trades: Trade[] = [];
  const openTradesMap = new Map<string, Partial<Trade>>();

  rows.forEach((row, index) => {
    try {
      const symbol = row['Deal'] || '';
      const timeStr = row['Time'] || '';
      const type = row['Type'] || '';
      const direction = row['Direction'] || '';
      const volume = parseFloat(row['Volume']) || 0;
      const price = parseFloat(row['Price']) || 0;
      const order = row['Order'] || '';
      const profit = parseFloat(row['Profit']) || 0;
      const commission = parseFloat(row['Commission']) || 0;
      const swap = parseFloat(row['Swap']) || 0;

      const time = parseDateTime(timeStr);
      const action = getTradeActionType(type);
      const tradeDirection = getTradeDirection(direction);

      if (action === 'open') {
        openTradesMap.set(order, {
          id: order,
          symbol,
          type: tradeDirection,
          openTime: time,
          openPrice: price,
          volume,
          commission,
          swap
        });
      } else if (action === 'close') {
        const openTrade = openTradesMap.get(order);
        if (openTrade && openTrade.openTime) {
          trades.push({
            id: order,
            symbol: openTrade.symbol || symbol,
            type: openTrade.type || 'buy',
            openTime: openTrade.openTime,
            closeTime: time,
            openPrice: openTrade.openPrice || 0,
            closePrice: price,
            volume: openTrade.volume || volume,
            profit,
            commission: (openTrade.commission || 0) + commission,
            swap: (openTrade.swap || 0) + swap
          });
          openTradesMap.delete(order);
        }
      }
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
    }
  });

  return trades;
}

export function parseMT5Data(csvData: string): JournalData {
  try {
    const rows = parseCsvToObjects(csvData);
    if (rows.length === 0) {
      throw new Error('No valid rows found in the CSV file. Please check the file format.');
    }

    const trades = parseTrades(rows);
    if (trades.length === 0) {
      throw new Error('No valid trades found in the CSV file. Please check the file format.');
    }

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
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse MT5 data: ${error.message}`);
    }
    throw error;
  }
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