import React, { useState, useMemo } from 'react';
import { X, Calendar, DollarSign, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Loan, Payment } from '../types';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';
import CloseInstallmentModal from './CloseInstallmentModal';
import { useLoans } from '../contexts/LoansContext';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  payments: Payment[];
  weeklyStatus?: WeeklyStatus[];
  missedInstallments?: MissedInstallment[];
}

const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  isOpen,
  onClose,
  loan,
  payments,
  weeklyStatus = [],
  missedInstallments = []
}) => {
  const { loans } = useLoans();
  const [showCloseInstallmentModal, setShowCloseInstallmentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<WeeklyStatus | MissedInstallment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh mechanism
  const [showClosedInstallments, setShowClosedInstallments] = useState(false);

  // Get fresh loan data from context instead of relying on prop
  const freshLoan = useMemo(() => {
    if (!loan) return null;
    return loans.find(l => l.id === loan.id) || loan;
  }, [loan, loans, refreshKey]);

  // Get all upcoming installments for this loan - use useMemo to recalculate when loan changes
  const getAllUpcomingInstallments = useMemo((): WeeklyStatus[] => {
    if (!freshLoan) return [];
    
    const allUpcoming: WeeklyStatus[] = [];
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Calculate when this loan should have been collected
    const firstInstallment = new Date(freshLoan.firstInstallmentDate);
    const totalWeeks = freshLoan.totalInstallments;
    
    for (let week = 0; week < totalWeeks; week++) {
      const installmentNumber = week + 1;
      const dueDate = new Date(firstInstallment);
      dueDate.setDate(firstInstallment.getDate() + (week * 7));
      
      // Normalize due date to start of day for accurate day-based comparison
      const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // Skip past due installments (strictly before today). Keep today as upcoming (due-today)
      if (startOfDueDate < startOfToday) continue;
      
      // Check if this installment is already closed
      const isInstallmentClosed = freshLoan.closedInstallments?.some(closed => closed.installmentNumber === installmentNumber);
      if (isInstallmentClosed) {
        continue; // Skip this installment as it's already closed
      }
      
      // Calculate whole-day difference between due date and today
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysUntilDue = Math.round((startOfDueDate.getTime() - startOfToday.getTime()) / msPerDay);
      
      // Determine status
      let status: WeeklyStatus['status'] = 'due-future';
      if (daysUntilDue === 0) {
        status = 'due-today';
      } else if (daysUntilDue <= 7) {
        status = 'due-this-week';
      }
      
      // Calculate partial payments for this installment
      let partialPayment = 0;
      let remainingAmount = freshLoan.installmentAmount;
      
      // Get payments for this loan
      const loanPayments = payments.filter(payment => payment.loanId === freshLoan.loanId);
      
      // Look for payments that might apply to this installment
      const installmentPayments = loanPayments.filter(payment => {
        // Check if payment notes mention this installment
        if (payment.notes && payment.notes.includes(`Installment #${installmentNumber}`)) {
          return true;
        }
        
        // Check if this is the next installment that should receive payments
        const totalPaid = loanPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
        const expectedInstallmentsPaid = Math.floor(totalPaid / freshLoan.installmentAmount);
        
        if (installmentNumber <= expectedInstallmentsPaid) {
          return true;
        }
        
        return false;
      });
      
      // Calculate partial payment for this installment
      if (installmentPayments.length > 0) {
        const totalPaidForInstallment = installmentPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
        partialPayment = Math.min(totalPaidForInstallment, freshLoan.installmentAmount);
        remainingAmount = Math.max(0, freshLoan.installmentAmount - partialPayment);
      }
      
      allUpcoming.push({
        installmentNumber,
        dueDate,
        daysSinceDue: -daysUntilDue, // Negative for future dates, zero for today
        amount: freshLoan.installmentAmount,
        status,
        partialPayment,
        remainingAmount,
        isPartial: partialPayment > 0 && partialPayment < freshLoan.installmentAmount
      });
    }
    
    // Sort by due date (earliest first)
    return allUpcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [freshLoan, payments, refreshKey]); // Recalculate when freshLoan, payments, or refreshKey changes

  if (!isOpen || !freshLoan) return null;

  // Get all payments for this loan
  const loanPayments = payments.filter(payment => payment.loanId === freshLoan.loanId);
  
  // Calculate total paid
  const totalPaid = loanPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
  
  // Calculate remaining balance
  const remainingBalance = freshLoan.loanAmount - totalPaid;

  const allUpcomingInstallments = getAllUpcomingInstallments;

  // Handle installment click
  const handleInstallmentClick = (installment: WeeklyStatus | MissedInstallment) => {
    setSelectedInstallment(installment);
    setShowCloseInstallmentModal(true);
  };

  const handleClosedInstallmentClick = (closedInstallment: any) => {
    // For partial payments, open close installment modal with remaining amount
    if (closedInstallment.isPartial) {
      // Create a mock installment object for the close installment modal
      const mockInstallment: WeeklyStatus = {
        installmentNumber: closedInstallment.installmentNumber,
        dueDate: new Date(closedInstallment.dueDate),
        amount: closedInstallment.remainingAmount || 0,
        remainingAmount: closedInstallment.remainingAmount || 0,
        status: 'overdue',
        partialPayment: closedInstallment.paymentAmount,
        daysSinceDue: 0,
        isPartial: true
      };
      setSelectedInstallment(mockInstallment);
      setShowCloseInstallmentModal(true);
    }
  };

  // Close installment modal
  const closeInstallmentModal = () => {
    setShowCloseInstallmentModal(false);
    setSelectedInstallment(null);
  };

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

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'status-badge overdue';
      case 'due-today':
        return 'status-badge due';
      case 'due-this-week':
        return 'status-badge due';
      case 'due-future':
        return 'status-badge future';
      default:
        return 'status-badge';
    }
  };

  // Calculate per-installment fees
  const getInstallmentWithFees = (baseAmount: number) => {
    const loanProviderFeePerInstallment = freshLoan.loanProviderFee / freshLoan.totalInstallments;
    const factoringFeePerInstallment = freshLoan.factoringFee / freshLoan.totalInstallments;
    const totalWithFees = baseAmount + loanProviderFeePerInstallment + factoringFeePerInstallment;
    
    return {
      baseAmount,
      totalWithFees,
      loanProviderFee: loanProviderFeePerInstallment,
      factoringFee: factoringFeePerInstallment
    };
  };

  // Render amount with fee breakdown
  const renderAmountWithFees = (baseAmount: number) => {
    const fees = getInstallmentWithFees(baseAmount);
    return (
      <div className="installment-breakdown-table">
        <div className="base-amount-table">{formatCurrency(fees.baseAmount)}</div>
        <div className="fee-breakdown-table">+ Fees</div>
        <div className="total-amount-table">{formatCurrency(fees.totalWithFees)}</div>
      </div>
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Loan Details - {freshLoan.loanId}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {/* Loan Summary */}
            <div className="loan-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-label">Client</div>
                  <div className="summary-value">{freshLoan.clientName}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Loan Amount</div>
                  <div className="summary-value">{formatCurrency(freshLoan.loanAmount)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Total Paid</div>
                  <div className="summary-value">{formatCurrency(totalPaid)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Remaining Balance</div>
                  <div className="summary-value">{formatCurrency(remainingBalance)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Installment Amount</div>
                  <div className="summary-value">
                    <div className="installment-breakdown">
                      <span className="base-amount">{formatCurrency(freshLoan.installmentAmount)}</span>
                      <span className="breakdown-separator"> + </span>
                      <span className="interest-fees">Interest Fees</span>
                      <span className="breakdown-separator"> = </span>
                      <span className="total-installment">
                        {formatCurrency(freshLoan.installmentAmount + (freshLoan.loanProviderFee / freshLoan.totalInstallments) + (freshLoan.factoringFee / freshLoan.totalInstallments))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Installments Left</div>
                  <div className="summary-value">{freshLoan.installmentsLeft} of {freshLoan.totalInstallments}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Loan Provider Fee</div>
                  <div className="summary-value">{formatCurrency(freshLoan.loanProviderFee)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Factoring Fee</div>
                  <div className="summary-value">{formatCurrency(freshLoan.factoringFee)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Total Fees</div>
                  <div className="summary-value total-fees">
                    {formatCurrency(freshLoan.loanProviderFee + freshLoan.factoringFee)}
                  </div>
                </div>
              </div>
            </div>

            {/* Past Due Installments */}
            {missedInstallments.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <AlertTriangle size={18} color="#ef4444" />
                  <h3>Past Due Installments ({missedInstallments.length})</h3>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Installment #</th>
                        <th>Due Date</th>
                        <th>Days Past Due</th>
                        <th>Amount</th>
                        <th>Partial Payment</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missedInstallments.map((installment, index) => (
                        <tr 
                          key={index} 
                          className="clickable-row"
                          onClick={() => handleInstallmentClick(installment)}
                        >
                          <td>{installment.installmentNumber}</td>
                          <td>{formatDate(installment.dueDate.toISOString())}</td>
                          <td>{installment.daysPastDue} days</td>
                          <td>{renderAmountWithFees(installment.amount)}</td>
                          <td>
                            {installment.partialPayment > 0 ? (
                              <span className="partial-payment">
                                {formatCurrency(installment.partialPayment)}
                              </span>
                            ) : (
                              <span className="no-payment">No payment</span>
                            )}
                          </td>
                          <td className="amount overdue">
                            {formatCurrency(installment.remainingAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upcoming Installments */}
            {allUpcomingInstallments.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <Calendar size={18} color="#3b82f6" />
                  <h3>Upcoming Installments ({allUpcomingInstallments.length})</h3>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Installment #</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Partial Payment</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUpcomingInstallments.map((status, index) => (
                        <tr 
                          key={index} 
                          className="clickable-row"
                          onClick={() => handleInstallmentClick(status)}
                        >
                          <td>{status.installmentNumber}</td>
                          <td>{formatDate(status.dueDate.toISOString())}</td>
                          <td>
                            <div className={getStatusBadge(status.status)}>
                              {status.status.replace('-', ' ')}
                            </div>
                          </td>
                          <td>{renderAmountWithFees(status.amount)}</td>
                          <td>
                            {status.partialPayment > 0 ? (
                              <span className="partial-payment">
                                {formatCurrency(status.partialPayment)}
                              </span>
                            ) : (
                              <span className="no-payment">No payment</span>
                            )}
                          </td>
                          <td className="amount due">
                            {formatCurrency(status.remainingAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Closed Installments - Dropdown */}
            {freshLoan.closedInstallments && freshLoan.closedInstallments.length > 0 && (
              <div className="section">
                <div 
                  className="clickable-header"
                  onClick={() => setShowClosedInstallments(!showClosedInstallments)}
                >
                  <div className="section-header">
                    <CheckCircle size={18} color="#22c55e" />
                    <h3>Closed Installments ({freshLoan.closedInstallments.length})</h3>
                  </div>
                  {showClosedInstallments ? (
                    <ChevronUp size={18} color="#6b7280" />
                  ) : (
                    <ChevronDown size={18} color="#6b7280" />
                  )}
                </div>
                {showClosedInstallments && (
                  <div className="table-container">
                    <table className="data-table">
                                              <thead>
                          <tr>
                            <th>Installment #</th>
                            <th>Due Date</th>
                            <th>Closed Date</th>
                            <th>Amount</th>
                            <th>Payment Amount</th>
                            <th>Remaining</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {freshLoan.closedInstallments
                            .sort((a, b) => a.installmentNumber - b.installmentNumber)
                            .map((closedInstallment, index) => (
                              <tr 
                                key={index}
                                className={closedInstallment.isPartial ? "clickable-row" : ""}
                                onClick={closedInstallment.isPartial ? () => handleClosedInstallmentClick(closedInstallment) : undefined}
                              >
                                <td>{closedInstallment.installmentNumber}</td>
                                <td>{formatDate(closedInstallment.dueDate)}</td>
                                <td>{formatDate(closedInstallment.closedDate)}</td>
                                <td>{renderAmountWithFees(closedInstallment.amount)}</td>
                                <td className="amount collected">
                                  {formatCurrency(closedInstallment.paymentAmount)}
                                </td>
                                <td className={closedInstallment.isPartial ? "amount partial" : "amount closed"}>
                                  {closedInstallment.isPartial ? formatCurrency(closedInstallment.remainingAmount || 0) : '-'}
                                </td>
                                <td>
                                  <div className={`status-badge ${closedInstallment.isPartial ? 'partial' : 'closed'}`}>
                                    {closedInstallment.isPartial ? 'Partial Payment' : 'Closed'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Payment History */}
            <div className="section">
              <div className="section-header">
                <CheckCircle size={18} color="#22c55e" />
                <h3>Payment History</h3>
              </div>
              <div className="table-container">
                {loanPayments.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Transaction Type</th>
                        <th>Confirmation #</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanPayments
                        .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime())
                        .map((payment, index) => (
                          <tr key={index}>
                            <td>{formatDate(payment.datePaid)}</td>
                            <td className="amount collected">
                              {formatCurrency(payment.paymentAmount)}
                            </td>
                            <td>
                              <div className="transaction-type">
                                {payment.transactionType}
                              </div>
                            </td>
                            <td>{payment.bankConfirmationNumber}</td>
                            <td>{payment.notes || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data-message">
                    <CheckCircle size={48} color="#9ca3af" />
                    <p>No payment history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Close Installment Modal */}
      <CloseInstallmentModal
        isOpen={showCloseInstallmentModal}
        onClose={closeInstallmentModal}
        installment={selectedInstallment}
        loan={freshLoan}
        payments={payments}
        onInstallmentClosed={(result) => {
          // Handle the installment being closed
          console.log('Installment closed:', result);
          
          // Force refresh of the modal data
          setRefreshKey(prev => prev + 1);
          
          // Close the modal
          closeInstallmentModal();
          
          // Small delay to ensure context has updated, then refresh again
          setTimeout(() => {
            setRefreshKey(prev => prev + 1);
          }, 100);
        }}
      />
    </>
  );
};

export default LoanDetailsModal;
