import { Trade, JournalData, DayJournal } from '../types';

type CsvRow = Record<string, string>;

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(';')) return ';';
  if (headerLine.includes('\t')) return '\t';
  return ',';
}

function normalizeHeader(header: string): string {
  // Remove special characters and whitespace, convert to lowercase
  return header.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getTradeActionType(type: string): 'open' | 'close' | '' {
  // Normalize the type string
  const normalizedType = type.toLowerCase().trim();
  
  // Map common MT5 trade type variations to actions
  if (['buy', 'sell', 'balance', 'in', 'opened'].includes(normalizedType)) {
    return 'open';
  }
  if (['out', 'closed', 'close'].includes(normalizedType)) {
    return 'close';
  }
  return '';
}

function getTradeDirection(type: string): 'buy' | 'sell' {
  // Normalize the type string
  const normalizedType = type.toLowerCase().trim();
  return normalizedType.includes('sell') ? 'sell' : 'buy';
}

function parseCsvToObjects(csvData: string): CsvRow[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or contains only headers');
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = lines[0].split(delimiter);
  
  // Create a mapping of normalized headers to original headers
  const headerMap = new Map<string, string>();
  rawHeaders.forEach(header => {
    const normalized = normalizeHeader(header);
    headerMap.set(normalized, header.trim());
  });

  // Validate required headers are present
  const requiredHeaders = ['type', 'order', 'time', 'price'];
  const missingHeaders = requiredHeaders.filter(req => 
    !Array.from(headerMap.keys()).some(h => h.includes(req))
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const rows = lines.slice(1);
  return rows.map(line => {
    const values = line.split(delimiter).map(c => c.trim());
    const obj: CsvRow = {};
    
    Array.from(headerMap.entries()).forEach(([normalized, original], index) => {
      obj[normalized] = values[index] || '';
    });
    
    return obj;
  });
}

export function parseMT5Data(csvData: string): JournalData {
  try {
    const rows = parseCsvToObjects(csvData);
    const trades: Trade[] = [];
    const openTradesMap = new Map<string, Partial<Trade>>();
    let processedRows = 0;

    rows.forEach((row, index) => {
      // Find the actual column names in the CSV that correspond to our expected fields
      const typeField = Object.keys(row).find(k => k.includes('type')) || 'type';
      const orderField = Object.keys(row).find(k => k.includes('order')) || 'order';
      const symbolField = Object.keys(row).find(k => k.includes('symbol') || k.includes('deal')) || 'symbol';
      const timeField = Object.keys(row).find(k => k.includes('time')) || 'time';
      const volumeField = Object.keys(row).find(k => k.includes('volume') || k.includes('lot')) || 'volume';
      const priceField = Object.keys(row).find(k => k.includes('price')) || 'price';
      const profitField = Object.keys(row).find(k => k.includes('profit')) || 'profit';
      const commissionField = Object.keys(row).find(k => k.includes('commission')) || 'commission';
      const swapField = Object.keys(row).find(k => k.includes('swap')) || 'swap';

      const action = getTradeActionType(row[typeField]);
      const direction = getTradeDirection(row[typeField]);
      const orderId = row[orderField];
      const symbol = row[symbolField];
      const time = row[timeField];
      const volume = parseFloat(row[volumeField]) || 0;
      const price = parseFloat(row[priceField]) || 0;
      const profit = parseFloat(row[profitField]) || 0;
      const commission = parseFloat(row[commissionField]) || 0;
      const swap = parseFloat(row[swapField]) || 0;

      if (!orderId || !action) {
        console.warn(`Skipping row ${index + 2}: Invalid order ID or trade type`);
        return;
      }

      const tradeTime = new Date(time);
      if (isNaN(tradeTime.getTime())) {
        console.warn(`Skipping row ${index + 2}: Invalid date format`);
        return;
      }

      processedRows++;

      if (action === 'open') {
        openTradesMap.set(orderId, {
          id: orderId,
          symbol,
          type: direction,
          openTime: tradeTime,
          openPrice: price,
          volume,
          commission,
          swap
        });
      } else if (action === 'close') {
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

    if (processedRows === 0) {
      throw new Error('No valid rows found in the CSV file. Please check the file format.');
    }

    if (trades.length === 0) {
      throw new Error('No complete trades found. Make sure the CSV contains both opening and closing positions.');
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