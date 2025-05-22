// Define types for the trading journal application

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  openTime: Date;
  closeTime: Date;
  openPrice: number;
  closePrice: number;
  profit: number;
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  commission?: number;
  swap?: number;
}

export interface DayJournal {
  date: string; // ISO format YYYY-MM-DD
  trades: Trade[];
  observations: string;
  totalProfit: number;
  tradeCount: number;
}

export interface JournalData {
  days: Record<string, DayJournal>;
  statistics: JournalStatistics;
}

export interface JournalStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  hasTrading: boolean;
  profit: number;
  tradeCount: number;
}