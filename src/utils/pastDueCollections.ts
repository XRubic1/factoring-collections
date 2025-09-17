import { Loan, Payment, Client } from '../types';

export interface MissedInstallment {
  installmentNumber: number;
  dueDate: Date;
  daysPastDue: number;
  amount: number;
  partialPayment: number;
  remainingAmount: number;
  isPartial: boolean;
}

export interface LoanWithMissedInstallments extends Loan {
  missedInstallments: MissedInstallment[];
  totalMissedAmount: number;
  totalMissedCount: number;
  maxDaysPast: number;
  accountExecutive: string;
}

export const getPastDueLoans = (
  loans: Loan[],
  payments: Payment[],
  clients: Client[]
): LoanWithMissedInstallments[] => {
  const today = new Date();
  const loanGroups: { [loanId: string]: LoanWithMissedInstallments } = {};
  
  loans
    .filter(loan => loan.installmentsLeft > 0)
    .forEach(loan => {
      const missedInstallments: MissedInstallment[] = [];
      
      // Calculate when this loan should have been collected
      const firstInstallment = new Date(loan.firstInstallmentDate);
      const totalWeeks = loan.totalInstallments;
      
      // Check each week from the first installment to today
      for (let week = 0; week < totalWeeks; week++) {
        const dueDate = new Date(firstInstallment);
        dueDate.setDate(firstInstallment.getDate() + (week * 7));
        
        // Skip future weeks
        if (dueDate > today) continue;
        
        // Check if we've moved into a new week since the due date
        const dueDateWeek = getWeekNumber(dueDate);
        const todayWeek = getWeekNumber(today);
        const dueDateYear = dueDate.getFullYear();
        const todayYear = today.getFullYear();
        
        // Consider it past due if:
        // 1. It's been more than 7 days, OR
        // 2. We've moved into a new week (even if less than 7 days)
        const isNewWeek = (todayYear > dueDateYear) || 
                         (todayYear === dueDateYear && todayWeek > dueDateWeek);
        
        // Check if this installment is already closed
        const isInstallmentClosed = loan.closedInstallments?.some(closed => closed.installmentNumber === week + 1);
        
        if (isInstallmentClosed) {
          continue; // Skip this installment as it's already closed
        }
        
        // Since this installment is not closed, it's available for payment
        const daysPast = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only add if it's past due (more than 7 days past due)
        if ((daysPast > 7 || isNewWeek) && daysPast > 0) {
          missedInstallments.push({
            installmentNumber: week + 1,
            dueDate,
            daysPastDue: daysPast,
            amount: loan.installmentAmount,
            partialPayment: 0,
            remainingAmount: loan.installmentAmount,
            isPartial: false
          });
        }
      }
      
      // Only add loans that have missed installments
      if (missedInstallments.length > 0) {
        const totalAmount = missedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
        const maxDaysPast = Math.max(...missedInstallments.map(inst => inst.daysPastDue));
        
        loanGroups[loan.loanId] = {
          ...loan,
          missedInstallments,
          totalMissedAmount: totalAmount,
          totalMissedCount: missedInstallments.length,
          maxDaysPast,
          accountExecutive: clients.find(client => client.name === loan.clientName)?.accountExecutive || 'Unassigned'
        };
      }
    });
  
  // Convert to array and sort by most past due first
  return Object.values(loanGroups).sort((a, b) => b.maxDaysPast - a.maxDaysPast);
};

export const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const formatDaysToReadable = (days: number) => {
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      return `${weeks} week${weeks !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    }
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const weeks = Math.floor(remainingDays / 7);
      const finalDays = remainingDays % 7;
      if (weeks === 0) {
        return `${months} month${months !== 1 ? 's' : ''} ${finalDays} day${finalDays !== 1 ? 's' : ''}`;
      } else if (finalDays === 0) {
        return `${months} month${months !== 1 ? 's' : ''} ${weeks} week${weeks !== 1 ? 's' : ''}`;
      } else {
        return `${months} month${months !== 1 ? 's' : ''} ${weeks} week${weeks !== 1 ? 's' : ''} ${finalDays} day${finalDays !== 1 ? 's' : ''}`;
      }
    }
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    const finalDays = remainingDays % 30;
    
    if (months === 0 && finalDays === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else if (finalDays === 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} ${finalDays} day${finalDays !== 1 ? 's' : ''}`;
    }
  }
};
