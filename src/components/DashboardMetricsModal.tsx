import React from 'react';
import { X, DollarSign, AlertTriangle, CheckCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import { Loan, Payment, Client } from '../types';

interface DashboardMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'collected' | 'outstanding' | 'pastDue';
  loans: Loan[];
  payments: Payment[];
  clients: Client[];
  dateFrom: string;
  dateTo: string;
}

const DashboardMetricsModal: React.FC<DashboardMetricsModalProps> = ({
  isOpen,
  onClose,
  metricType,
  loans,
  payments,
  clients,
  dateFrom,
  dateTo
}) => {
  if (!isOpen) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Calculate metrics based on type
  const getMetricsData = () => {
    const filteredPayments = payments.filter((payment: any) => {
      if (payment.paymentType !== 'Loan') return false;
      if (dateFrom && payment.datePaid < dateFrom) return false;
      if (dateTo && payment.datePaid > dateTo) return false;
      return true;
    });

    const totalCollected = filteredPayments.reduce((sum: number, payment: any) => sum + Number(payment.paymentAmount), 0);
    
    // Calculate total outstanding including fees
    const totalOutstanding = loans.reduce((sum, loan) => {
      const outstandingPrincipal = loan.openBalance;
      // Calculate remaining fees based on actual payments made
      const loanPayments = payments.filter(payment => 
        payment.paymentType === 'Loan' && payment.loanId === loan.loanId
      );
      
      const factoringFeesEarned = loanPayments.reduce((feeSum, payment) => {
        return feeSum + (Number(payment.factoringFee) || 0);
      }, 0);
      
      const sisterCompanyFeesPaid = loanPayments.reduce((feeSum, payment) => {
        return feeSum + (Number(payment.sisterCompanyFee) || 0);
      }, 0);
      
      const totalFeesForLoan = loan.factoringFee + loan.loanProviderFee;
      const remainingFees = totalFeesForLoan - factoringFeesEarned - sisterCompanyFeesPaid;
      
      return sum + outstandingPrincipal + Math.max(0, remainingFees);
    }, 0);
    
    // Calculate total past due including fees
    const totalPastDue = loans.reduce((sum, loan) => {
      const overduePrincipal = loan.openBalance;
      // Calculate remaining fees for overdue loans
      const loanPayments = payments.filter(payment => 
        payment.paymentType === 'Loan' && payment.loanId === loan.loanId
      );
      
      const factoringFeesEarned = loanPayments.reduce((feeSum, payment) => {
        return feeSum + (Number(payment.factoringFee) || 0);
      }, 0);
      
      const sisterCompanyFeesPaid = loanPayments.reduce((feeSum, payment) => {
        return feeSum + (Number(payment.sisterCompanyFee) || 0);
      }, 0);
      
      const totalFeesForLoan = loan.factoringFee + loan.loanProviderFee;
      const remainingFees = totalFeesForLoan - factoringFeesEarned - sisterCompanyFeesPaid;
      
      return sum + overduePrincipal + Math.max(0, remainingFees);
    }, 0);
    
    // Calculate factoring fees earned from actual payments (not based on closed installments)
    const factoringFeesEarned = filteredPayments.reduce((sum, payment: any) => {
      return sum + (Number(payment.factoringFee) || 0);
    }, 0);

    // Calculate sister company fees paid from actual payments
    const sisterCompanyFeesPaid = filteredPayments.reduce((sum, payment: any) => {
      return sum + (Number(payment.sisterCompanyFee) || 0);
    }, 0);

    // Get unique clients
    const uniqueClients = Array.from(new Set(loans.map(loan => loan.clientName)));

    return {
      totalCollected,
      totalOutstanding,
      totalPastDue,
      factoringFeesEarned,
      sisterCompanyFeesPaid,
      uniqueClients: uniqueClients.length,
      filteredPayments,
      loans
    };
  };

  const metricsData = getMetricsData();

  const getModalTitle = () => {
    switch (metricType) {
      case 'collected':
        return 'Collected Amount Details';
      case 'outstanding':
        return 'Total Outstanding Details';
      case 'pastDue':
        return 'Past Due Collections Details';
      default:
        return 'Metrics Details';
    }
  };

  const getModalIcon = () => {
    switch (metricType) {
      case 'collected':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'outstanding':
        return <DollarSign size={20} color="#3b82f6" />;
      case 'pastDue':
        return <AlertTriangle size={20} color="#ef4444" />;
      default:
        return <TrendingUp size={20} color="#6b7280" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-container">
            {getModalIcon()}
            <h2 className="modal-title">{getModalTitle()}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Metrics */}
          <div className="metrics-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">
                  <Users size={16} />
                  Clients
                </div>
                <div className="summary-value">{metricsData.uniqueClients}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <CheckCircle size={16} />
                  Collected Amount
                </div>
                <div className="summary-value collected">
                  {formatCurrency(metricsData.totalCollected)}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <DollarSign size={16} />
                  Outstanding Amount
                </div>
                <div className="summary-value outstanding">
                  {formatCurrency(metricsData.totalOutstanding)}
                </div>
              </div>
                             <div className="summary-item">
                 <div className="summary-label">
                   <TrendingUp size={16} />
                   Factoring Fees Earned
                 </div>
                 <div className="summary-value fees">
                   {formatCurrency(metricsData.factoringFeesEarned)}
                 </div>
               </div>
                               <div className="summary-item">
                  <div className="summary-label">
                    <DollarSign size={16} />
                    Sister Company Fees Paid
                  </div>
                  <div className="summary-value sister-company-fees">
                    {formatCurrency(metricsData.sisterCompanyFeesPaid)}
                  </div>
                </div>
              <div className="summary-item">
                <div className="summary-label">
                  <AlertTriangle size={16} />
                  Past Due Amount
                </div>
                <div className="summary-value past-due">
                  {formatCurrency(metricsData.totalPastDue)}
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="date-range-info">
            <div className="date-range-header">
              <Calendar size={16} />
              <span>Date Range: {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="detailed-breakdown">
            <div className="breakdown-section">
              <h3>Loan Breakdown</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Loan ID</th>
                      <th>Outstanding Balance</th>
                      <th>Installments Left</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan, index) => (
                      <tr key={index}>
                        <td>{loan.clientName}</td>
                        <td><div className="loan-id">{loan.loanId}</div></td>
                                                 <td className="amount">{(() => {
                           // Calculate outstanding balance including fees for this specific loan
                           const outstandingPrincipal = loan.openBalance;
                           const loanPayments = payments.filter(payment => 
                             payment.paymentType === 'Loan' && payment.loanId === loan.loanId
                           );
                           
                           const factoringFeesEarned = loanPayments.reduce((feeSum, payment) => {
                             return feeSum + (Number(payment.factoringFee) || 0);
                           }, 0);
                           
                           const sisterCompanyFeesPaid = loanPayments.reduce((feeSum, payment) => {
                             return feeSum + (Number(payment.sisterCompanyFee) || 0);
                           }, 0);
                           
                           const totalFeesForLoan = loan.factoringFee + loan.loanProviderFee;
                           const remainingFees = totalFeesForLoan - factoringFeesEarned - sisterCompanyFeesPaid;
                           const totalOutstandingWithFees = outstandingPrincipal + Math.max(0, remainingFees);
                           
                           return formatCurrency(totalOutstandingWithFees);
                         })()}</td>
                        <td>{loan.installmentsLeft} of {loan.totalInstallments}</td>
                        <td>
                          <div className={`status-badge ${loan.installmentsLeft > 0 ? 'active' : 'closed'}`}>
                            {loan.installmentsLeft > 0 ? 'Active' : 'Closed'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {metricType === 'collected' && (
              <div className="breakdown-section">
                <h3>Payment Details</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Loan ID</th>
                        <th>Amount</th>
                        <th>Transaction Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.filteredPayments.map((payment: any, index) => (
                        <tr key={index}>
                          <td>{new Date(payment.datePaid).toLocaleDateString()}</td>
                          <td>{payment.clientName}</td>
                          <td><div className="loan-id">{payment.loanId}</div></td>
                          <td className="amount collected">{formatCurrency(payment.paymentAmount)}</td>
                          <td>
                            <div className="transaction-type">
                              {payment.transactionType}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetricsModal;
