import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';
import { closeInstallment, CloseInstallmentData, validateCloseInstallmentData, canCloseInstallment, getMinimumPaymentAmount } from '../utils/closeInstallment';
import { Loan, Payment } from '../types';
import { usePayments } from '../contexts/PaymentsContext';
import { useLoans } from '../contexts/LoansContext';

interface CloseInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: WeeklyStatus | MissedInstallment | null;
  loan: Loan | null;
  payments: Payment[];
  onInstallmentClosed?: (result: any) => void;
}

const CloseInstallmentModal: React.FC<CloseInstallmentModalProps> = ({
  isOpen,
  onClose,
  installment,
  loan,
  payments,
  onInstallmentClosed
}) => {
  const { addPayment } = usePayments();
  const { updateLoan } = useLoans();
  
  const [formData, setFormData] = useState<CloseInstallmentData>({
    paymentAmount: 0,
    factoringFee: 0,
    sisterCompanyFee: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    transactionType: 'ACH',
    bankConfirmationNumber: '',
    notes: '',
    companyName: 'Fuel Co' // Default company, could be made configurable
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ canClose: boolean; reason?: string } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && installment && loan) {
      const canCloseResult = canCloseInstallment(installment, loan);
      const sisterCompanyFeePerInstallment = loan.loanProviderFee / loan.totalInstallments;
      const principalPerInstallment = loan.loanAmount / loan.totalInstallments;
      
      // Payment Amount = principal only
      // If partial, suggest remaining principal
      let suggestedPaymentAmount = principalPerInstallment;
      if (installment.isPartial && installment.remainingAmount) {
        suggestedPaymentAmount = installment.remainingAmount;
      }
      
      setFormData(prev => ({
        ...prev,
        paymentAmount: Number(suggestedPaymentAmount.toFixed(2)),
        factoringFee: Number((loan.factoringFee / loan.totalInstallments).toFixed(2)),
        sisterCompanyFee: Number(sisterCompanyFeePerInstallment.toFixed(2)),
        paymentDate: new Date().toISOString().split('T')[0]
      }));
      
      setValidationResult(canCloseResult);
      setErrors([]);
    }
  }, [isOpen, installment, loan]);

  if (!isOpen || !installment || !loan) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if it's a missed installment (past due)
  const isMissedInstallment = 'daysPastDue' in installment;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateCloseInstallmentData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if installment can be closed
    if (!validationResult?.canClose) {
      setErrors([validationResult?.reason || 'Installment cannot be closed']);
      return;
    }

    setIsSubmitting(true);

    try {
      // Close the installment with proper callbacks
      const result = await closeInstallment(
        loan,
        installment,
        formData,
        payments,
        (updatedLoan) => {
          // Update the loan in context
          updateLoan(updatedLoan.id, updatedLoan);
        },
        (newPayment) => {
          // Add the payment to context
          addPayment(newPayment);
        }
      );

      if (result.success) {
        // Call the callback to notify parent component
        if (onInstallmentClosed) {
          onInstallmentClosed(result);
        }
        
        // Close the modal
        onClose();
      } else {
        setErrors([result.message]);
      }
    } catch (error) {
      setErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available companies (this could come from a context or prop)
  const availableCompanies = [
    'Fuel Co',
    'Equipment Co',
    'BJK Fuel',
    'TDX'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content close-installment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Close Installment</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Installment Summary */}
          <div className="installment-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Loan ID</div>
                <div className="summary-value">{loan.loanId}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Client</div>
                <div className="summary-value">{loan.clientName}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Installment #</div>
                <div className="summary-value">{installment.installmentNumber}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Due Date</div>
                <div className="summary-value">{formatDate(installment.dueDate.toISOString())}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Amount</div>
                <div className="summary-value">{formatCurrency(installment.amount)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Status</div>
                <div className="summary-value">
                  {isMissedInstallment ? (
                    <div className="status-badge overdue">
                      Past Due ({installment.daysPastDue} days)
                    </div>
                  ) : (
                    <div className="status-badge due">
                      {installment.status.replace('-', ' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Partial Payment Info */}
          {installment.partialPayment > 0 && (
            <div className="section">
              <div className="section-header">
                <DollarSign size={18} color="#f59e0b" />
                <h3>Partial Payment Applied</h3>
              </div>
              <div className="partial-payment-info">
                <div className="partial-amount">
                  <span className="label">Amount Paid:</span>
                  <span className="value">{formatCurrency(installment.partialPayment)}</span>
                </div>
                <div className="remaining-amount">
                  <span className="label">Remaining:</span>
                  <span className="value">{formatCurrency(installment.remainingAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {validationResult && !validationResult.canClose && (
            <div className="section">
              <div className="section-header">
                <AlertTriangle size={18} color="#ef4444" />
                <h3>Cannot Close Installment</h3>
              </div>
              <div className="validation-warning">
                <p className="warning-text">{validationResult.reason}</p>
              </div>
            </div>
          )}

          {/* Close Installment Form */}
          {validationResult?.canClose && (
            <div className="section">
              <div className="section-header">
                <CheckCircle size={18} color="#22c55e" />
                <h3>Close This Installment</h3>
              </div>
              <div className="close-installment-form">
                <p className="form-description">
                  Payment Amount = Principal (Loan amount / installments). Total Amount = Payment Amount + Sister Company Fee + Factoring Fee.
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li><strong>Less than {formatCurrency((loan.loanAmount / loan.totalInstallments))}</strong> - Partial principal payment</li>
                    <li><strong>Equal to {formatCurrency((loan.loanAmount / loan.totalInstallments))}</strong> - Full principal payment for this installment</li>
                    <li><strong>More than {formatCurrency((loan.loanAmount / loan.totalInstallments))}</strong> - Principal overpayment (excess applied to future installments)</li>
                  </ul>
                  {installment.isPartial && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.375rem' }}>
                      <strong>Partial Payment Note:</strong> This installment already has a partial payment. The remaining principal ({formatCurrency(installment.remainingAmount || 0)}) is pre-filled as the suggested payment amount.
                    </div>
                  )}
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-placeholder">
                    <div className="placeholder-item">
                      <label>Payment Amount (Principal only) *</label>
                      <input 
                        type="number" 
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        className="form-input"
                        placeholder="Enter principal only"
                        required
                      />
                      <small className="form-help">
                        Enter principal only. Sister company fee and factoring fee are separate.
                      </small>
                    </div>

                    <div className="placeholder-item">
                      <label>Factoring Fee *</label>
                      <input 
                        type="number" 
                        name="factoringFee"
                        value={formData.factoringFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="form-input"
                        placeholder="Enter factoring fee"
                        required
                      />
                      <small className="form-help">
                        Your collection fee for this installment.
                      </small>
                    </div>

                    <div className="placeholder-item">
                      <label>Sister Company Fee *</label>
                      <input 
                        type="number" 
                        name="sisterCompanyFee"
                        value={formData.sisterCompanyFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="form-input"
                        placeholder="Enter sister company fee"
                        required
                      />
                      <small className="form-help">
                        Fee paid to the sister company for this installment.
                      </small>
                    </div>
                    <div className="placeholder-item">
                      <label>Total Amount (Payment + Sister Company Fee + Factoring Fee)</label>
                      <div className="total-amount-display">
                        <span className="breakdown-text">
                          Payment ({formatCurrency(formData.paymentAmount)}) + Sister Company Fee ({formatCurrency(formData.sisterCompanyFee)}) + Factoring Fee ({formatCurrency(formData.factoringFee)}) = 
                        </span>
                        <span className="total-amount">
                          {formatCurrency(Number(formData.paymentAmount) + Number(formData.sisterCompanyFee) + Number(formData.factoringFee))}
                        </span>
                      </div>
                      <small className="form-help">
                        Total amount collected: Payment + Sister Company Fee + Factoring Fee.
                      </small>
                    </div>
                    <div className="placeholder-item">
                      <label>Payment Date *</label>
                      <input 
                        type="date" 
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="placeholder-item">
                      <label>Company *</label>
                      <select 
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        {availableCompanies.map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>
                    <div className="placeholder-item">
                      <label>Transaction Type *</label>
                      <select 
                        name="transactionType"
                        value={formData.transactionType}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="ACH">ACH</option>
                        <option value="Wire">Wire</option>
                      </select>
                    </div>
                    <div className="placeholder-item">
                      <label>Bank Confirmation # *</label>
                      <input 
                        type="text" 
                        name="bankConfirmationNumber"
                        value={formData.bankConfirmationNumber}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter confirmation number"
                        required
                      />
                    </div>
                    <div className="placeholder-item">
                      <label>Notes</label>
                      <textarea 
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Add any notes about this payment"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Error Display */}
                  {errors.length > 0 && (
                    <div className="error-messages">
                      {errors.map((error, index) => (
                        <div key={index} className="error-message">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Close Installment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseInstallmentModal;
