// Format currency amount with the appropriate sign and decimal places
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage with appropriate decimal places
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Format date and time in a readable format
export function formatDateTime(date: Date): string {
  return new Intl.NumberFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

// Format date only in a readable format
export function formatDate(date: Date): string {
  return new Intl.NumberFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
}

// Generate calendar days for a given month
export function generateCalendarDays(
  date: Date,
  journalDays: Record<string, { profit: number; tradeCount: number }>
) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate days from the previous month to show
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate days from the next month to show
  const totalDaysToShow = 42; // 6 rows of 7 days
  const daysInMonth = lastDay.getDate();
  const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
  
  const days = [];
  
  // Add days from the previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = prevMonthLastDay - daysFromPrevMonth + 1; i <= prevMonthLastDay; i++) {
    const dateStr = new Date(year, month - 1, i).toISOString().split('T')[0];
    const journalDay = journalDays[dateStr];
    
    days.push({
      date: dateStr,
      dayOfMonth: i,
      isCurrentMonth: false,
      hasTrading: !!journalDay,
      profit: journalDay?.profit || 0,
      tradeCount: journalDay?.tradeCount || 0
    });
  }
  
  // Add days from the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(year, month, i).toISOString().split('T')[0];
    const journalDay = journalDays[dateStr];
    
    days.push({
      date: dateStr,
      dayOfMonth: i,
      isCurrentMonth: true,
      hasTrading: !!journalDay,
      profit: journalDay?.profit || 0,
      tradeCount: journalDay?.tradeCount || 0
    });
  }
  
  // Add days from the next month
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const dateStr = new Date(year, month + 1, i).toISOString().split('T')[0];
    const journalDay = journalDays[dateStr];
    
    days.push({
      date: dateStr,
      dayOfMonth: i,
      isCurrentMonth: false,
      hasTrading: !!journalDay,
      profit: journalDay?.profit || 0,
      tradeCount: journalDay?.tradeCount || 0
    });
  }
  
  return days;
}