import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, Calendar, Download, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSisterCompanies } from '../contexts/SisterCompaniesContext';
import { useClients } from '../contexts/ClientsContext';
import { useLoans } from '../contexts/LoansContext';
import { usePayments } from '../contexts/PaymentsContext';

interface ReportFilter {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  client: string;
  sisterCompany: string;
  format: 'excel' | 'pdf';
}

interface CompanySummary {
  companyName: string;
  totalPaidAmount: number;
  totalOverdueAmount: number;
  totalFactoringFees: number;
  totalLoanProviderFees: number;
  paymentCount: number;
  overdueCount: number;
  loans: {
    loanId: string;
    clientName: string;
    paidAmount: number;
    overdueAmount: number;
    factoringFees: number;
    loanProviderFees: number;
    installmentsLeft: number;
    openBalance: number;
  }[];
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilter>({
    reportType: 'company-summary',
    dateFrom: '',
    dateTo: '',
    client: 'all',
    sisterCompany: 'all',
    format: 'excel',
  });

  const { sisterCompanies } = useSisterCompanies();
  const { clients } = useClients();
  const { loans } = useLoans();
  const { payments } = usePayments();

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setFilters(prev => ({
      ...prev,
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
    }));
  }, []);

  const reportTypes = [
    {
      id: 'company-summary',
      name: 'Company Payment Summary',
      description: 'Detailed breakdown of payments, overdue amounts, and fees by company',
      icon: DollarSign,
    },
    {
      id: 'loan-balances',
      name: 'Loan Balances by Client/Sister Company',
      description: 'Detailed breakdown of loan balances organized by client and sister company',
      icon: BarChart3,
    },
    {
      id: 'weekly-collections',
      name: 'Weekly/Monthly Collections',
      description: 'Summary of collections on a weekly and monthly basis',
      icon: TrendingUp,
    },
    {
      id: 'payment-status',
      name: 'Pending vs Confirmed vs Incomplete Payments',
      description: 'Payment status overview with detailed breakdowns',
      icon: FileText,
    },
  ];

  const handleFilterChange = (field: keyof ReportFilter, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    // Mock report generation - will be replaced with actual functionality
    console.log('Generating report with filters:', filters);
    
    // Simulate report generation delay
    setTimeout(() => {
      alert(`Report generated successfully! Format: ${filters.format.toUpperCase()}`);
    }, 1000);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    setFilters(prev => ({ ...prev, format }));
    handleGenerateReport();
  };

  // Calculate company summaries
  const getCompanySummaries = (): CompanySummary[] => {
    const summaries: { [key: string]: CompanySummary } = {};

    // Initialize summaries for all sister companies
    sisterCompanies.forEach(company => {
      summaries[company.name] = {
        companyName: company.name,
        totalPaidAmount: 0,
        totalOverdueAmount: 0,
        totalFactoringFees: 0,
        totalLoanProviderFees: 0,
        paymentCount: 0,
        overdueCount: 0,
        loans: [],
      };
    });

    // Process payments within date range
    const filteredPayments = payments.filter(payment => {
      if (filters.dateFrom && payment.datePaid < filters.dateFrom) return false;
      if (filters.dateTo && payment.datePaid > filters.dateTo) return false;
      if (filters.client !== 'all') {
        const loan = loans.find(l => l.loanId === payment.loanId);
        if (!loan || loan.clientName !== clients.find(c => c.id === filters.client)?.name) return false;
      }
      if (filters.sisterCompany !== 'all') {
        const company = sisterCompanies.find(c => c.id === filters.sisterCompany);
        if (!company || payment.companyName !== company.name) return false;
      }
      return true;
    });

    // Calculate paid amounts and fees
    filteredPayments.forEach(payment => {
      if (payment.paymentType === 'Loan' && payment.loanId) {
        const loan = loans.find(l => l.loanId === payment.loanId);
        if (loan) {
          const companySummary = summaries[payment.companyName];
          if (companySummary) {
            companySummary.totalPaidAmount += payment.paymentAmount;
            companySummary.paymentCount++;

            // Calculate fees based on payment amount ratio
            const paymentRatio = payment.paymentAmount / loan.installmentAmount;
            companySummary.totalFactoringFees += loan.factoringFee * paymentRatio;
            companySummary.totalLoanProviderFees += loan.loanProviderFee * paymentRatio;

            // Add loan details
            const existingLoan = companySummary.loans.find(l => l.loanId === loan.loanId);
            if (existingLoan) {
              existingLoan.paidAmount += payment.paymentAmount;
              existingLoan.factoringFees += loan.factoringFee * paymentRatio;
              existingLoan.loanProviderFees += loan.loanProviderFee * paymentRatio;
            } else {
              companySummary.loans.push({
                loanId: loan.loanId,
                clientName: loan.clientName,
                paidAmount: payment.paymentAmount,
                overdueAmount: 0,
                factoringFees: loan.factoringFee * paymentRatio,
                loanProviderFees: loan.loanProviderFee * paymentRatio,
                installmentsLeft: loan.installmentsLeft,
                openBalance: loan.openBalance,
              });
            }
          }
        }
      }
    });

    // Calculate overdue amounts
    loans.forEach(loan => {
      if (filters.client !== 'all') {
        const client = clients.find(c => c.id === filters.client);
        if (!client || loan.clientName !== client.name) return;
      }
      if (filters.sisterCompany !== 'all') {
        const company = sisterCompanies.find(c => c.id === filters.sisterCompany);
        if (!company || loan.loanProvider !== company.name) return;
      }

      const companySummary = summaries[loan.loanProvider];
      if (companySummary) {
        // Calculate overdue amount based on installments left and open balance
        const overdueAmount = loan.openBalance;
        if (overdueAmount > 0) {
          companySummary.totalOverdueAmount += overdueAmount;
          companySummary.overdueCount++;

          // Update loan details
          const existingLoan = companySummary.loans.find(l => l.loanId === loan.loanId);
          if (existingLoan) {
            existingLoan.overdueAmount = overdueAmount;
          } else {
            companySummary.loans.push({
              loanId: loan.loanId,
              clientName: loan.clientName,
              paidAmount: 0,
              overdueAmount: overdueAmount,
              factoringFees: 0,
              loanProviderFees: 0,
              installmentsLeft: loan.installmentsLeft,
              openBalance: loan.openBalance,
            });
          }
        }
      }
    });

    return Object.values(summaries).filter(summary => 
      summary.totalPaidAmount > 0 || summary.totalOverdueAmount > 0
    );
  };

  const companySummaries = getCompanySummaries();

  const selectedReport = reportTypes.find(r => r.id === filters.reportType);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and export detailed reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="card">
        <h2 className="card-title">Select Report Type</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className={`report-type-card ${filters.reportType === report.id ? 'selected' : ''}`}
                onClick={() => handleFilterChange('reportType', report.id)}
                style={{
                  padding: '1.5rem',
                  border: '2px solid',
                  borderColor: filters.reportType === report.id ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: filters.reportType === report.id ? '#eff6ff' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <Icon size={24} color={filters.reportType === report.id ? '#3b82f6' : '#64748b'} />
                  <h3 style={{
                    margin: '0 0 0 0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: filters.reportType === report.id ? '#1e40af' : '#1e293b',
                  }}>
                    {report.name}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: filters.reportType === report.id ? '#3b82f6' : '#64748b',
                }}>
                  {report.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h2 className="card-title">Report Filters</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client</label>
            <select
              value={filters.client}
              onChange={(e) => handleFilterChange('client', e.target.value)}
              className="form-input"
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sister Company</label>
            <select
              value={filters.sisterCompany}
              onChange={(e) => handleFilterChange('sisterCompany', e.target.value)}
              className="form-input"
            >
              <option value="all">All Companies</option>
              {sisterCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Company Summary Report */}
      {filters.reportType === 'company-summary' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title">Company Payment Summary Report</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleExport('excel')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} />
                Export Excel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleExport('pdf')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileText size={16} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9', marginBottom: '0.5rem' }}>
                ${companySummaries.reduce((sum, company) => sum + company.totalPaidAmount, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>Total Paid Amount</div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>
                ${companySummaries.reduce((sum, company) => sum + company.totalOverdueAmount, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>Total Overdue Amount</div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '0.5rem' }}>
                ${companySummaries.reduce((sum, company) => sum + company.totalFactoringFees, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>Total Factoring Fees</div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fefce8',
              border: '1px solid #eab308',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#eab308', marginBottom: '0.5rem' }}>
                {companySummaries.reduce((sum, company) => sum + company.paymentCount, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#ca8a04' }}>Total Payments</div>
            </div>
          </div>

          {/* Company Details Table */}
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
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Company Name
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Paid Amount
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Overdue Amount
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Factoring Fees
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Provider Fees
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Payments
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {companySummaries.map((company, index) => (
                  <tr key={company.companyName} style={{ 
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600', color: '#1f2937' }}>
                      {company.companyName}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669', fontWeight: '500' }}>
                      ${company.totalPaidAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>
                      ${company.totalOverdueAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>
                      ${company.totalFactoringFees.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ca8a04', fontWeight: '500' }}>
                      ${company.totalLoanProviderFees.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {company.paymentCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {company.overdueCount > 0 ? (
                        <span style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          {company.overdueCount}
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#f0fdf4',
                          color: '#16a34a',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          0
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loan Details by Company */}
          {companySummaries.map(company => (
            <div key={company.companyName} style={{ marginTop: '2rem' }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                padding: '0.75rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '6px',
                borderLeft: '4px solid #3b82f6',
                fontSize: '1.125rem',
                fontWeight: '600',
              }}>
                {company.companyName} - Loan Details
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  fontSize: '0.875rem',
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Loan ID
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Client
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Paid Amount
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Overdue Amount
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Factoring Fees
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Provider Fees
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Installments Left
                      </th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                        Open Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.loans.map((loan, index) => (
                      <tr key={loan.loanId} style={{ 
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <td style={{ padding: '0.5rem', fontWeight: '500', color: '#1f2937' }}>
                          {loan.loanId}
                        </td>
                        <td style={{ padding: '0.5rem', color: '#374151' }}>
                          {loan.clientName}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: '#059669', fontWeight: '500' }}>
                          ${loan.paidAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>
                          ${loan.overdueAmount.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>
                          ${loan.factoringFees.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: '#ca8a04', fontWeight: '500' }}>
                          ${loan.loanProviderFees.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: loan.installmentsLeft > 0 ? '#fef3c7' : '#dbeafe',
                            color: loan.installmentsLeft > 0 ? '#d97706' : '#1e40af',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                          }}>
                            {loan.installmentsLeft}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
                          <span style={{
                            color: loan.openBalance > 0 ? '#dc2626' : '#16a34a',
                          }}>
                            ${loan.openBalance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Preview for other report types */}
      {selectedReport && filters.reportType !== 'company-summary' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title">Report Preview</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleExport('excel')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} />
                Export Excel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleExport('pdf')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileText size={16} />
                Export PDF
              </button>
            </div>
          </div>

          <div style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            textAlign: 'center',
          }}>
            <FileText size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
              {selectedReport.name}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              Report will be generated based on the selected filters and exported in {filters.format.toUpperCase()} format.
            </p>
            
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              <div>
                <strong>Report Type:</strong> {selectedReport.name}
              </div>
              <div>
                <strong>Date Range:</strong> {filters.dateFrom || 'All'} - {filters.dateTo || 'All'}
              </div>
              <div>
                <strong>Client:</strong> {clients.find(c => c.id === filters.client)?.name || 'All'}
              </div>
              <div>
                <strong>Company:</strong> {sisterCompanies.find(c => c.id === filters.sisterCompany)?.name || 'All'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                reportType: 'company-summary',
                dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
              }));
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            <DollarSign size={16} />
            Last 30 Days Summary
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                reportType: 'company-summary',
                dateFrom: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
              }));
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            <TrendingUp size={16} />
            This Week's Summary
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                reportType: 'company-summary',
              }));
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            <FileText size={16} />
            All Time Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports; 