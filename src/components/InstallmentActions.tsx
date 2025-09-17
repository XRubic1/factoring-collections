import React from 'react';
import { useInstallment } from '../contexts/InstallmentContext';
import { Loan, Payment } from '../types';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';
import { CloseInstallmentData } from '../utils/closeInstallment';

interface InstallmentActionsProps {
  loan: Loan;
  installment: WeeklyStatus | MissedInstallment;
  payments: Payment[];
  onSuccess?: () => void;
}

/**
 * Example component showing how to use the close installment functionality
 * This can be placed anywhere in the application where you need to close installments
 */
export const InstallmentActions: React.FC<InstallmentActionsProps> = ({
  loan,
  installment,
  payments,
  onSuccess
}) => {
  const { closeInstallment, isClosing, lastResult } = useInstallment();

  const handleQuickClose = async () => {
    // Example of quick closing an installment with default values
    const closeData: CloseInstallmentData = {
      paymentAmount: installment.remainingAmount, // Payment amount without fees
      factoringFee: loan.factoringFee / loan.totalInstallments,
      sisterCompanyFee: loan.loanProviderFee / loan.totalInstallments,
      paymentDate: new Date().toISOString().split('T')[0],
      transactionType: 'ACH',
      bankConfirmationNumber: `QC-${Date.now()}`,
      notes: 'Quick close from InstallmentActions component',
      companyName: 'Fuel Co'
    };

    const result = await closeInstallment(loan, installment, closeData, payments);
    
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleCustomClose = async () => {
    // Example of custom closing with specific payment details
    const closeData: CloseInstallmentData = {
      paymentAmount: installment.remainingAmount + 100, // Payment amount + overpayment (without fees)
      factoringFee: loan.factoringFee / loan.totalInstallments,
      sisterCompanyFee: loan.loanProviderFee / loan.totalInstallments,
      paymentDate: new Date().toISOString().split('T')[0],
      transactionType: 'Wire',
      bankConfirmationNumber: `CUSTOM-${Date.now()}`,
      notes: 'Custom close with overpayment',
      companyName: 'Equipment Co'
    };

    const result = await closeInstallment(loan, installment, closeData, payments);
    
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <div className="installment-actions">
      <h4>Installment Actions</h4>
      
      <div className="action-buttons">
        <button 
          className="btn btn-primary btn-sm"
          onClick={handleQuickClose}
          disabled={isClosing || installment.remainingAmount <= 0}
        >
          {isClosing ? 'Processing...' : 'Quick Close'}
        </button>
        
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleCustomClose}
          disabled={isClosing || installment.remainingAmount <= 0}
        >
          {isClosing ? 'Processing...' : 'Custom Close'}
        </button>
      </div>

      {lastResult && (
        <div className={`result-message ${lastResult.success ? 'success' : 'error'}`}>
          {lastResult.message}
        </div>
      )}

      <div className="installment-info">
        <p><strong>Remaining Amount:</strong> ${installment.remainingAmount.toLocaleString()}</p>
        <p><strong>Can Close:</strong> {installment.remainingAmount > 0 ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default InstallmentActions;
