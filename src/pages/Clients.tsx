import React, { useState } from 'react';
import { Plus, Search, User, Mail, Phone, MapPin, Calendar, Users, DollarSign, TrendingUp, X } from 'lucide-react';
import { useClients, Client } from '../contexts/ClientsContext';
import { useLoans } from '../contexts/LoansContext';
import { usePayments } from '../contexts/PaymentsContext';
import LoanDetailsModal from '../components/LoanDetailsModal';
import { Loan } from '../types';

interface ClientsProps {
  hideHeader?: boolean;
}

const Clients: React.FC<ClientsProps> = ({ hideHeader = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAE, setFilterAE] = useState('');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showLoansListModal, setShowLoansListModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { loans } = useLoans();
  const { payments } = usePayments();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    accountExecutive: '',
  });

  const [accountExecutives] = useState([
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Mike Davis' },
    { id: '4', name: 'Lisa Wilson' },
    { id: '5', name: 'David Brown' },
    { id: '6', name: 'Jennifer Lee' },
    { id: '7', name: 'Robert Garcia' },
    { id: '8', name: 'Amanda Martinez' },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      updateClient(editingClient.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        accountExecutive: formData.accountExecutive,
      });
    } else {
      addClient({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        accountExecutive: formData.accountExecutive,
      });
    }

    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      accountExecutive: '',
    });
    setShowAddModal(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      accountExecutive: client.accountExecutive,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  const handleViewLoans = (client: Client) => {
    setSelectedClient(client);
    setShowLoansListModal(true);
  };

  const handleLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowLoansListModal(false);
    setShowLoanModal(true);
  };

  const closeLoansListModal = () => {
    setShowLoansListModal(false);
    setSelectedClient(null);
  };

  const closeLoanModal = () => {
    setShowLoanModal(false);
    setSelectedLoan(null);
  };

  const getClientLoans = (clientName: string) => {
    return loans.filter(loan => loan.clientName === clientName);
  };

  // Filter clients based on search term and account executive filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAE = !filterAE || client.accountExecutive === filterAE;
    return matchesSearch && matchesAE;
  });

  // Calculate summary statistics
  const totalClients = clients.length;
  const activeClients = clients.length; // All clients are considered active for now
  const totalValue = 15000; // Based on the single loan L000 for STU Enterprises

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage client relationships and information</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
            }}>
              <Users size={24} color="white" />
            </div>
            <div>
              <p className="stat-label">Total Clients</p>
              <p className="stat-value">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
            }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <p className="stat-label">Active Clients</p>
              <p className="stat-value">{activeClients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title">Client Directory</h2>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Client
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <select
            value={filterAE}
            onChange={(e) => setFilterAE(e.target.value)}
            className="form-input"
          >
            <option value="">All Account Executives</option>
            {accountExecutives.map(ae => (
              <option key={ae.id} value={ae.name}>{ae.name}</option>
            ))}
          </select>
        </div>

        {/* Client Cards Grid */}
        <div className="client-cards-container">
          {filteredClients.map((client) => (
            <div key={client.id} className="client-card" style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
            }}>
              {/* Client Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                }}>
                  <User size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                    {client.name}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    <Calendar size={14} style={{ marginRight: '0.25rem', display: 'inline' }} />
                    Client since {client.createdAt}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <Mail size={16} style={{ marginRight: '0.75rem', color: '#64748b', width: '20px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{client.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <Phone size={16} style={{ marginRight: '0.75rem', color: '#64748b', width: '20px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{client.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <MapPin size={16} style={{ marginRight: '0.75rem', color: '#64748b', width: '20px', marginTop: '2px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{client.address}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Account Executive
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                    {client.accountExecutive}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem' }}
                  onClick={() => handleEdit(client)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem' }}
                  onClick={() => handleViewLoans(client)}
                >
                  View Loans
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ fontSize: '0.875rem', padding: '0.75rem' }}
                  onClick={() => handleDelete(client.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>No clients found</h3>
            <p style={{ margin: 0 }}>Try adjusting your search criteria or add a new client.</p>
          </div>
        )}
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
            minWidth: '500px',
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
              <h2 style={{ margin: 0 }}>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
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
              <div className="form-group">
                <label htmlFor="clientName" className="form-label">Client Name</label>
                <input
                  id="clientName"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientEmail" className="form-label">Email</label>
                <input
                  id="clientEmail"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientPhone" className="form-label">Phone</label>
                <input
                  id="clientPhone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientAddress" className="form-label">Address</label>
                <input
                  id="clientAddress"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountExecutive" className="form-label">Account Executive</label>
                <select
                  id="accountExecutive"
                  name="accountExecutive"
                  value={formData.accountExecutive}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Account Executive</option>
                  {accountExecutives.map((ae) => (
                    <option key={ae.id} value={ae.name}>
                      {ae.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Loans List Modal */}
      {showLoansListModal && selectedClient && (
        <div className="modal-overlay" onClick={closeLoansListModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Loans for {selectedClient.name}</h2>
              <button className="modal-close" onClick={closeLoansListModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {getClientLoans(selectedClient.name).length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Loan ID</th>
                        <th>Provider</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Installments</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getClientLoans(selectedClient.name).map((loan) => (
                        <tr key={loan.id} className="clickable-row">
                          <td>
                            <div className="loan-id">{loan.loanId}</div>
                          </td>
                          <td>{loan.loanProvider}</td>
                          <td className="amount">${loan.loanAmount.toLocaleString()}</td>
                          <td>
                            <div className={`status-badge ${loan.installmentsLeft > 0 ? 'active' : 'closed'}`}>
                              {loan.installmentsLeft > 0 ? 'Active' : 'Closed'}
                            </div>
                          </td>
                          <td>
                            {loan.totalInstallments - loan.installmentsLeft}/{loan.totalInstallments}
                          </td>
                          <td>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleLoanClick(loan)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data-message">
                  <DollarSign size={48} color="#9ca3af" />
                  <p>No loans found for this client</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeLoansListModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <LoanDetailsModal
          isOpen={showLoanModal}
          onClose={closeLoanModal}
          loan={selectedLoan}
          payments={payments}
        />
      )}
    </div>
  );
};

export default Clients; 