import React, { useState } from 'react';
import { Plus, Search, Building2, Mail, Phone, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useSisterCompanies, SisterCompany } from '../contexts/SisterCompaniesContext';

interface SisterCompaniesProps {
  hideHeader?: boolean;
}

const SisterCompanies: React.FC<SisterCompaniesProps> = ({ hideHeader = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { sisterCompanies, addSisterCompany } = useSisterCompanies();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addSisterCompany({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
    });
    setShowAddModal(false);
  };

  const filteredCompanies = sisterCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = sisterCompanies.reduce((sum, company) => sum + company.totalPaid, 0);
  const totalOutstanding = sisterCompanies.reduce((sum, company) => sum + company.outstanding, 0);

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <h1 className="page-title">Sister Companies</h1>
          <p className="page-subtitle">Manage sister company relationships and payment tracking</p>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
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
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Paid</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
            }}>
              <TrendingDown size={24} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Outstanding</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
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
              <Building2 size={24} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total Companies</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>
                {sisterCompanies.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add New Company
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Paid</th>
              <th>Outstanding</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr key={company.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '0.75rem',
                    }}>
                      <Building2 size={16} color="white" />
                    </div>
                    <span style={{ fontWeight: '500' }}>{company.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
                    {company.email}
                  </div>
                </td>
                <td>
                  {company.phone ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Phone size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
                      {company.phone}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No phone</span>
                  )}
                </td>
                <td>
                  <span style={{ color: '#10b981', fontWeight: '500' }}>
                    {formatCurrency(company.totalPaid)}
                  </span>
                </td>
                <td>
                  <span style={{ color: '#ef4444', fontWeight: '500' }}>
                    {formatCurrency(company.outstanding)}
                  </span>
                </td>
                <td>{company.createdAt}</td>
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
              <h2 style={{ margin: 0 }}>Add New Sister Company</h2>
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
                <label htmlFor="name" className="form-label">Company Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter company email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone (Optional)</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter company phone number"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SisterCompanies; 