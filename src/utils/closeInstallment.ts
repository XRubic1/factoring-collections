import { Loan, Payment } from '../types';
import { WeeklyStatus } from './loansDueThisWeek';
import { MissedInstallment } from './pastDueCollections';

export interface CloseInstallmentData {
  paymentAmount: number;
  factoringFee: number;
  sisterCompanyFee: number;
  paymentDate: string;
  transactionType: 'ACH' | 'Wire';
  bankConfirmationNumber: string;
  notes?: string;
  companyName: string;
}

export interface CloseInstallmentResult {
  success: boolean;
  message: string;
  newPayment?: Payment;
  updatedLoan?: Loan;
  error?: string;
}

/**
 * Closes an installment by recording a payment and updating loan status
 * This function can be used from multiple places in the application
 */
export const closeInstallment = async (
  loan: Loan,
  installment: WeeklyStatus | MissedInstallment,
  closeData: CloseInstallmentData,
  existingPayments: Payment[],
  updateLoanCallback?: (updatedLoan: Loan) => void,
  addPaymentCallback?: (newPayment: Payment) => void
): Promise<CloseInstallmentResult> => {
  try {
    // Validate the payment amount
    if (closeData.paymentAmount <= 0) {
      return {
        success: false,
        message: 'Payment amount must be greater than 0',
        error: 'INVALID_AMOUNT'
      };
    }

    // Payment amount can be any positive amount - no restrictions
    // The system will handle partial payments, full payments, and overpayments



    // Create new payment record
    // Per updated requirements: process (post) Payment Amount + Sister Company Fee
    const postedPaymentAmount = Number(closeData.paymentAmount) + Number(closeData.sisterCompanyFee);
    
    const newPayment: Payment = {
      id: Date.now().toString(),
      companyName: closeData.companyName,
      paymentType: 'Loan',
      loanId: loan.loanId,
      clientName: loan.clientName,
      paymentAmount: postedPaymentAmount, // Only payment amount is posted
      transactionType: closeData.transactionType,
      bankConfirmationNumber: closeData.bankConfirmationNumber,
      datePaid: closeData.paymentDate,
      notes: closeData.notes || `Installment #${installment.installmentNumber} payment - Due Date: ${installment.dueDate.toISOString().split('T')[0]}`,
      createdAt: new Date().toISOString().split('T')[0],
      factoringFee: Number(closeData.factoringFee),
      sisterCompanyFee: Number(closeData.sisterCompanyFee)
    };

    // Calculate new loan status - ensure all amounts are numbers
    // For loan balance calculation, reduce principal portion only (exclude sister company fee and factoring fee)
    const existingPrincipalPaid = existingPayments.reduce((sum, payment) => {
      // Past records may have included sisterCompanyFee within paymentAmount; we approximate principal paid as
      // paymentAmount - sisterCompanyFee for each payment.
      const principalComponent = Number(payment.paymentAmount) - (Number(payment.sisterCompanyFee) || 0);
      return sum + Math.max(0, principalComponent);
    }, 0);

    // New payment's principal component equals entered principal amount
    const newPrincipalPaid = Math.max(0, Number(closeData.paymentAmount));
    const totalPrincipalPaid = existingPrincipalPaid + newPrincipalPaid;
    const remainingBalance = Math.max(0, loan.loanAmount - totalPrincipalPaid);
    
    // Always mark the installment as closed, but track if it's partial
    // For partial payment calculation, we compare principal amount to installment amount
    const principalPerInstallment = loan.loanAmount / loan.totalInstallments;
    const isPartialPayment = Number(closeData.paymentAmount) < principalPerInstallment;
    const remainingAmount = isPartialPayment ? (principalPerInstallment - Number(closeData.paymentAmount)) : 0;
    
    // Create the closed installment record
    const closedInstallmentRecord = {
      installmentNumber: installment.installmentNumber,
      dueDate: installment.dueDate.toISOString().split('T')[0],
      closedDate: closeData.paymentDate,
      amount: principalPerInstallment,
      paymentAmount: postedPaymentAmount, // amount processed (principal + sister company fee)
      paymentId: newPayment.id,
      note: isPartialPayment ? 'Partial payment' : undefined,
      closureType: 'payment' as const,
      isPartial: isPartialPayment,
      remainingAmount: remainingAmount
    };
    
    // Calculate installments left based on actual closed installments
    const updatedClosedInstallments = [
      ...(loan.closedInstallments || []),
      closedInstallmentRecord
    ];
    
    // Count actual closed installments (excluding partial payments that might be reopened)
    const fullyClosedInstallments = updatedClosedInstallments.filter(ci => !ci.isPartial || ci.remainingAmount === 0);
    const installmentsPaid = fullyClosedInstallments.length;
    const installmentsLeft = Math.max(0, loan.totalInstallments - installmentsPaid);
    
    // Debug progress calculation
    console.log('Progress Calculation Debug:', {
      loanId: loan.loanId,
      totalInstallments: loan.totalInstallments,
      closedInstallmentsCount: loan.closedInstallments?.length || 0,
      newClosedInstallment: closedInstallmentRecord,
      updatedClosedInstallmentsCount: updatedClosedInstallments.length,
      fullyClosedInstallmentsCount: fullyClosedInstallments.length,
      installmentsPaid,
      installmentsLeft,
      progress: `${installmentsPaid}/${loan.totalInstallments}`
    });

    // Debug logging
    console.log('Closing Installment Debug:', {
      loanId: loan.loanId,
      installmentNumber: installment.installmentNumber,
      existingClosedInstallments: loan.closedInstallments?.length || 0,
      newClosedInstallment: closedInstallmentRecord,
      updatedClosedInstallments: [...(loan.closedInstallments || []), closedInstallmentRecord]
    });

    // Debug loan balance calculation
    console.log('Loan Balance Calculation Debug:', {
      originalLoanAmount: loan.loanAmount,
      existingPrincipalPaid: existingPrincipalPaid,
      newPrincipalPaid: newPrincipalPaid,
      totalPrincipalPaid: totalPrincipalPaid,
      remainingBalance: remainingBalance,
      installmentsPaid: installmentsPaid,
      installmentsLeft: installmentsLeft
    });

    // Create updated loan object
    const updatedLoan: Loan = {
      ...loan,
      openBalance: remainingBalance,
      installmentsLeft: installmentsLeft,
      closedInstallments: [
        ...(loan.closedInstallments || []),
        closedInstallmentRecord
      ]
    };

    // Call callbacks to update the application state
    console.log('Calling update callbacks...');
    
    if (updateLoanCallback) {
      console.log('Updating loan in context:', updatedLoan);
      updateLoanCallback(updatedLoan);
    } else {
      console.warn('No updateLoanCallback provided');
    }

    if (addPaymentCallback) {
      console.log('Adding payment to context:', newPayment);
      addPaymentCallback(newPayment);
    } else {
      console.warn('No addPaymentCallback provided');
    }

    // Add a small delay to ensure all state updates propagate properly
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create appropriate success message based on payment scenario
    let successMessage = '';
    // Ensure all values are converted to numbers to prevent string concatenation
    const totalCollected = postedPaymentAmount + Number(closeData.factoringFee);
    const principalPaidNow = Number(closeData.paymentAmount);
    
    if (isPartialPayment) {
      const remaining = remainingAmount;
      successMessage = `Partial payment recorded for Installment #${installment.installmentNumber}. Principal: $${principalPaidNow.toLocaleString()}, Sister Company Fee: $${Number(closeData.sisterCompanyFee).toLocaleString()}, Factoring Fee: $${Number(closeData.factoringFee).toLocaleString()}. Total collected: $${totalCollected.toLocaleString()}. Installment marked as closed with $${remaining.toLocaleString()} remaining.`;
    } else if (Math.abs(Number(closeData.paymentAmount) - principalPerInstallment) < 0.01) {
      successMessage = `Installment #${installment.installmentNumber} successfully closed. Principal: $${principalPaidNow.toLocaleString()}, Sister Company Fee: $${Number(closeData.sisterCompanyFee).toLocaleString()}, Factoring Fee: $${Number(closeData.factoringFee).toLocaleString()}. Total collected: $${totalCollected.toLocaleString()}.`;
    } else {
      const overpayment = Math.max(0, Number(closeData.paymentAmount) - principalPerInstallment);
      successMessage = `Installment #${installment.installmentNumber} closed with overpayment. Principal: $${principalPaidNow.toLocaleString()}, Sister Company Fee: $${Number(closeData.sisterCompanyFee).toLocaleString()}, Factoring Fee: $${Number(closeData.factoringFee).toLocaleString()}. Total collected: $${totalCollected.toLocaleString()}. Excess principal of $${overpayment.toLocaleString()} will be applied to future installments.`;
    }
    
    return {
      success: true,
      message: successMessage,
      newPayment,
      updatedLoan
    };

  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while closing the installment',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Checks if an installment can receive a payment
 */
export const canCloseInstallment = (
  installment: WeeklyStatus | MissedInstallment,
  loan: Loan
): { canClose: boolean; reason?: string } => {
  // Check if loan is still active
  if (loan.installmentsLeft <= 0) {
    return {
      canClose: false,
      reason: 'Loan is already fully paid'
    };
  }

  // Allow payments on any installment (partial, full, or overpayment)
  return {
    canClose: true
  };
};

/**
 * Gets the suggested payment amount for an installment
 */
export const getMinimumPaymentAmount = (installment: WeeklyStatus | MissedInstallment): number => {
  // Default to the remaining amount, but allow any amount
  return installment.remainingAmount;
};

/**
 * Validates close installment data
 */
export const validateCloseInstallmentData = (data: CloseInstallmentData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.paymentAmount || data.paymentAmount <= 0) {
    errors.push('Payment amount is required and must be greater than 0');
  }

  if (!data.paymentDate) {
    errors.push('Payment date is required');
  }

  if (!data.transactionType) {
    errors.push('Transaction type is required');
  }

  if (!data.bankConfirmationNumber) {
    errors.push('Bank confirmation number is required');
  }

  if (!data.companyName) {
    errors.push('Company name is required');
  }

  if (data.factoringFee < 0) {
    errors.push('Factoring fee cannot be negative');
  }

  if (data.sisterCompanyFee < 0) {
    errors.push('Sister company fee cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
