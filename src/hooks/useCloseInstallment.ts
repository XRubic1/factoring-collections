import { useState } from 'react';
import { closeInstallment, CloseInstallmentData, CloseInstallmentResult } from '../utils/closeInstallment';
import { Loan, Payment } from '../types';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';

interface UseCloseInstallmentProps {
  onLoanUpdated?: (updatedLoan: Loan) => void;
  onPaymentAdded?: (newPayment: Payment) => void;
  onSuccess?: (result: CloseInstallmentResult) => void;
  onError?: (error: string) => void;
}

export const useCloseInstallment = ({
  onLoanUpdated,
  onPaymentAdded,
  onSuccess,
  onError
}: UseCloseInstallmentProps = {}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [lastResult, setLastResult] = useState<CloseInstallmentResult | null>(null);

  const closeInstallmentHandler = async (
    loan: Loan,
    installment: WeeklyStatus | MissedInstallment,
    closeData: CloseInstallmentData,
    existingPayments: Payment[]
  ): Promise<CloseInstallmentResult> => {
    setIsClosing(true);
    
    try {
      const result = await closeInstallment(
        loan,
        installment,
        closeData,
        existingPayments,
        onLoanUpdated,
        onPaymentAdded
      );

      setLastResult(result);

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.message);
      }

      return result;
    } catch (error) {
      const errorResult: CloseInstallmentResult = {
        success: false,
        message: 'An unexpected error occurred while closing the installment',
        error: 'UNEXPECTED_ERROR'
      };
      
      setLastResult(errorResult);
      onError?.(errorResult.message);
      return errorResult;
    } finally {
      setIsClosing(false);
    }
  };

  const reset = () => {
    setLastResult(null);
  };

  return {
    closeInstallment: closeInstallmentHandler,
    isClosing,
    lastResult,
    reset
  };
};
