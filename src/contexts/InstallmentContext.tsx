import React, { createContext, useContext, ReactNode } from 'react';
import { useCloseInstallment } from '../hooks/useCloseInstallment';
import { Loan, Payment } from '../types';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';
import { CloseInstallmentData, CloseInstallmentResult } from '../utils/closeInstallment';

interface InstallmentContextType {
  closeInstallment: (
    loan: Loan,
    installment: WeeklyStatus | MissedInstallment,
    closeData: CloseInstallmentData,
    existingPayments: Payment[]
  ) => Promise<CloseInstallmentResult>;
  isClosing: boolean;
  lastResult: CloseInstallmentResult | null;
  reset: () => void;
}

const InstallmentContext = createContext<InstallmentContextType | undefined>(undefined);

export const useInstallment = () => {
  const context = useContext(InstallmentContext);
  if (context === undefined) {
    throw new Error('useInstallment must be used within an InstallmentProvider');
  }
  return context;
};

interface InstallmentProviderProps {
  children: ReactNode;
  onLoanUpdated?: (updatedLoan: Loan) => void;
  onPaymentAdded?: (newPayment: Payment) => void;
  onSuccess?: (result: CloseInstallmentResult) => void;
  onError?: (error: string) => void;
}

export const InstallmentProvider: React.FC<InstallmentProviderProps> = ({
  children,
  onLoanUpdated,
  onPaymentAdded,
  onSuccess,
  onError
}) => {
  const installmentHook = useCloseInstallment({
    onLoanUpdated,
    onPaymentAdded,
    onSuccess,
    onError
  });

  const value: InstallmentContextType = {
    closeInstallment: installmentHook.closeInstallment,
    isClosing: installmentHook.isClosing,
    lastResult: installmentHook.lastResult,
    reset: installmentHook.reset
  };

  return (
    <InstallmentContext.Provider value={value}>
      {children}
    </InstallmentContext.Provider>
  );
};
