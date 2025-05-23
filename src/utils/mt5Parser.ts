import { Trade, JournalData, DayJournal } from '../types';

type CsvRow = Record<string, string>;

/**
 * Detectează delimitatorul dintr-un CSV (`,`, `;` sau tab)
 */
function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(';')) return ';';
  if (headerLine.includes('\t')) return '\t';
  return ','; // default
}

/**
 * Parsează un CSV în array de obiecte cu cheia numele coloanei
 */
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

/**
 * Funcție flexibilă pentru parsarea datelor MT5 din CSV-uri cu formate diferite
 */
export function parseMT5Data(csvData: string): JournalData {
  const rows = parseCsvToObjects(csvData);

  const trades: Trade[] = [];
  const openTradesMap = new Map<string, Partial<Trade>>(); // key = order/ticket

  // Detectăm câmpurile importante (folosim aliasuri comune)
  // Cheile din CSV sunt convertite la lowercase pentru uniformitate
  const colKeys = Object.keys(rows[0] || {});

  const keyMap = {
    symbol: colKeys.find(k => ['deal', 'symbol'].includes(k)) || '',
    time: colKeys.find(k => ['time', 'open', 'open time'].includes(k)) || '',
    type: colKeys.find(k => ['type'].includes(k)) || '',
    direction: colKeys.find(k => ['direction'].includes(k)) || '',
    volume: colKeys.find(k => ['volume'].includes(k)) || '',
    price: colKeys.find(k => ['price', 'open price', 'close price'].includes(k)) || '',
    order: colKeys.find(k => ['order', 'ticket'].includes(k)) || '',
    commission: colKeys.find(k => ['commission', 'commissions'].includes(k)) || '',
    swap: colKeys.find(k => ['swap'].includes(k)) || '',
    profit: colKeys.find(k => ['profit'].includes(k)) || '',
    closeTime: colKeys.find(k => ['close', 'close time', 'close_time'].includes(k)) || '', // optional close time separate
  };

  // Functie de parsare float, returneaza 0 daca nu se poate
  const parseNumber = (val: string) => {
    if (!val) return 0;
    const v = val.replace(',', '.'); // in caz ca vin cu virgula
    return isNaN(parseFloat(v)) ? 0 : parseFloat(v);
  };

  // Functie pentru parsarea timpului - intoarce Date sau null
  const parseDate = (val: string) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  rows.forEach(row => {
    // Detectăm dacă rândul e open sau close
    // Unele CSV-uri au type = buy/sell pentru open si close pentru închidere
    // Dacă type e buy sau sell -> open
    // Dacă type e close -> închidere
    const typeVal = row[keyMap.type]?.toLowerCase() || '';
    const directionVal = row[keyMap.direction]?.toLowerCase() || '';
    const orderId = row[keyMap.order] || '';

    // Pentru simbol, unele csv au valori gen "US30.cash" direct
    const symbolVal = row[keyMap.symbol] || '';

    if (!orderId || !typeVal) return; // fără id/order sau tip nu putem procesa

    // Deschidere
    if (typeVal === 'buy' || typeVal === 'sell') {
      openTradesMap.set(orderId, {
        id: orderId,
        symbol: symbolVal,
        type: typeVal as 'buy' | 'sell',
        openTime: parseDate(row[keyMap.time]),
        openPrice: parseNumber(row[keyMap.price]),
        volume: parseNumber(row[keyMap.volume]),
        commission: parseNumber(row[keyMap.commission]),
        swap: parseNumber(row[keyMap.swap]),
      });
    } 
    // Închidere
    else if (typeVal === 'close') {
      const openTrade = openTradesMap.get(orderId);
      if (openTrade && openTrade.id) {
        trades.push({
          ...openTrade as Trade,
          closeTime: parseDate(row[keyMap.time]) || undefined,
          closePrice: parseNumber(row[keyMap.price]),
          profit: parseNumber(row[keyMap.profit]),
          commission: (openTrade.commission || 0) + parseNumber(row[keyMap.commission]),
          swap: (openTrade.swap || 0) + parseNumber(row[keyMap.swap]),
        });
        openTradesMap.delete(orderId);
      } else {
        // Dacă nu avem deschidere (poate fi doar închidere), o adăugăm direct ca tranzacție simplă
        trades.push({
          id: orderId,
          symbol: symbolVal,
          type: 'close',
          openTime: undefined,
          openPrice: 0,
          closeTime: parseDate(row[keyMap.time]) || undefined,
          closePrice: parseNumber(row[keyMap.price]),
          volume: parseNumber(row[keyMap.volume]),
          profit: parseNumber(row[keyMap.profit]),
          commission: parseNumber(row[keyMap.commission]),
          swap: parseNumber(row[keyMap.swap]),
        });
      }
    } else {
      // Alte tipuri (dacă există), putem ignora sau extinde dacă vrei
    }
  });

  // Grupare după zi
  const dayJournals: Record<string, DayJournal> = {};

  trades.forEach(trade => {
    const dateStr = trade.closeTime?.toISOString().split('T')[0] || 'unknown';

    if (!dayJournals[dateStr]) {
      dayJournals[dateStr] = {
        date: dateStr,
        trades: [],
        observations: '',
        totalProfit: 0,
        tradeCount: 0,
      };
    }

    dayJournals[dateStr].trades.push(trade);
    dayJournals[dateStr].totalProfit += trade.profit;
    dayJournals[dateStr].tradeCount += 1;
  });

  // Calcul statistici
  const statistics = calculateStatistics(trades);

  return {
    days: dayJournals,
    statistics,
  };
}

export function calculateStatistics(trades: Trade[]) {
  const winningTrades = trades.filter(trade => trade.profit > 0);
  const losingTrades = trades.filter(trade => trade.profit <= 0);

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const averageWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length
      : 0;

  const averageLoss =
    losingTrades.length > 0
      ? losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length
      : 0;

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(trade => trade.profit)) : 0;

  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(trade => trade.profit)) : 0;

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalProfit,
    winRate,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
  };
}

export function exportToCSV(journalData: JournalData): string {
  let csv = "Date,Symbol,Type,Open Time,Close Time,Open Price,Close Price,Volume,Profit,Observations\n";

  Object.values(journalData.days).forEach(day => {
    day.trades.forEach(trade => {
      csv += `${day.date},${trade.symbol},${trade.type},${trade.openTime?.toISOString() || ''},${trade.closeTime?.toISOString() || ''},${trade.openPrice},${trade.closePrice},${trade.volume},${trade.profit},"${day.observations}"\n`;
    });
  });

  return csv;
}
