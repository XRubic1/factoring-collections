import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { useLoans } from '../contexts/LoansContext';
import { useClients } from '../contexts/ClientsContext';
import { usePayments } from '../contexts/PaymentsContext';
import { Loan, ClosedInstallment, ManualInstallmentClosure } from '../types';
import CloseInstallmentModal from '../components/CloseInstallmentModal';
import ManualCloseInstallmentModal from '../components/ManualCloseInstallmentModal';
import { WeeklyStatus } from '../utils/loansDueThisWeek';
import { MissedInstallment } from '../utils/pastDueCollections';

const LoanStatus: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showCloseInstallmentModal, setShowCloseInstallmentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<WeeklyStatus | MissedInstallment | null>(null);
  const [showManualCloseModal, setShowManualCloseModal] = useState(false);
  const [selectedManualInstallment, setSelectedManualInstallment] = useState<{
    installmentNumber: number;
    dueDate: string;
    amount: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { loans, updateLoan } = useLoans();
  const { clients } = useClients();
  const { payments } = usePayments();

  // Get this week's date range (Monday to Friday)
  const getThisWeekRange = () => {
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

  const weekRange = getThisWeekRange();

  // Get real payment data for this week
  const getThisWeekPayments = (loanId: string) => {
    return payments.filter(payment => 
      payment.paymentType === 'Loan' && 
      payment.loanId === loanId &&
      payment.datePaid >= weekRange.start && 
      payment.datePaid <= weekRange.end
    );
  };

  // Get all payment history for a specific loan
  const getLoanPaymentHistory = (loanId: string) => {
    return payments
      .filter(payment => payment.paymentType === 'Loan' && payment.loanId === loanId)
      .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()); // Sort by date descending
  };

  // Calculate fees earned from actual payments for a specific loan
  const getLoanFeesEarned = (loanId: string) => {
    const loanPayments = payments.filter(payment => 
      payment.paymentType === 'Loan' && payment.loanId === loanId
    );
    
    const factoringFeesEarned = loanPayments.reduce((sum, payment) => {
      return sum + (Number(payment.factoringFee) || 0);
    }, 0);
    
    const sisterCompanyFeesPaid = loanPayments.reduce((sum, payment) => {
      return sum + (Number(payment.sisterCompanyFee) || 0);
    }, 0);
    
    return {
      factoringFeesEarned,
      sisterCompanyFeesPaid,
      totalFeesEarned: factoringFeesEarned + sisterCompanyFeesPaid
    };
  };

  // Handle loan row click
  const handleLoanClick = (loan: any) => {
    setSelectedLoan(loan);
    setShowPaymentHistory(true);
  };

  // Close payment history modal
  const closePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedLoan(null);
  };

  // Check if loan was collected this week
  const getThisWeekCollection = (loan: any) => {
    const thisWeekPayments = getThisWeekPayments(loan.loanId);
    
    if (thisWeekPayments.length === 0) {
      return null; // No collection this week
    }
    
    // Calculate total paid this week
    const totalCollected = thisWeekPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
    const expectedPayment = loan.installmentAmount;
    
    // Check if this is a partial payment
    if (totalCollected > 0 && totalCollected < expectedPayment) {
      return {
        collected: 'partial',
        amount: totalCollected,
        expectedAmount: expectedPayment,
        remainingAmount: expectedPayment - totalCollected,
        date: thisWeekPayments[0].datePaid,
        weekStart: weekRange.start
      };
    }
    
    // If there are payments this week and it's not partial, it was fully collected
    return {
      collected: true,
      amount: totalCollected,
      date: thisWeekPayments[0].datePaid,
      weekStart: weekRange.start
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getNextDueDate = (loan: any) => {
    if (loan.installmentsLeft === 0) return 'N/A';
    
    const firstInstallment = new Date(loan.firstInstallmentDate);
    const weeksSinceFirst = loan.totalInstallments - loan.installmentsLeft;
    const nextDue = new Date(firstInstallment);
    nextDue.setDate(firstInstallment.getDate() + (weeksSinceFirst * 7));
    
    return formatDate(nextDue.toISOString().split('T')[0]);
  };

  const getDayOfWeekDue = (loan: any) => {
    if (loan.installmentsLeft === 0) return 'N/A';
    
    const firstInstallment = new Date(loan.firstInstallmentDate);
    return firstInstallment.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getLoanStatus = (loan: any) => {
    if (loan.installmentsLeft === 0 && loan.openBalance <= 0) return 'Paid Off';
    if (loan.installmentsLeft === 0) return 'Closed';
    if (loan.openBalance <= 0) return 'Paid Off';
    
    // Check for partial payment status
    const thisWeekPayments = getThisWeekPayments(loan.loanId);
    if (thisWeekPayments.length > 0) {
      const totalPaidThisWeek = thisWeekPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
      const expectedPayment = loan.installmentAmount;
      
      // If payment is less than expected installment amount, it's a partial payment
      if (totalPaidThisWeek > 0 && totalPaidThisWeek < expectedPayment) {
        return 'Partial Payment';
      }
    }
    
    if (loan.installmentsLeft > 0 && loan.openBalance > 0) return 'Active';
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed':
        return { bg: '#d1fae5', text: '#065f46', icon: <CheckCircle size={16} /> };
      case 'Paid Off':
        return { bg: '#dbeafe', text: '#1e40af', icon: <CheckCircle size={16} /> };
      case 'Active':
        return { bg: '#fef3c7', text: '#92400e', icon: <Clock size={16} /> };
      case 'Partial Payment':
        return { bg: '#fef3c7', text: '#a16207', icon: <AlertCircle size={16} /> };
      default:
        return { bg: '#f3f4f6', text: '#374151', icon: <AlertCircle size={16} /> };
    }
  };

  // Process manual installment closure
  const onManualCloseInstallment = (closureData: ManualInstallmentClosure) => {
    if (!selectedLoan) return;

    // Create a manual closure entry
    const manualClosure: ClosedInstallment = {
      installmentNumber: closureData.installmentNumber,
      dueDate: closureData.closedDate,
      closedDate: closureData.closedDate,
      amount: closureData.amount,
      paymentAmount: 0, // No payment amount for manual closure
      paymentId: '', // No payment ID for manual closure
      note: closureData.note,
      closureType: 'manual',
      isPartial: false,
      remainingAmount: 0
    };

    // Update the loan with the new manual closure
    const updatedClosedInstallments = [
      ...(selectedLoan.closedInstallments || []),
      manualClosure
    ];

    updateLoan(selectedLoan.id, {
      closedInstallments: updatedClosedInstallments
    });

    // Refresh the selected loan
    const updatedLoan = loans.find(loan => loan.id === selectedLoan.id);
    if (updatedLoan) {
      setSelectedLoan(updatedLoan);
    }
    
    // Force refresh of the main loans list to update the overview table
    setRefreshKey(prev => prev + 1);
  };

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanProvider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => getLoanStatus(loan) === statusFilter);
    }

    // Filter by this week collection status
    if (weekFilter !== 'all') {
      filtered = filtered.filter(loan => {
        const thisWeek = getThisWeekCollection(loan);
        if (weekFilter === 'collected') return thisWeek?.collected === true;
        if (weekFilter === 'partial') return thisWeek?.collected === 'partial';
        if (weekFilter === 'not_collected') return thisWeek?.collected === false || thisWeek === null;
        if (weekFilter === 'due_this_week') return thisWeek && thisWeek.collected !== true;
        return true;
      });
    }

    return filtered;
  }, [loans, searchTerm, statusFilter, weekFilter, refreshKey]);

  const totalOutstanding = filteredLoans.reduce((sum, loan) => {
    const outstandingPrincipal = loan.openBalance;
    // Calculate remaining fees based on actual payments made
    const feesEarned = getLoanFeesEarned(loan.loanId);
    const totalFeesForLoan = loan.factoringFee + loan.loanProviderFee;
    const remainingFees = totalFeesForLoan - feesEarned.totalFeesEarned;
    return sum + outstandingPrincipal + Math.max(0, remainingFees);
  }, 0);
  const activeLoans = filteredLoans.filter(loan => getLoanStatus(loan) === 'Active').length;
  const closedLoans = filteredLoans.filter(loan => getLoanStatus(loan) === 'Closed').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Loan Status</h1>
        <p className="page-subtitle">Monitor loan status, balances, and weekly collection tracking</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <DollarSign size={24} color="white" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {formatCurrency(totalOutstanding)}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Total Outstanding (with fees)</p>
          </div>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Clock size={24} color="white" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {activeLoans}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Active Loans</p>
          </div>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <CheckCircle size={24} color="white" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {closedLoans}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Closed Loans</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">Filters</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Partial Payment">Partial Payment</option>
              <option value="Closed">Closed</option>
              <option value="Paid Off">Paid Off</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">This Week</label>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All</option>
              <option value="collected">Collected</option>
              <option value="partial">Partial Payment</option>
              <option value="not_collected">Not Collected</option>
              <option value="due_this_week">Due This Week</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setWeekFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card">
        <h2 className="card-title">Loan Status Overview</h2>
        <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Monitor loan status, balances, and weekly collection tracking. Click on any loan row to view detailed payment history.
        </p>
        <table className="table">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th>Status</th>
              <th>Loan ID</th>
              <th>Client</th>
              <th>Provider</th>
              <th>Outstanding (with fees)</th>
              <th>Progress</th>
              <th>Next Due</th>
              <th>Warnings</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => {
                const status = getLoanStatus(loan);
                const statusColors = getStatusColor(status);
                const thisWeek = getThisWeekCollection(loan);
                const nextDueDate = getNextDueDate(loan);
                const dayOfWeek = getDayOfWeekDue(loan);
                
                return (
                  <tr 
                    key={loan.id} 
                    onClick={() => handleLoanClick(loan)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {statusColors.icon}
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                        }}>
                          {status}
                        </span>
                      </div>
                    </td>
                    <td>{loan.loanId}</td>
                    <td>{loan.clientName}</td>
                    <td>{loan.loanProvider}</td>
                    <td>{(() => {
                      const feesEarned = getLoanFeesEarned(loan.loanId);
                      const totalFeesForLoan = loan.factoringFee + loan.loanProviderFee;
                      const remainingFees = totalFeesForLoan - feesEarned.totalFeesEarned;
                      return formatCurrency(loan.openBalance + Math.max(0, remainingFees));
                    })()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {(() => {
                          const progress = `${loan.totalInstallments - loan.installmentsLeft}/${loan.totalInstallments}`;
                          console.log('Progress Display Debug:', {
                            loanId: loan.loanId,
                            totalInstallments: loan.totalInstallments,
                            installmentsLeft: loan.installmentsLeft,
                            progress,
                            closedInstallmentsCount: loan.closedInstallments?.length || 0
                          });
                          return (
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {progress}
                            </span>
                          );
                        })()}
                        <div style={{ 
                          width: '60px', 
                          height: '8px', 
                          backgroundColor: '#e5e7eb', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${((loan.totalInstallments - loan.installmentsLeft) / loan.totalInstallments) * 100}%`,
                            height: '100%',
                            backgroundColor: loan.installmentsLeft === 0 ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>{nextDueDate}</td>
                    <td>
                      {(() => {
                        const warnings = [];
                        
                        // Check for missed installments based on actual due dates
                        if (loan.installmentsLeft > 0) {
                          const firstInstallmentDate = new Date(loan.firstInstallmentDate);
                          const today = new Date();
                          
                          // Reset time to start of day for accurate comparison
                          today.setHours(0, 0, 0, 0);
                          
                          // Calculate how many installments should be paid by today
                          let expectedPaidCount = 0;
                          for (let i = 1; i <= loan.totalInstallments; i++) {
                            const installmentDueDate = new Date(firstInstallmentDate);
                            installmentDueDate.setDate(firstInstallmentDate.getDate() + ((i - 1) * 7)); // Weekly installments
                            installmentDueDate.setHours(0, 0, 0, 0); // Reset time to start of day
                            
                            if (installmentDueDate <= today) {
                              expectedPaidCount = i;
                            } else {
                              break;
                            }
                          }
                          
                          // Calculate actual paid count based on payment history
                          const paymentHistory = getLoanPaymentHistory(loan.loanId);
                          const totalPaidAmount = paymentHistory.reduce((sum, payment) => sum + payment.paymentAmount, 0);
                          const actualPaidCount = Math.floor(totalPaidAmount / loan.installmentAmount);
                          
                          // Count closed installments
                          const closedInstallmentsCount = loan.closedInstallments ? loan.closedInstallments.length : 0;
                          
                          // Calculate truly missed installments (excluding closed ones)
                          const trulyMissedCount = expectedPaidCount - actualPaidCount - closedInstallmentsCount;
                          
                          if (trulyMissedCount > 0) {
                            warnings.push('Missed installment');
                          }
                        }
                        
                        // Check for partial payments this week
                        const thisWeek = getThisWeekCollection(loan);
                        if (thisWeek?.collected === 'partial') {
                          warnings.push('Partial payment');
                        }
                        
                        // Check for overdue loans
                        if (loan.installmentsLeft > 0 && nextDueDate !== 'N/A') {
                          const nextDue = new Date(nextDueDate);
                          const today = new Date();
                          if (nextDue < today) {
                            warnings.push('Overdue');
                          }
                        }
                        
                        if (warnings.length === 0) {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
                            </div>
                          );
                        }
                        
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold' }}>!</span>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchTerm || statusFilter !== 'all' || weekFilter !== 'all' 
                    ? 'No loans match the current filters.' 
                    : 'No loans found in the system.'}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: '600' }}>
              <td colSpan={4} style={{ textAlign: 'right' }}>TOTALS:</td>
              <td style={{ color: '#ef4444', fontSize: '1.1rem' }}>{formatCurrency(totalOutstanding)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Enhanced Loan Details Modal */}
      {showPaymentHistory && selectedLoan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.5rem' }}>
                  Loan Details - {selectedLoan.loanId}
                </h2>
                <p style={{ margin: 0, color: '#6b7280' }}>{selectedLoan.clientName}</p>
              </div>
              <button 
                onClick={closePaymentHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Progress Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#374151', fontSize: '1.25rem' }}>Loan Progress</h3>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#3b82f6' }}>
                  {selectedLoan.totalInstallments - selectedLoan.installmentsLeft}/{selectedLoan.totalInstallments} installments
                </span>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '16px',
                backgroundColor: '#e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: `${((selectedLoan.totalInstallments - selectedLoan.installmentsLeft) / selectedLoan.totalInstallments) * 100}%`,
                  height: '100%',
                  backgroundColor: selectedLoan.installmentsLeft === 0 ? '#10b981' : '#3b82f6',
                  transition: 'width 0.5s ease',
                  borderRadius: '8px',
                }} />
              </div>
              
              {/* Progress Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
                    {selectedLoan.totalInstallments - selectedLoan.installmentsLeft}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>Paid Installments</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>
                    {selectedLoan.installmentsLeft}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>Remaining</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
                    {formatCurrency(selectedLoan.installmentAmount)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#065f46' }}>Per Installment</div>
                </div>
              </div>
            </div>

            {/* Warning Messages Section */}
            {(() => {
              const warnings = [];
              
              // Check for missed installments based on actual due dates
              if (selectedLoan.installmentsLeft > 0) {
                const firstInstallmentDate = new Date(selectedLoan.firstInstallmentDate);
                const today = new Date();
                
                // Reset time to start of day for accurate comparison
                today.setHours(0, 0, 0, 0);
                
                // Calculate how many installments should be paid by today
                let expectedPaidCount = 0;
                for (let i = 1; i <= selectedLoan.totalInstallments; i++) {
                  const installmentDueDate = new Date(firstInstallmentDate);
                  installmentDueDate.setDate(firstInstallmentDate.getDate() + ((i - 1) * 7)); // Weekly installments
                  installmentDueDate.setHours(0, 0, 0, 0); // Reset time to start of day
                  
                  if (installmentDueDate <= today) {
                    expectedPaidCount = i;
                  } else {
                    break;
                  }
                }
                
                // Calculate actual paid count based on payment history
                const paymentHistory = getLoanPaymentHistory(selectedLoan.loanId);
                const totalPaidAmount = paymentHistory.reduce((sum, payment) => sum + payment.paymentAmount, 0);
                const actualPaidCount = Math.floor(totalPaidAmount / selectedLoan.installmentAmount);
                
                // Count closed installments
                const closedInstallmentsCount = selectedLoan.closedInstallments ? selectedLoan.closedInstallments.length : 0;
                
                // Calculate truly missed installments (excluding closed ones)
                const trulyMissedCount = expectedPaidCount - actualPaidCount - closedInstallmentsCount;
                
                // Debug logging
                console.log('Loan Debug:', {
                  loanId: selectedLoan.loanId,
                  firstInstallmentDate: selectedLoan.firstInstallmentDate,
                  firstInstallmentDateObj: firstInstallmentDate,
                  today: today,
                  expectedPaidCount,
                  actualPaidCount,
                  closedInstallmentsCount,
                  trulyMissedCount,
                  totalInstallments: selectedLoan.totalInstallments,
                  installmentsLeft: selectedLoan.installmentsLeft,
                  totalPaidAmount,
                  installmentAmount: selectedLoan.installmentAmount,
                  paymentHistory: paymentHistory.length,
                  closedInstallments: selectedLoan.closedInstallments
                });
                
                if (trulyMissedCount > 0) {
                  warnings.push(`Missed ${trulyMissedCount} installment(s)`);
                }
              }
              
              // Check for partial payments this week
              const thisWeek = getThisWeekCollection(selectedLoan);
              if (thisWeek?.collected === 'partial') {
                warnings.push(`Partial payment this week: ${formatCurrency(thisWeek.amount)} of ${formatCurrency(thisWeek.expectedAmount)}`);
              }
              
              // Check for overdue loans
              const nextDueDate = getNextDueDate(selectedLoan);
              if (selectedLoan.installmentsLeft > 0 && nextDueDate !== 'N/A') {
                const nextDue = new Date(nextDueDate);
                const today = new Date();
                if (nextDue < today) {
                  const daysOverdue = Math.ceil((today.getTime() - nextDue.getTime()) / (24 * 60 * 60 * 1000));
                  warnings.push(`Overdue by ${daysOverdue} day(s)`);
                }
              }
              
              if (warnings.length === 0) {
                return (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                      <span style={{ color: '#065f46', fontWeight: '500' }}>This loan is performing well with no issues</span>
                    </div>
                  </div>
                );
              }
              
              return (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#dc2626', fontSize: '1.25rem' }}>
                    ⚠️ Warning Issues
                  </h3>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                  }}>
                    {warnings.map((warning, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0',
                        borderBottom: index < warnings.length - 1 ? '1px solid #fecaca' : 'none',
                      }}>
                        <span style={{ color: '#ef4444', fontSize: '1rem' }}>!</span>
                        <span style={{ color: '#991b1b', fontWeight: '500' }}>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Key Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.25rem' }}>Loan Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Original Amount</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>
                    {formatCurrency(selectedLoan.loanAmount)}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Outstanding (with fees)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ef4444' }}>
                    {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      const totalFeesForLoan = selectedLoan.factoringFee + selectedLoan.loanProviderFee;
                      const remainingFees = totalFeesForLoan - feesEarned.totalFeesEarned;
                      return formatCurrency(selectedLoan.openBalance + Math.max(0, remainingFees));
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Principal: {formatCurrency(selectedLoan.openBalance)} | 
                    Fees: {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      const totalFeesForLoan = selectedLoan.factoringFee + selectedLoan.loanProviderFee;
                      const remainingFees = totalFeesForLoan - feesEarned.totalFeesEarned;
                      return formatCurrency(Math.max(0, remainingFees));
                    })()}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Next Due Date</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>
                    {getNextDueDate(selectedLoan)}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Loan Provider</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>
                    {selectedLoan.loanProvider}
                  </div>
                </div>
              </div>
            </div>

            {/* Fees Earned Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.25rem' }}>Fees Earned</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.5rem' }}>Factoring Fees Earned</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981' }}>
                    {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      return formatCurrency(feesEarned.factoringFeesEarned);
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.25rem' }}>
                    Total: {formatCurrency(selectedLoan.factoringFee)} | 
                    Remaining: {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      const remaining = selectedLoan.factoringFee - feesEarned.factoringFeesEarned;
                      return formatCurrency(Math.max(0, remaining));
                    })()}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>Sister Company Fees Paid</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f59e0b' }}>
                    {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      return formatCurrency(feesEarned.sisterCompanyFeesPaid);
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>
                    Total: {formatCurrency(selectedLoan.loanProviderFee)} | 
                    Remaining: {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      const remaining = selectedLoan.loanProviderFee - feesEarned.sisterCompanyFeesPaid;
                      return formatCurrency(Math.max(0, remaining));
                    })()}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem' }}>Total Fees Earned</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981' }}>
                    {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      return formatCurrency(feesEarned.totalFeesEarned);
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '0.25rem' }}>
                    Total Available: {formatCurrency(selectedLoan.factoringFee + selectedLoan.loanProviderFee)} | 
                    Remaining: {(() => {
                      const feesEarned = getLoanFeesEarned(selectedLoan.loanId);
                      const totalAvailable = selectedLoan.factoringFee + selectedLoan.loanProviderFee;
                      const remaining = totalAvailable - feesEarned.totalFeesEarned;
                      return formatCurrency(Math.max(0, remaining));
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Installment Timeline */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.25rem' }}>Installment Timeline</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                {Array.from({ length: selectedLoan.totalInstallments }, (_, index) => {
                  const installmentNumber = index + 1;
                  
                  // Calculate due date for this installment
                  const firstInstallmentDate = new Date(selectedLoan.firstInstallmentDate);
                  const dueDate = new Date(firstInstallmentDate);
                  dueDate.setDate(firstInstallmentDate.getDate() + ((installmentNumber - 1) * 7)); // Weekly installments
                  dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Check if this installment is marked as closed
                  const isClosed = selectedLoan.closedInstallments && 
                    selectedLoan.closedInstallments.some((closed: ClosedInstallment) => closed.installmentNumber === installmentNumber);
                  
                  // Determine installment status based on due date and closed status
                  let statusColor = '#e5e7eb'; // Default - Upcoming
                  let statusText = 'Upcoming';
                  let statusDetails = '';
                  
                  if (isClosed) {
                    // This installment has been manually closed
                    statusColor = '#10b981';
                    statusText = 'Closed';
                  } else if (dueDate <= today) {
                    // This installment is overdue and not closed
                    statusColor = '#ef4444';
                    statusText = 'Missed';
                  } else if (dueDate > today) {
                    // This installment is in the future
                    if (installmentNumber === 1) {
                      // First installment that's not due yet
                      statusColor = '#3b82f6';
                      statusText = 'Next';
                    } else {
                      statusColor = '#e5e7eb';
                      statusText = 'Upcoming';
                    }
                  }
                  
                  const handleCloseInstallment = () => {
                    // Open the CloseInstallmentModal instead of manually closing
                    setSelectedInstallment({
                      installmentNumber,
                      dueDate,
                      daysPastDue: Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
                      amount: selectedLoan.installmentAmount,
                      partialPayment: 0,
                      remainingAmount: selectedLoan.installmentAmount,
                      isPartial: false
                    } as MissedInstallment);
                    setShowCloseInstallmentModal(true);
                  };

                  const handleManualCloseInstallment = (installment: {
                    installmentNumber: number;
                    dueDate: string;
                    amount: number;
                  }) => {
                    setSelectedManualInstallment(installment);
                    setShowManualCloseModal(true);
                  };
                  
                  return (
                    <div key={installmentNumber} style={{
                      padding: '0.75rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: `2px solid ${statusColor}`,
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      position: 'relative'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>#{installmentNumber}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: statusColor === '#e5e7eb' ? '#6b7280' : statusColor,
                        fontWeight: '500',
                        marginBottom: '0.25rem'
                      }}>
                        {statusText}
                      </div>
                      {statusDetails && (
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          fontFamily: 'monospace'
                        }}>
                          {statusDetails}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        fontFamily: 'monospace'
                      }}>
                        {dueDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      
                      {/* Close Installment Button */}
                      {!isClosed && dueDate <= today && (
                        <button
                          onClick={handleCloseInstallment}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s ease',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981';
                          }}
                        >
                          Close Installment
                        </button>
                      )}

                      {/* Manual Close Installment Button */}
                      {!isClosed && dueDate <= today && (
                        <button
                          onClick={() => handleManualCloseInstallment({
                            installmentNumber,
                            dueDate: dueDate.toISOString().split('T')[0],
                            amount: selectedLoan.installmentAmount
                          })}
                          style={{
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#d97706';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f59e0b';
                          }}
                        >
                          Manual Close
                        </button>
                      )}
                      
                      {/* Closed Date Display */}
                      {isClosed && selectedLoan.closedInstallments && (
                        (() => {
                          const closedInstallment = selectedLoan.closedInstallments.find((ci: any) => ci.installmentNumber === installmentNumber);
                          return closedInstallment ? (
                            <div style={{ 
                              fontSize: '0.6rem', 
                              color: '#10b981',
                              fontFamily: 'monospace',
                              marginTop: '0.25rem'
                            }}>
                              Closed: {closedInstallment.closedDate}
                              {closedInstallment.note && (
                                <div style={{ 
                                  marginTop: '0.125rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <div style={{ position: 'relative' }}>
                                    <HelpCircle 
                                      size={12} 
                                      color="#f59e0b" 
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      backgroundColor: '#1f2937',
                                      color: 'white',
                                      padding: '0.5rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      whiteSpace: 'nowrap',
                                      zIndex: 10,
                                      opacity: 0,
                                      pointerEvents: 'none',
                                      transition: 'opacity 0.2s'
                                    }} className="note-tooltip">
                                      {closedInstallment.note}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment History Table */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.25rem' }}>
                Payment History
              </h3>
              {(() => {
                const paymentHistory = getLoanPaymentHistory(selectedLoan.loanId);
                if (paymentHistory.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#9ca3af',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      No payments recorded for this loan yet.
                    </div>
                  );
                }
                
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.875rem',
                          }}>
                            Date
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.875rem',
                          }}>
                            Amount
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.875rem',
                          }}>
                            Type
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '0.875rem',
                          }}>
                            Confirmation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment, index) => (
                          <tr key={index} style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                          }}>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                              {formatDate(payment.datePaid)}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              {formatCurrency(payment.paymentAmount)}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                              {payment.paymentType}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              {payment.bankConfirmationNumber || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Close Installment Modal */}
      {showCloseInstallmentModal && selectedInstallment && selectedLoan && (
        <CloseInstallmentModal
          isOpen={showCloseInstallmentModal}
          onClose={() => setShowCloseInstallmentModal(false)}
          installment={selectedInstallment}
          loan={selectedLoan}
          payments={payments}
          onInstallmentClosed={(result) => {
            // The modal will handle updating the loan and payments through context
            // Just close the modal and refresh the selected loan
            setShowCloseInstallmentModal(false);
            setSelectedInstallment(null);
            
            // Refresh the selected loan from context
            const updatedLoan = loans.find(l => l.id === selectedLoan.id);
            if (updatedLoan) {
              setSelectedLoan(updatedLoan);
            }
            
            // Force refresh of the main loans list to update the overview table
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Manual Close Installment Modal */}
      {showManualCloseModal && selectedManualInstallment && selectedLoan && (
        <ManualCloseInstallmentModal
          isOpen={showManualCloseModal}
          onClose={() => setShowManualCloseModal(false)}
          installment={selectedManualInstallment}
          onCloseInstallment={onManualCloseInstallment}
        />
      )}
    </div>
  );
};

export default LoanStatus;
