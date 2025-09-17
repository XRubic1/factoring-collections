import React, { useState } from 'react';
import { Plus, Search, DollarSign, Calendar, FileText, Building2, Trash2 } from 'lucide-react';
import { useSisterCompanies } from '../contexts/SisterCompaniesContext';
import { useClients } from '../contexts/ClientsContext';
import { useLoans } from '../contexts/LoansContext';
import { Loan } from '../types';

const Loans: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { sisterCompanies } = useSisterCompanies();
  const { clients } = useClients();
  const { loans, addLoan, updateLoan, deleteLoan } = useLoans();

  const [formData, setFormData] = useState({
    clientName: '',
    loanId: '',
    loanProvider: '',
    loanDate: '',
    firstInstallmentDate: '',
    loanAmount: '',
    totalInstallments: '',
    installmentsLeft: '',
    openBalance: '',
    installmentAmount: '',
    factoringFee: '',
    loanProviderFee: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return {
      today: today.toISOString().split('T')[0],
      nextWeek: nextWeek.toISOString().split('T')[0],
    };
  };

  const calculateTotal = () => {
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const factoringFee = parseFloat(formData.factoringFee) || 0;
    const loanProviderFee = parseFloat(formData.loanProviderFee) || 0;
    return loanAmount + factoringFee + loanProviderFee;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate installment amount when loan amount, total installments, or fees change
    if (name === 'loanAmount' || name === 'totalInstallments' || name === 'factoringFee' || name === 'loanProviderFee') {
      const loanAmount = parseFloat(name === 'loanAmount' ? value : formData.loanAmount) || 0;
      const totalInstallments = parseFloat(name === 'totalInstallments' ? value : formData.totalInstallments) || 0;
      const factoringFee = parseFloat(name === 'factoringFee' ? value : formData.factoringFee) || 0;
      const loanProviderFee = parseFloat(name === 'loanProviderFee' ? value : formData.loanProviderFee) || 0;
      
      if (totalInstallments > 0) {
        // Calculate total amount including fees, then divide by installments
        const totalAmount = loanAmount + factoringFee + loanProviderFee;
        const installmentAmount = (totalAmount / totalInstallments).toFixed(2);
        setFormData(prev => ({ ...prev, installmentAmount }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure installment amount is calculated correctly including fees
    const loanAmount = parseFloat(formData.loanAmount);
    const totalInstallments = parseInt(formData.totalInstallments);
    const factoringFee = parseFloat(formData.factoringFee);
    const loanProviderFee = parseFloat(formData.loanProviderFee);
    
    // Calculate total amount including fees, then divide by installments
    const totalAmount = loanAmount + factoringFee + loanProviderFee;
    const calculatedInstallmentAmount = totalAmount / totalInstallments;
    
    if (editingLoan) {
      updateLoan(editingLoan.id, {
        clientName: formData.clientName,
        loanId: formData.loanId,
        loanProvider: formData.loanProvider,
        loanDate: formData.loanDate,
        firstInstallmentDate: formData.firstInstallmentDate,
        loanAmount: loanAmount,
        totalInstallments: totalInstallments,
        installmentsLeft: totalInstallments,
        openBalance: loanAmount,
        installmentAmount: calculatedInstallmentAmount,
        factoringFee: factoringFee,
        loanProviderFee: loanProviderFee,
      });
    } else {
      addLoan({
        clientName: formData.clientName,
        loanId: formData.loanId,
        loanProvider: formData.loanProvider,
        loanDate: formData.loanDate,
        firstInstallmentDate: formData.firstInstallmentDate,
        loanAmount: loanAmount,
        totalInstallments: totalInstallments,
        installmentsLeft: totalInstallments,
        openBalance: loanAmount,
        installmentAmount: calculatedInstallmentAmount,
        factoringFee: factoringFee,
        loanProviderFee: loanProviderFee,
      });
    }
    
    setShowAddModal(false);
    setEditingLoan(null);
    setFormData({
      clientName: '',
      loanId: '',
      loanProvider: '',
      loanDate: '',
      firstInstallmentDate: '',
      loanAmount: '',
      totalInstallments: '',
      installmentsLeft: '',
      openBalance: '',
      installmentAmount: '',
      factoringFee: '',
      loanProviderFee: '',
    });
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      clientName: loan.clientName,
      loanId: loan.loanId,
      loanProvider: loan.loanProvider,
      loanDate: loan.loanDate,
      firstInstallmentDate: loan.firstInstallmentDate,
      loanAmount: loan.loanAmount.toString(),
      totalInstallments: loan.totalInstallments.toString(),
      installmentsLeft: loan.installmentsLeft.toString(),
      openBalance: loan.openBalance.toString(),
      installmentAmount: loan.installmentAmount.toString(),
      factoringFee: loan.factoringFee.toString(),
      loanProviderFee: loan.loanProviderFee.toString(),
    });
    setShowAddModal(true);
  };

  const handleDelete = (loan: Loan) => {
    const confirmMessage = `Are you sure you want to delete loan ${loan.loanId} for ${loan.clientName}?\n\nThis action cannot be undone and will remove all associated data.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        deleteLoan(loan.id);
        // Show success feedback (you could add a toast notification here)
        console.log(`Successfully deleted loan ${loan.loanId}`);
      } catch (error) {
        console.error('Error deleting loan:', error);
        alert('Failed to delete loan. Please try again.');
      }
    }
  };

  const handleAddNewLoan = () => {
    const { today, nextWeek } = getDefaultDates();
    setFormData(prev => ({
      ...prev,
      loanDate: today,
      firstInstallmentDate: nextWeek,
    }));
    setShowAddModal(true);
  };

  const filteredLoans = loans.filter(loan =>
    loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanProvider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Loans</h1>
        <p className="page-subtitle">Manage loan entries and track balances</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
          <button className="btn btn-primary" onClick={handleAddNewLoan}>
            <Plus size={16} />
            Add New Loan
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Loan ID</th>
              <th>Provider</th>
              <th>Loan Date</th>
              <th>First Installment</th>
              <th>Loan Amount</th>
              <th>Total Amount</th>
              <th>Installments</th>
              <th>Installment Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.clientName}</td>
                <td>{loan.loanId}</td>
                <td>{loan.loanProvider}</td>
                <td>{loan.loanDate}</td>
                <td>{loan.firstInstallmentDate}</td>
                <td>{formatCurrency(loan.loanAmount)}</td>
                <td style={{ fontWeight: '600', color: '#1e293b' }}>
                  {formatCurrency(loan.loanAmount + loan.factoringFee + loan.loanProviderFee)}
                </td>
                <td>{loan.totalInstallments}</td>
                <td>{formatCurrency(loan.installmentAmount)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem' }} onClick={() => handleEdit(loan)}>
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease'
                      }} 
                      onClick={() => handleDelete(loan)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: '600' }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTALS:</td>
              <td style={{ color: '#1e293b' }}>
                {formatCurrency(filteredLoans.reduce((sum, loan) => sum + loan.loanAmount, 0))}
              </td>
              <td style={{ color: '#1e293b' }}>
                {formatCurrency(filteredLoans.reduce((sum, loan) => sum + loan.loanAmount + loan.factoringFee + loan.loanProviderFee, 0))}
              </td>
              <td>
                {filteredLoans.reduce((sum, loan) => sum + loan.totalInstallments, 0)}
              </td>
              <td style={{ color: '#1e293b' }}>
                {formatCurrency(filteredLoans.reduce((sum, loan) => sum + loan.installmentAmount, 0))}
              </td>
              <td></td>
            </tr>
          </tfoot>
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
            minWidth: '800px',
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
              <h2 style={{ margin: 0 }}>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</h2>
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
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="clientName" className="form-label">Client</label>
                  <select
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
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
                  <label htmlFor="loanId" className="form-label">Loan ID</label>
                  <input
                    id="loanId"
                    type="text"
                    name="loanId"
                    value={formData.loanId}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., L000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loanProvider" className="form-label">Loan Provider</label>
                  <select
                    id="loanProvider"
                    name="loanProvider"
                    value={formData.loanProvider}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Provider</option>
                    {sisterCompanies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="loanDate" className="form-label">Loan Date</label>
                  <input
                    id="loanDate"
                    type="date"
                    name="loanDate"
                    value={formData.loanDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loanAmount" className="form-label">Loan Amount</label>
                  <input
                    id="loanAmount"
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="totalInstallments" className="form-label">Total Installments</label>
                  <input
                    id="totalInstallments"
                    type="number"
                    name="totalInstallments"
                    value={formData.totalInstallments}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="installmentAmount" className="form-label">Installment Amount (Including Fees)</label>
                  <input
                    id="installmentAmount"
                    type="number"
                    name="installmentAmount"
                    value={formData.installmentAmount}
                    className="form-input"
                    step="0.01"
                    required
                    readOnly
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Auto-calculated: (Loan Amount + Factoring Fee + Provider Fee) ÷ Total Installments
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="firstInstallmentDate" className="form-label">First Installment Date</label>
                  <input
                    id="firstInstallmentDate"
                    type="date"
                    name="firstInstallmentDate"
                    value={formData.firstInstallmentDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="factoringFee" className="form-label">Factoring Fee</label>
                  <input
                    id="factoringFee"
                    type="number"
                    name="factoringFee"
                    value={formData.factoringFee}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loanProviderFee" className="form-label">Loan Provider Fee</label>
                  <input
                    id="loanProviderFee"
                    type="number"
                    name="loanProviderFee"
                    value={formData.loanProviderFee}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                  TOTAL: {formatCurrency(calculateTotal())}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingLoan ? 'Update Loan' : 'Add Loan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans; 