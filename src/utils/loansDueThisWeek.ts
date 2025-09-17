import { Loan, Payment, Client } from '../types';

export interface WeeklyStatus {
  installmentNumber: number;
  dueDate: Date;
  daysSinceDue: number;
  amount: number;
  status: 'due-today' | 'due-this-week' | 'due-future' | 'overdue';
  partialPayment: number;
  remainingAmount: number;
  isPartial: boolean;
}

export interface LoanWithWeeklyStatus extends Loan {
  weeklyStatus: WeeklyStatus[];
  totalAmount: number;
  accountExecutive: string;
}

export const getLoansDueThisWeek = (
  loans: Loan[],
  payments: Payment[],
  clients: Client[],
  startDate: string,
  endDate: string
): LoanWithWeeklyStatus[] => {
  const selectedStartDate = new Date(startDate);
  const selectedEndDate = new Date(endDate);
  const today = new Date();
  const loanGroups: { [loanId: string]: LoanWithWeeklyStatus } = {};
  
  loans
    .filter(loan => loan.installmentsLeft > 0)
    .forEach(loan => {
      const weeklyStatus: WeeklyStatus[] = [];
      
      // Calculate when this loan should have been collected
      const firstInstallment = new Date(loan.firstInstallmentDate);
      const totalWeeks = loan.totalInstallments;
      
      // Check each week from the first installment
      for (let week = 0; week < totalWeeks; week++) {
        const dueDate = new Date(firstInstallment);
        dueDate.setDate(firstInstallment.getDate() + (week * 7));
        
        const installmentNumber = week + 1;
        
        // Check if this installment is already closed by looking at the loan's closedInstallments
        const isInstallmentClosed = loan.closedInstallments?.some(closed => closed.installmentNumber === installmentNumber);
        
        if (isInstallmentClosed) {
          continue; // Skip this installment as it's already closed
        }
        
        // Since this installment is not closed, it's available for payment
        const daysSinceDue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine status based on days since due
        let status: WeeklyStatus['status'] = 'due-this-week';
        if (daysSinceDue === 0) {
          status = 'due-today';
        } else if (daysSinceDue < 0) {
          status = 'due-future';
        } else if (daysSinceDue > 7) {
          status = 'overdue';
        }
        
        // Only include if it's due this week or future (not past due)
        if (daysSinceDue <= 7) {
          weeklyStatus.push({
            installmentNumber,
            dueDate,
            daysSinceDue,
            amount: loan.installmentAmount,
            status,
            partialPayment: 0,
            remainingAmount: loan.installmentAmount,
            isPartial: false
          });
        }
      }
      
      // Only add loans that have installments due this week or in the future
      if (weeklyStatus.length > 0) {
        const totalAmount = weeklyStatus.reduce((sum, inst) => sum + inst.amount, 0);
        
        loanGroups[loan.loanId] = {
          ...loan,
          weeklyStatus,
          totalAmount,
          accountExecutive: clients.find(client => client.name === loan.clientName)?.accountExecutive || 'Unassigned'
        };
      }
    });
  
  // Convert to array and sort by due date
  return Object.values(loanGroups).sort((a, b) => {
    const aEarliestDue = Math.min(...a.weeklyStatus.map((s: WeeklyStatus) => s.dueDate.getTime()));
    const bEarliestDue = Math.min(...b.weeklyStatus.map((s: WeeklyStatus) => s.dueDate.getTime()));
    return aEarliestDue - bEarliestDue;
  });
};

export const getThisWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0]
  };
};

export const getNextWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  
  // Move to next week
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4);
  
  return {
    start: nextMonday.toISOString().split('T')[0],
    end: nextFriday.toISOString().split('T')[0]
  };
};
