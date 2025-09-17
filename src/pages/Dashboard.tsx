import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search,
  Calendar,
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useSisterCompanies } from '../contexts/SisterCompaniesContext';
import { useClients } from '../contexts/ClientsContext';
import { useLoans } from '../contexts/LoansContext';
import { usePayments } from '../contexts/PaymentsContext';
import { getLoansDueThisWeek, LoanWithWeeklyStatus, WeeklyStatus } from '../utils/loansDueThisWeek';
import { getPastDueLoans, LoanWithMissedInstallments, formatDaysToReadable, MissedInstallment } from '../utils/pastDueCollections';
import LoanDetailsModal from '../components/LoanDetailsModal';
import DashboardMetricsModal from '../components/DashboardMetricsModal';
import { Loan } from '../types';

interface DashboardMetrics {
  totalOutstanding: number;
  activeLoans: number;
  pastDue: number;
  dueThisWeek: number;
  collectedAmount: number;
}

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOutstanding: 0,
    activeLoans: 0,
    pastDue: 0,
    dueThisWeek: 0,
    collectedAmount: 0
  });
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0); // Force refresh mechanism
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<'collected' | 'outstanding' | 'pastDue'>('collected');
  
  const { sisterCompanies } = useSisterCompanies();
  const { clients } = useClients();
  const { loans } = useLoans();
  const { payments } = usePayments();

  // Calculate dashboard metrics
  useEffect(() => {
    if (loans.length > 0) {
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

      const activeLoans = loans.filter(loan => loan.installmentsLeft > 0).length;
      
      // Calculate past due including fees
      const pastDue = loans.reduce((sum, loan) => {
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
      
      // Calculate amount due this week (simplified calculation)
      const dueThisWeek = loans.reduce((sum, loan) => {
        if (loan.installmentsLeft > 0) {
          return sum + loan.installmentAmount;
        }
        return sum;
      }, 0);

      // Calculate collected amount from all loan payments (not filtered by date range)
      const collectedAmount = payments
        .filter((payment: any) => payment.paymentType === 'Loan')
        .reduce((sum: number, payment: any) => sum + Number(payment.paymentAmount), 0);

      setMetrics({
        totalOutstanding,
        activeLoans,
        pastDue,
        dueThisWeek,
        collectedAmount
      });
    }
  }, [loans, payments]);

  // Get due this week data using utility function
  const getDueThisWeekData = (): LoanWithWeeklyStatus[] => {
    return getLoansDueThisWeek(loans, payments, clients, '', '');
  };

  // Get past due collections data using utility function
  const getPastDueCollectionsData = (): LoanWithMissedInstallments[] => {
    return getPastDueLoans(loans, payments, clients);
  };

  // Get all upcoming installments (including those due this week and future)
  const getAllUpcomingInstallments = (): WeeklyStatus[] => {
    const allUpcoming: WeeklyStatus[] = [];
    
    loans
      .filter(loan => loan.installmentsLeft > 0)
      .forEach(loan => {
        const firstInstallment = new Date(loan.firstInstallmentDate);
        const totalWeeks = loan.totalInstallments;
        const today = new Date();
        
        for (let week = 0; week < totalWeeks; week++) {
          const dueDate = new Date(firstInstallment);
          dueDate.setDate(firstInstallment.getDate() + (week * 7));
          
          // Skip past due installments (they're handled by pastDueCollections)
          if (dueDate <= today) continue;
          
          // Check if this installment is already closed
          const isInstallmentClosed = loan.closedInstallments?.some(closed => closed.installmentNumber === week + 1);
          if (isInstallmentClosed) {
            continue; // Skip this installment as it's already closed
          }
          
          // Since this installment is not closed, it's available for payment
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: WeeklyStatus['status'] = 'due-future';
          if (daysUntilDue <= 7) {
            status = 'due-this-week';
          }
          
          allUpcoming.push({
            installmentNumber: week + 1,
            dueDate,
            daysSinceDue: -daysUntilDue, // Negative for future dates
            amount: loan.installmentAmount,
            status,
            partialPayment: 0, // No partial payments tracked here anymore
            remainingAmount: loan.installmentAmount, // Full amount remaining
            isPartial: false
          });
        }
      });
    
    // Sort by due date (earliest first)
    return allUpcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  // Filter loans based on search term
  const getFilteredLoans = () => {
    if (!searchTerm.trim()) return loans;
    
    const searchLower = searchTerm.toLowerCase();
    return loans.filter(loan => 
      loan.clientName.toLowerCase().includes(searchLower) ||
      loan.loanId.toLowerCase().includes(searchLower) ||
      (loan.accountExecutive && loan.accountExecutive.toLowerCase().includes(searchLower))
    );
  };

  // Filter due this week data based on search
  const getFilteredDueThisWeekData = () => {
    const allDueThisWeek = getDueThisWeekData();
    if (!searchTerm.trim()) return allDueThisWeek;
    
    const searchLower = searchTerm.toLowerCase();
    return allDueThisWeek.filter(loan => 
      loan.clientName.toLowerCase().includes(searchLower) ||
      loan.loanId.toLowerCase().includes(searchLower) ||
      (loan.accountExecutive && loan.accountExecutive.toLowerCase().includes(searchLower))
    );
  };

  // Filter past due data based on search
  const getFilteredPastDueData = () => {
    const allPastDue = getPastDueCollectionsData();
    if (!searchTerm.trim()) return allPastDue;
    
    const searchLower = searchTerm.toLowerCase();
    return allPastDue.filter(loan => 
      loan.clientName.toLowerCase().includes(searchLower) ||
      loan.loanId.toLowerCase().includes(searchLower) ||
      (loan.accountExecutive && loan.accountExecutive.toLowerCase().includes(searchLower))
    );
  };

  // Handle loan row click
  const handleLoanClick = (loan: any, weeklyStatus?: WeeklyStatus[] | MissedInstallment[]) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
    // Force dashboard refresh to ensure all tables are updated
    setDashboardRefreshKey(prev => prev + 1);
  };

  // Handle metric card clicks
  const handleMetricCardClick = (metricType: 'collected' | 'outstanding' | 'pastDue') => {
    setSelectedMetricType(metricType);
    setMetricsModalOpen(true);
  };

  // Close metrics modal
  const closeMetricsModal = () => {
    setMetricsModalOpen(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Get day of week for installment due date
  const getDayOfWeek = (loan: LoanWithWeeklyStatus): string => {
    if (!loan.weeklyStatus || loan.weeklyStatus.length === 0) return 'N/A';
    
    // Get the earliest due date from weekly status
    const earliestInstallment = loan.weeklyStatus.reduce((earliest, current) => {
      return current.dueDate < earliest.dueDate ? current : earliest;
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[earliestInstallment.dueDate.getDay()];
  };

  // Prepare chart data
  const getChartData = () => {
    const current = Math.max(0, metrics.totalOutstanding - metrics.pastDue - metrics.dueThisWeek);
    
    // Calculate collected amount from payments
    const collectedAmount = payments
      .filter((payment: any) => payment.paymentType === 'Loan')
      .reduce((sum: number, payment: any) => sum + Number(payment.paymentAmount), 0);
    
    return [
      { name: 'Collected', value: Math.max(0, collectedAmount), color: '#22c55e' },
      { name: 'Past Due', value: Math.max(0, metrics.pastDue), color: '#ef4444' },
      { name: 'Due This Week', value: Math.max(0, metrics.dueThisWeek), color: '#f59e0b' },
      { name: 'Current', value: Math.max(0, current), color: '#10b981' }
    ].filter(item => item.value > 0); // Only show segments with values > 0
  };

  // Use useMemo to recalculate data when loans or payments change
  const dueThisWeekData = useMemo(() => getFilteredDueThisWeekData(), [loans, payments, searchTerm, dashboardRefreshKey]);
  const pastDueCollectionsData = useMemo(() => getFilteredPastDueData(), [loans, payments, searchTerm, dashboardRefreshKey]);
  const allUpcomingInstallments = useMemo(() => getAllUpcomingInstallments(), [loans, payments, dashboardRefreshKey]);
  const chartData = useMemo(() => getChartData(), [loans, payments, dashboardRefreshKey]);

  return (
    <div className="dashboard-container">
      {/* Search Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by client, account executive, or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
            <div 
              className="metric-card clickable-metric"
              onClick={() => handleMetricCardClick('collected')}
            >
              <div className="metric-icon collected">
                <CheckCircle size={20} />
              </div>
              <div className="metric-value">{formatCurrency(metrics.collectedAmount)}</div>
              <div className="metric-label">Collected Amount</div>
            </div>
            <div 
              className="metric-card clickable-metric"
              onClick={() => handleMetricCardClick('outstanding')}
            >
              <div className="metric-icon total">
                <DollarSign size={20} />
              </div>
              <div className="metric-value">{formatCurrency(metrics.totalOutstanding)}</div>
              <div className="metric-label">Total Outstanding</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon active">
                <FileText size={20} />
              </div>
              <div className="metric-value">{metrics.activeLoans}</div>
              <div className="metric-label">Active Loans</div>
            </div>
            <div 
              className="metric-card clickable-metric"
              onClick={() => handleMetricCardClick('pastDue')}
            >
              <div className="metric-icon overdue">
                <AlertTriangle size={20} />
              </div>
              <div className="metric-value">{formatCurrency(metrics.pastDue)}</div>
              <div className="metric-label">Past Due</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon week">
                <Calendar size={20} />
              </div>
              <div className="metric-value">{formatCurrency(metrics.dueThisWeek)}</div>
              <div className="metric-label">Due This Week</div>
            </div>
      </div>

      <div className="dashboard-grid">
        {/* Collections Overview Chart */}
        <div className="card">
          <div className="card-header">
            <PieChart size={18} />
            <div className="card-title">Collections Overview</div>
            </div>
          <div className="card-body">
            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${(value/1000).toFixed(1)}K`, 'Amount']}
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  <PieChart size={48} color="#9ca3af" />
                  <p>No data available for chart</p>
            </div>
              )}
            </div>
            </div>
          </div>
          
        {/* Due This Week */}
        <div className="card full-width">
          <div className="card-header">
            <Calendar size={18} />
            <div className="card-title">Due This Week</div>
            {searchTerm && (
              <div className="search-results-info">
                Showing {dueThisWeekData.length} results for "{searchTerm}"
              </div>
            )}
          </div>
          <div className="card-body">
            {dueThisWeekData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Loan ID</th>
                    <th>Account Executive</th>
                    <th>Installment</th>
                    <th>Due Day</th>
                    <th>Weekly Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dueThisWeekData.map((loan, index) => (
                    <tr 
                      key={index} 
                      className="clickable-row"
                      onClick={() => handleLoanClick(loan, loan.weeklyStatus)}
                    >
                      <td>
                        <div className="client-name">{loan.clientName}</div>
                      </td>
                      <td><div className="loan-id">{loan.loanId}</div></td>
                      <td>
                        <div className="account-executive">
                          {loan.accountExecutive}
                        </div>
                      </td>
                      <td>
                        <div className="installment-count">
                          {Math.min(...loan.weeklyStatus.map(status => status.installmentNumber))} of {loan.totalInstallments}
                        </div>
                      </td>
                      <td>
                        <div className="due-day">
                          {getDayOfWeek(loan)}
                        </div>
                      </td>
                      <td>
                        <div className="status-badge due">Due This Week</div>
                      </td>
                      <td className="amount due">${loan.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-message">
                <Calendar size={48} color="#9ca3af" />
                <p>{searchTerm ? `No loans found matching "${searchTerm}"` : 'No loans due this week'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Past Due Collections */}
        <div className="card full-width">
          <div className="card-header">
            <AlertTriangle size={18} />
            <div className="card-title">Past Due Collections</div>
            {searchTerm && (
              <div className="search-results-info">
                Showing {pastDueCollectionsData.length} results for "{searchTerm}"
              </div>
            )}
          </div>
          <div className="card-body">
            {pastDueCollectionsData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Loan ID</th>
                    <th>Account Executive</th>
                    <th>Missed Installments</th>
                    <th>Days Overdue</th>
                    <th>Total Overdue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pastDueCollectionsData.map((loan, index) => (
                    <tr 
                      key={index} 
                      className="clickable-row"
                      onClick={() => handleLoanClick(loan, loan.missedInstallments)}
                    >
                      <td>
                        <div className="client-name">{loan.clientName}</div>
                      </td>
                      <td><div className="loan-id">{loan.loanId}</div></td>
                      <td>
                        <div className="account-executive">
                          {loan.accountExecutive}
                        </div>
                      </td>
                      <td>
                        <div className="missed-installments">
                          {loan.missedInstallments.length} missed
                        </div>
                      </td>
                                              <td>
                          <div className="days-overdue">
                            {formatDaysToReadable(loan.maxDaysPast)}
                          </div>
                        </td>
                        <td className="amount overdue">
                          ${loan.totalMissedAmount.toLocaleString()}
                        </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoanClick(loan, loan.missedInstallments);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-message">
                <AlertTriangle size={48} color="#9ca3af" />
                <p>{searchTerm ? `No loans found matching "${searchTerm}"` : 'No past due collections'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan Details Modal */}
      {isModalOpen && selectedLoan && (
        <LoanDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          loan={selectedLoan}
          payments={payments}
          weeklyStatus={(() => {
            // Find the loan data with weekly status
            const dueThisWeekLoan = getDueThisWeekData().find(l => l.loanId === selectedLoan.loanId);
            return dueThisWeekLoan?.weeklyStatus || [];
          })()}
          missedInstallments={(() => {
            // Find the loan data with missed installments
            const pastDueLoan = getPastDueCollectionsData().find(l => l.loanId === selectedLoan.loanId);
            return pastDueLoan?.missedInstallments || [];
          })()}
        />
      )}

      {/* Dashboard Metrics Modal */}
      {metricsModalOpen && (
        <DashboardMetricsModal
          isOpen={metricsModalOpen}
          onClose={closeMetricsModal}
          metricType={selectedMetricType}
          loans={getFilteredLoans()}
          payments={payments}
          clients={clients}
          dateFrom=""
          dateTo=""
        />
      )}
    </div>
  );
};

export default Dashboard; 