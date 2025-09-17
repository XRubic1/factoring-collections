import React, { useState } from 'react';
import { Plus, Search, DollarSign, Calendar, FileText, Building2, AlertCircle } from 'lucide-react';
import { useSisterCompanies } from '../contexts/SisterCompaniesContext';
import { useClients } from '../contexts/ClientsContext';
import { useLoans } from '../contexts/LoansContext';
import { usePayments } from '../contexts/PaymentsContext';
import { Payment } from '../types';

const Payments: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const { sisterCompanies } = useSisterCompanies();
  const { clients } = useClients();
  const { loans, updateLoan } = useLoans();
  const { payments, addPayment, updatePayment } = usePayments();

  // Get loans with partial payments
  const getLoansWithPartialPayments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return loans
      .filter(loan => loan.installmentsLeft > 0)
      .map(loan => {
        // Calculate all expected payment dates for this loan
        const firstInstallment = new Date(loan.firstInstallmentDate);
        const totalWeeks = loan.totalInstallments;
        
        let hasPartialPayment = false;
        let partialPaymentDetails = null;
        
        // Check each expected payment date
        for (let i = 0; i < totalWeeks; i++) {
          const expectedDate = new Date(firstInstallment);
          expectedDate.setDate(firstInstallment.getDate() + (i * 7));
          expectedDate.setHours(0, 0, 0, 0);
          
          // Check if this expected payment was made
          const paymentsForThisDate = payments.filter(payment => {
            if (payment.loanId !== loan.loanId) return false;
            
            const paymentDate = new Date(payment.datePaid);
            // Allow 2-day grace period for payment processing
            const gracePeriod = new Date(expectedDate);
            gracePeriod.setDate(expectedDate.getDate() + 2);
            return paymentDate >= expectedDate && paymentDate <= gracePeriod;
          });
          
          if (paymentsForThisDate.length > 0) {
            // Payment was made for this installment
            const totalPaid = paymentsForThisDate.reduce((sum, payment) => sum + payment.paymentAmount, 0);
            const expectedAmount = loan.installmentAmount;
            
            // Check if this is a partial payment
            if (totalPaid > 0 && totalPaid < expectedAmount) {
              hasPartialPayment = true;
              partialPaymentDetails = {
                expectedDate,
                installmentNumber: i + 1,
                expectedAmount,
                actualPaid: totalPaid,
                shortfall: expectedAmount - totalPaid,
                daysPastDue: Math.ceil((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
              };
              break; // Found a partial payment, no need to check further
            }
          }
        }
        
        if (hasPartialPayment && partialPaymentDetails) {
          return {
            ...loan,
            partialPaymentDetails
          };
        }
        
        return null;
      })
      .filter((loan): loan is NonNullable<typeof loan> => loan !== null);
  };

  // Mock data - will be replaced with real data from Supabase
  const [formData, setFormData] = useState({
    companyName: '',
    paymentType: '',
    clientName: '',
    loanId: '',
    paymentAmount: '',
    transactionType: 'ACH' as 'ACH' | 'Wire',
    bankConfirmationNumber: '',
    datePaid: '',
    notes: '',
    amountConfirmed: false as boolean,
    factoringFeeAmount: '',
    providerFeeAmount: '',
  });

  const paymentTypes = [
    'Loan',
    'Fuel',
    'Equipment',
    'BJK Fuel',
    'TDX',
    'Additional',
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      paymentType: value,
      clientName: '',
      loanId: '',
      paymentAmount: '',
      factoringFeeAmount: '',
      providerFeeAmount: '',
    }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      clientName: value,
      loanId: '',
      paymentAmount: '',
      factoringFeeAmount: '',
      providerFeeAmount: '',
    }));
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selectedLoan = loans.find(loan => loan.loanId === value);
    
    if (selectedLoan) {
      // Calculate fee amounts per installment
      const factoringFeePerInstallment = selectedLoan.factoringFee / selectedLoan.totalInstallments;
      const providerFeePerInstallment = selectedLoan.loanProviderFee / selectedLoan.totalInstallments;
      
      // Calculate total payment amount (principal + fees)
      const totalPaymentAmount = selectedLoan.installmentAmount;
      
      setFormData(prev => ({ 
        ...prev, 
        loanId: value,
        paymentAmount: totalPaymentAmount.toString(),
        factoringFeeAmount: factoringFeePerInstallment.toFixed(2),
        providerFeeAmount: providerFeePerInstallment.toFixed(2),
        amountConfirmed: false,
      }));
    }
  };

  // Handle paying remaining balance for partial payments
  const handlePayRemainingBalance = (loan: any) => {
    if (loan.partialPaymentDetails) {
      const { shortfall } = loan.partialPaymentDetails;
      
      // Set current date
      const today = new Date().toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        companyName: loan.loanProvider,
        paymentType: 'Loan',
        clientName: loan.clientName,
        loanId: loan.loanId,
        paymentAmount: shortfall.toString(),
        datePaid: today,
        factoringFeeAmount: '0', // No additional fees for remaining balance
        providerFeeAmount: '0',
        amountConfirmed: false,
        notes: `Remaining balance payment for installment #${loan.partialPaymentDetails.installmentNumber}`,
      }));
      
      setShowAddModal(true);
    }
  };

  const calculateNetPaymentAmount = () => {
    const principalAmount = (parseFloat(formData.paymentAmount) || 0) - (parseFloat(formData.factoringFeeAmount || '0') + parseFloat(formData.providerFeeAmount || '0'));
    const factoringFee = parseFloat(formData.factoringFeeAmount || '0');
    const providerFee = parseFloat(formData.providerFeeAmount || '0');
    return principalAmount + factoringFee + providerFee;
  };

  const calculatePrincipalAmount = () => {
    const totalAmount = parseFloat(formData.paymentAmount) || 0;
    const factoringFee = parseFloat(formData.factoringFeeAmount || '0');
    const providerFee = parseFloat(formData.providerFeeAmount || '0');
    return totalAmount - factoringFee - providerFee;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPayment = {
      companyName: formData.companyName,
      paymentType: formData.paymentType,
      loanId: formData.loanId || undefined,
      clientName: formData.clientName || undefined,
      paymentAmount: formData.paymentType === 'Loan' ? parseFloat(formData.paymentAmount) : parseFloat(formData.paymentAmount),
      transactionType: formData.transactionType,
      bankConfirmationNumber: formData.bankConfirmationNumber,
      datePaid: formData.datePaid,
      notes: formData.notes || undefined,
    };

    // If this is a loan payment, update the loan data
    if (formData.paymentType === 'Loan' && formData.loanId) {
      const selectedLoan = loans.find(loan => loan.loanId === formData.loanId);
      if (selectedLoan) {
        // Check if this is a remaining balance payment for a partial payment
        const isRemainingBalancePayment = formData.notes && formData.notes.includes('Remaining balance payment');
        
        if (isRemainingBalancePayment) {
          // This is a remaining balance payment - don't reduce installments, just update balance
          const newOpenBalance = selectedLoan.openBalance - parseFloat(formData.paymentAmount);
          
          updateLoan(selectedLoan.id, {
            openBalance: Math.max(0, newOpenBalance), // Ensure balance doesn't go negative
          });
        } else {
          // This is a regular installment payment
          const newInstallmentsLeft = selectedLoan.installmentsLeft - 1;
          const newOpenBalance = selectedLoan.openBalance - parseFloat(formData.paymentAmount);
          
          updateLoan(selectedLoan.id, {
            installmentsLeft: newInstallmentsLeft,
            openBalance: Math.max(0, newOpenBalance), // Ensure balance doesn't go negative
          });
        }
      }
    }

    addPayment(newPayment);

    setFormData({
      companyName: '',
      paymentType: '',
      clientName: '',
      loanId: '',
      paymentAmount: '',
      transactionType: 'ACH',
      bankConfirmationNumber: '',
      datePaid: '',
      notes: '',
      amountConfirmed: false as boolean,
      factoringFeeAmount: '',
      providerFeeAmount: '',
    });
    setShowAddModal(false);
  };

  // Handle payment row click for editing
  const handlePaymentClick = (payment: any) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedPayment(null);
  };

  // Handle payment update
  const handlePaymentUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPayment) {
      updatePayment(selectedPayment.id, {
        companyName: selectedPayment.companyName,
        paymentType: selectedPayment.paymentType,
        loanId: selectedPayment.loanId,
        clientName: selectedPayment.clientName,
        paymentAmount: parseFloat(selectedPayment.paymentAmount),
        transactionType: selectedPayment.transactionType,
        bankConfirmationNumber: selectedPayment.bankConfirmationNumber,
        datePaid: selectedPayment.datePaid,
        notes: selectedPayment.notes,
      });
      
      closeEditModal();
    }
  };

  const handleAddNewPayment = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      datePaid: today,
      factoringFeeAmount: '',
      providerFeeAmount: '',
    }));
    setShowAddModal(true);
  };

  const filteredPayments = payments.filter(payment =>
    payment.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.loanId && payment.loanId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.clientName && payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <p className="page-subtitle">Track outgoing payments to vendors, suppliers, and loan providers</p>
      </div>

      {/* Partial Payments Section */}
      {getLoansWithPartialPayments().length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title">⚠️ Partial Payments - Pay Remaining Balance</h2>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            These loans have partial payments that need to be completed. Click "Pay Remaining Balance" to complete the installment.
          </p>
          
          <div style={{ overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Client</th>
                  <th>Installment #</th>
                  <th>Expected Amount</th>
                  <th>Amount Paid</th>
                  <th>Remaining Balance</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {getLoansWithPartialPayments().map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: '600' }}>{loan.loanId}</td>
                    <td>{loan.clientName}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                      }}>
                        #{loan.partialPaymentDetails.installmentNumber}
                      </span>
                    </td>
                    <td>{formatCurrency(loan.partialPaymentDetails.expectedAmount)}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>
                      {formatCurrency(loan.partialPaymentDetails.actualPaid)}
                    </td>
                    <td style={{ color: '#ef4444', fontWeight: '600' }}>
                      {formatCurrency(loan.partialPaymentDetails.shortfall)}
                    </td>
                    <td>
                      {loan.partialPaymentDetails.expectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => handlePayRemainingBalance(loan)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        Pay Remaining Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAddNewPayment}>
            <Plus size={16} />
            Make Payment
          </button>
        </div>

        <h2 className="card-title">Payment History</h2>
        <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
          View all outgoing payments. Click on any payment row to edit its details.
        </p>

        <table className="table">
          <thead>
            <tr>
              <th>Date Paid</th>
              <th>Company</th>
              <th>Payment Type</th>
              <th>Loan ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Transaction Type</th>
              <th>Bank Confirmation</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr 
                key={payment.id}
                onClick={() => handlePaymentClick(payment)}
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
                <td>{payment.datePaid}</td>
                <td>{payment.companyName}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: payment.paymentType === 'Loan' ? '#dbeafe' : '#fef3c7',
                    color: payment.paymentType === 'Loan' ? '#1e40af' : '#92400e',
                  }}>
                    {payment.paymentType}
                  </span>
                </td>
                <td>{payment.loanId || '-'}</td>
                <td>{payment.clientName || '-'}</td>
                <td>{formatCurrency(payment.paymentAmount)}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: payment.transactionType === 'ACH' ? '#dcfce7' : '#fef2f2',
                    color: payment.transactionType === 'ACH' ? '#166534' : '#dc2626',
                  }}>
                    {payment.transactionType}
                  </span>
                </td>
                <td>{payment.bankConfirmationNumber}</td>
                <td>{payment.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Popup Form - No Modal Component */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ margin: 0 }}>Make Outgoing Payment</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Show remaining balance indicator */}
            {formData.notes && formData.notes.includes('Remaining balance payment') && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={20} color="#92400e" />
                <div>
                  <strong style={{ color: '#92400e' }}>Remaining Balance Payment</strong>
                  <div style={{ fontSize: '0.875rem', color: '#a16207', marginTop: '0.25rem' }}>
                    This payment will complete the partial installment without reducing the total installments left.
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <select
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Company</option>
                    {sisterCompanies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentType" className="form-label">Payment Type</label>
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handlePaymentTypeChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Payment Type</option>
                    {paymentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.paymentType === 'Loan' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="clientName" className="form-label">Client</label>
                      <select
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleClientChange}
                        className="form-input"
                        required
                        disabled={formData.amountConfirmed || Boolean(formData.notes && formData.notes.includes('Remaining balance payment'))}
                      >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.name}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="loanId" className="form-label">Loan ID</label>
                      <select
                        id="loanId"
                        name="loanId"
                        value={formData.loanId}
                        onChange={handleLoanChange}
                        className="form-input"
                        required
                        disabled={!formData.clientName || formData.amountConfirmed}
                      >
                        <option value="">Select Loan</option>
                        {loans
                          .filter(loan => loan.clientName === formData.clientName)
                          .map((loan) => (
                            <option key={loan.id} value={loan.loanId}>
                              {loan.loanId} - {formatCurrency(loan.installmentAmount)} (Principal: {formatCurrency(loan.installmentAmount - (loan.factoringFee / loan.totalInstallments) - (loan.loanProviderFee / loan.totalInstallments))})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="factoringFeeAmount" className="form-label">Factoring Fee Amount</label>
                      <input
                        id="factoringFeeAmount"
                        type="number"
                        name="factoringFeeAmount"
                        value={formData.factoringFeeAmount || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        step="0.01"
                        placeholder="0.00"
                        min="0"
                        disabled={formData.amountConfirmed || Boolean(formData.notes && formData.notes.includes('Remaining balance payment'))}
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {formData.amountConfirmed ? 'Amount locked after confirmation' : 
                         formData.notes && formData.notes.includes('Remaining balance payment') ? 'No fees for remaining balance payment' :
                         'Factoring fee amount for this installment (modifiable)'}
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="providerFeeAmount" className="form-label">Provider Fee Amount</label>
                      <input
                        id="providerFeeAmount"
                        type="number"
                        name="providerFeeAmount"
                        value={formData.providerFeeAmount || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        step="0.01"
                        placeholder="0.00"
                        min="0"
                        disabled={formData.amountConfirmed || Boolean(formData.notes && formData.notes.includes('Remaining balance payment'))}
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {formData.amountConfirmed ? 'Amount locked after confirmation' : 
                         formData.notes && formData.notes.includes('Remaining balance payment') ? 'No fees for remaining balance payment' :
                         'Provider fee amount for this installment (modifiable)'}
                      </small>
                    </div>

                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '6px', 
                      border: '1px solid #e2e8f0',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Principal Amount:</span>
                        <span style={{ fontWeight: '600' }}>
                          {formatCurrency(calculatePrincipalAmount())}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#3b82f6' }}>
                        <span>Factoring Fee Amount:</span>
                        <span>{formatCurrency(parseFloat(formData.factoringFeeAmount || '0'))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#3b82f6' }}>
                        <span>Provider Fee Amount:</span>
                        <span>{formatCurrency(parseFloat(formData.providerFeeAmount || '0'))}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        paddingTop: '0.5rem', 
                        borderTop: '1px solid #e2e8f0',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        color: '#1e293b'
                      }}>
                        <span>Total Payment Amount:</span>
                        <span>{formatCurrency(calculateNetPaymentAmount())}</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.paymentType === 'Loan' && formData.loanId && (
                  <>
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={16} color="#f59e0b" />
                        <strong style={{ color: '#a16207' }}>Partial Payment Notice</strong>
                      </div>
                      <p style={{ margin: 0, color: '#a16207', fontSize: '0.875rem' }}>
                        If you're making a partial payment (less than the full installment amount), 
                        this will be tracked on the Dashboard as a "Partial Payment" status. 
                        The remaining amount will need to be collected to complete the installment.
                      </p>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="paymentAmount" className="form-label">Payment Amount</label>
                  <input
                    id="paymentAmount"
                    type="number"
                    name="paymentAmount"
                    value={formData.paymentAmount}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    required
                    disabled={formData.paymentType === 'Loan' && !!formData.loanId && Boolean(formData.amountConfirmed)}
                  />
                  {formData.paymentType === 'Loan' && formData.loanId && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                      {formData.amountConfirmed ? 'Amount locked after confirmation' : 'Total installment amount including principal and fees (modifiable)'}
                    </small>
                  )}
                </div>

                {formData.paymentType === 'Loan' && formData.loanId && (
                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        id="amountConfirmed"
                        type="checkbox"
                        name="amountConfirmed"
                        checked={formData.amountConfirmed}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px' }}
                        required
                      />
                      <label htmlFor="amountConfirmed" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                        I confirm that the net payment amount of {formatCurrency(calculateNetPaymentAmount())} is correct
                      </label>
                    </div>
                    <small style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '1.5rem' }}>
                      You must confirm the amount before making the payment
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="transactionType" className="form-label">Transaction Type</label>
                  <select
                    id="transactionType"
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

                <div className="form-group">
                  <label htmlFor="datePaid" className="form-label">Date Paid</label>
                  <input
                    id="datePaid"
                    type="date"
                    name="datePaid"
                    value={formData.datePaid}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bankConfirmationNumber" className="form-label">Bank Confirmation Number</label>
                  <input
                    id="bankConfirmationNumber"
                    type="text"
                    name="bankConfirmationNumber"
                    value={formData.bankConfirmationNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Required"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formData.paymentType === 'Loan' && !!formData.loanId && !Boolean(formData.amountConfirmed)}
                >
                  Make Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && selectedPayment && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem',
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
                  Edit Payment
                </h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  Update payment details for {selectedPayment.paymentType === 'Loan' ? `Loan ${selectedPayment.loanId}` : selectedPayment.paymentType}
                </p>
              </div>
              <button
                onClick={closeEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.5rem',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handlePaymentUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <select
                    value={selectedPayment.companyName}
                    onChange={(e) => setSelectedPayment({...selectedPayment, companyName: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Company</option>
                    {sisterCompanies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Type</label>
                  <select
                    value={selectedPayment.paymentType}
                    onChange={(e) => setSelectedPayment({...selectedPayment, paymentType: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Loan">Loan</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {selectedPayment.paymentType === 'Loan' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Client</label>
                      <select
                        value={selectedPayment.clientName || ''}
                        onChange={(e) => setSelectedPayment({...selectedPayment, clientName: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.name}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Loan ID</label>
                      <select
                        value={selectedPayment.loanId || ''}
                        onChange={(e) => setSelectedPayment({...selectedPayment, loanId: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="">Select Loan</option>
                        {loans
                          .filter(loan => loan.clientName === selectedPayment.clientName)
                          .map((loan) => (
                            <option key={loan.id} value={loan.loanId}>
                              {loan.loanId}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Payment Amount</label>
                  <input
                    type="number"
                    value={selectedPayment.paymentAmount}
                    onChange={(e) => setSelectedPayment({...selectedPayment, paymentAmount: e.target.value})}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    value={selectedPayment.transactionType}
                    onChange={(e) => setSelectedPayment({...selectedPayment, transactionType: e.target.value as 'ACH' | 'Wire'})}
                    className="form-input"
                    required
                  >
                    <option value="ACH">ACH</option>
                    <option value="Wire">Wire</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Confirmation Number</label>
                  <input
                    type="text"
                    value={selectedPayment.bankConfirmationNumber}
                    onChange={(e) => setSelectedPayment({...selectedPayment, bankConfirmationNumber: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date Paid</label>
                  <input
                    type="date"
                    value={selectedPayment.datePaid}
                    onChange={(e) => setSelectedPayment({...selectedPayment, datePaid: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    value={selectedPayment.notes || ''}
                    onChange={(e) => setSelectedPayment({...selectedPayment, notes: e.target.value})}
                    className="form-input"
                    rows={3}
                    placeholder="Additional notes about this payment..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '1.5rem',
              }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 