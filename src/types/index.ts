export interface Loan {
  id: string;
  loanId: string;
  clientName: string;
  loanProvider: string;
  loanAmount: number;
  totalInstallments: number;
  installmentsLeft: number;
  openBalance: number;
  installmentAmount: number;
  factoringFee: number;
  loanProviderFee: number;
  loanDate: string;
  firstInstallmentDate: string;
  createdAt: string;
  missedInstallments?: any[];
  weeklyStatus?: any[];
  totalMissedCount?: number;
  totalMissedAmount?: number;
  totalAmount?: number;
  maxDaysPast?: number;
  accountExecutive?: string;
  companyName?: string;
  closedInstallments?: ClosedInstallment[];
}

export interface ClosedInstallment {
  installmentNumber: number;
  dueDate: string;
  closedDate: string;
  amount: number;
  paymentAmount: number;
  paymentId: string;
  note?: string;
  closureType: 'payment' | 'manual';
  isPartial: boolean;
  remainingAmount?: number;
}

export interface ManualInstallmentClosure {
  installmentNumber: number;
  dueDate: string;
  closedDate: string;
  amount: number;
  note?: string;
}

export interface Payment {
  id: string;
  companyName: string;
  paymentType: string;
  loanId?: string;
  clientName?: string;
  paymentAmount: number;
  transactionType: 'ACH' | 'Wire';
  bankConfirmationNumber: string;
  datePaid: string;
  notes?: string;
  createdAt: string;
  factoringFee?: number;
  sisterCompanyFee?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountExecutive: string;
  createdAt: string;
}

export interface SisterCompany {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}
