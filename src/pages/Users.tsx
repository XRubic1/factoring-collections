import React, { useState } from 'react';
import { Plus, Search, UserCheck, Mail, Phone, Edit, Trash2, Shield, Lock, Eye, Settings, FileText, DollarSign, Building2, Calendar, BarChart3, Info, Users as UsersIcon } from 'lucide-react';
import { useClients } from '../contexts/ClientsContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserPermissions {
  [permissionId: string]: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedClients: string[];
  isActive: boolean;
  permissions: UserPermissions;
  accessLevel: 'basic' | 'standard' | 'premium' | 'admin';
  createdAt: string;
}

interface UsersProps {
  hideHeader?: boolean;
}

const Users: React.FC<UsersProps> = ({ hideHeader = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  
  const { clients } = useClients();

  // Define all available permissions
  const allPermissions: Permission[] = [
    // Dashboard & Overview
    { id: 'dashboard_view', name: 'View Dashboard', description: 'Access to view dashboard metrics and overview', category: 'Dashboard' },
    { id: 'dashboard_export', name: 'Export Dashboard Data', description: 'Export dashboard data to various formats', category: 'Dashboard' },
    
    // Loan Management
    { id: 'loans_view', name: 'View Loans', description: 'View loan information and status', category: 'Loans' },
    { id: 'loans_create', name: 'Create Loans', description: 'Create new loan records', category: 'Loans' },
    { id: 'loans_edit', name: 'Edit Loans', description: 'Modify existing loan information', category: 'Loans' },
    { id: 'loans_delete', name: 'Delete Loans', description: 'Remove loan records', category: 'Loans' },
    { id: 'loans_close', name: 'Close Installments', description: 'Close loan installments and record payments', category: 'Loans' },
    { id: 'loans_manual_close', name: 'Manual Installment Closure', description: 'Manually close installments without payments', category: 'Loans' },
    
    // Client Management
    { id: 'clients_view', name: 'View Clients', description: 'View client information and details', category: 'Clients' },
    { id: 'clients_create', name: 'Create Clients', description: 'Add new client records', category: 'Clients' },
    { id: 'clients_edit', name: 'Edit Clients', description: 'Modify client information', category: 'Clients' },
    { id: 'clients_delete', name: 'Delete Clients', description: 'Remove client records', category: 'Clients' },
    
    // Payment Management
    { id: 'payments_view', name: 'View Payments', description: 'View payment records and history', category: 'Payments' },
    { id: 'payments_create', name: 'Create Payments', description: 'Record new payments', category: 'Payments' },
    { id: 'payments_edit', name: 'Edit Payments', description: 'Modify payment records', category: 'Payments' },
    { id: 'payments_delete', name: 'Delete Payments', description: 'Remove payment records', category: 'Payments' },
    
    // Sister Companies
    { id: 'sister_companies_view', name: 'View Sister Companies', description: 'View sister company information', category: 'Sister Companies' },
    { id: 'sister_companies_create', name: 'Create Sister Companies', description: 'Add new sister company records', category: 'Sister Companies' },
    { id: 'sister_companies_edit', name: 'Edit Sister Companies', description: 'Modify sister company information', category: 'Sister Companies' },
    { id: 'sister_companies_delete', name: 'Delete Sister Companies', description: 'Remove sister company records', category: 'Sister Companies' },
    
    // Reports & Analytics
    { id: 'reports_view', name: 'View Reports', description: 'Access to view various reports', category: 'Reports' },
    { id: 'reports_create', name: 'Create Reports', description: 'Generate custom reports', category: 'Reports' },
    { id: 'reports_export', name: 'Export Reports', description: 'Export reports to various formats', category: 'Reports' },
    
    // User Management
    { id: 'users_view', name: 'View Users', description: 'View user accounts and information', category: 'Users' },
    { id: 'users_create', name: 'Create Users', description: 'Create new user accounts', category: 'Users' },
    { id: 'users_edit', name: 'Edit Users', description: 'Modify user information and permissions', category: 'Users' },
    { id: 'users_delete', name: 'Delete Users', description: 'Remove user accounts', category: 'Users' },
    { id: 'users_permissions', name: 'Manage User Permissions', description: 'Set and modify user access permissions', category: 'Users' },
    
    // System Settings
    { id: 'settings_view', name: 'View Settings', description: 'View system configuration', category: 'Settings' },
    { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system configuration', category: 'Settings' },
    { id: 'system_admin', name: 'System Administration', description: 'Full system access and control', category: 'Settings' },
  ];

  // Predefined roles with permissions
  const predefinedRoles = {
    'Administrator': {
      description: 'Full system access with all permissions',
      permissions: allPermissions.reduce((acc, perm) => {
        acc[perm.id] = { read: true, write: true, delete: true, admin: true };
        return acc;
      }, {} as UserPermissions)
    },
    'Operations Manager': {
      description: 'Manage operations with limited administrative access',
      permissions: {
        dashboard_view: { read: true, write: false, delete: false, admin: false },
        dashboard_export: { read: true, write: false, delete: false, admin: false },
        loans_view: { read: true, write: true, delete: false, admin: false },
        loans_create: { read: true, write: true, delete: false, admin: false },
        loans_edit: { read: true, write: true, delete: false, admin: false },
        loans_close: { read: true, write: true, delete: false, admin: false },
        loans_manual_close: { read: true, write: true, delete: false, admin: false },
        clients_view: { read: true, write: true, delete: false, admin: false },
        clients_create: { read: true, write: true, delete: false, admin: false },
        clients_edit: { read: true, write: true, delete: false, admin: false },
        payments_view: { read: true, write: true, delete: false, admin: false },
        payments_create: { read: true, write: true, delete: false, admin: false },
        payments_edit: { read: true, write: true, delete: false, admin: false },
        sister_companies_view: { read: true, write: false, delete: false, admin: false },
        reports_view: { read: true, write: false, delete: false, admin: false },
        reports_export: { read: true, write: false, delete: false, admin: false },
        users_view: { read: true, write: false, delete: false, admin: false },
        settings_view: { read: true, write: false, delete: false, admin: false },
      }
    },
    'Account Executive': {
      description: 'Manage client relationships and loan processing',
      permissions: {
        dashboard_view: { read: true, write: false, delete: false, admin: false },
        loans_view: { read: true, write: false, delete: false, admin: false },
        loans_close: { read: true, write: true, delete: false, admin: false },
        clients_view: { read: true, write: false, delete: false, admin: false },
        payments_view: { read: true, write: false, delete: false, admin: false },
        payments_create: { read: true, write: true, delete: false, admin: false },
        reports_view: { read: true, write: false, delete: false, admin: false },
      }
    },
    'Collections Specialist': {
      description: 'Focus on collections and payment processing',
      permissions: {
        dashboard_view: { read: true, write: false, delete: false, admin: false },
        loans_view: { read: true, write: false, delete: false, admin: false },
        loans_close: { read: true, write: true, delete: false, admin: false },
        payments_view: { read: true, write: true, delete: false, admin: false },
        payments_create: { read: true, write: true, delete: false, admin: false },
        reports_view: { read: true, write: false, delete: false, admin: false },
      }
    },
    'View Only': {
      description: 'Read-only access to view information',
      permissions: {
        dashboard_view: { read: true, write: false, delete: false, admin: false },
        loans_view: { read: true, write: false, delete: false, admin: false },
        clients_view: { read: true, write: false, delete: false, admin: false },
        payments_view: { read: true, write: false, delete: false, admin: false },
        reports_view: { read: true, write: false, delete: false, admin: false },
      }
    }
  };

  // Mock data - will be replaced with real data from Supabase
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@factoring.com',
      phone: '(555) 123-4567',
      role: 'Account Executive',
      assignedClients: [],
      isActive: true,
      permissions: predefinedRoles['Account Executive'].permissions,
      accessLevel: 'standard',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@factoring.com',
      phone: '(555) 987-6543',
      role: 'Account Executive',
      assignedClients: [],
      isActive: true,
      permissions: predefinedRoles['Account Executive'].permissions,
      accessLevel: 'standard',
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@factoring.com',
      phone: '(555) 456-7890',
      role: 'Operations Manager',
      assignedClients: [],
      isActive: true,
      permissions: predefinedRoles['Operations Manager'].permissions,
      accessLevel: 'premium',
      createdAt: '2024-01-10',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    assignedClients: [] as string[],
    accessLevel: 'standard' as 'basic' | 'standard' | 'premium' | 'admin',
  });

  const roles = Object.keys(predefinedRoles);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-assign permissions when role changes
    if (name === 'role' && value && predefinedRoles[value as keyof typeof predefinedRoles]) {
      const selectedRole = predefinedRoles[value as keyof typeof predefinedRoles];
      // This will be used when creating/updating the user
    }
  };

  const handleClientAssignment = (clientName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedClients: checked
        ? [...prev.assignedClients, clientName]
        : prev.assignedClients.filter(client => client !== clientName)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get permissions for selected role
    const selectedRolePermissions = predefinedRoles[formData.role as keyof typeof predefinedRoles]?.permissions || {};
    
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      assignedClients: formData.assignedClients,
      isActive: true,
      permissions: selectedRolePermissions,
      accessLevel: formData.accessLevel,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (editingUser) {
      setUsers(prev => prev.map(user => user.id === editingUser.id ? newUser : user));
      setEditingUser(null);
    } else {
      setUsers(prev => [...prev, newUser]);
    }

    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      assignedClients: [],
      accessLevel: 'standard',
    });
    setShowAddModal(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      assignedClients: user.assignedClients,
      accessLevel: user.accessLevel,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  const handlePermissionsEdit = (user: User) => {
    setSelectedUserForPermissions(user);
    setShowPermissionsModal(true);
  };

  const handlePermissionChange = (permissionId: string, permissionType: 'read' | 'write' | 'delete' | 'admin', checked: boolean) => {
    if (!selectedUserForPermissions) return;
    
    setSelectedUserForPermissions(prev => {
      if (!prev) return prev;
      const updatedPermissions = { ...prev.permissions };
      if (!updatedPermissions[permissionId]) {
        updatedPermissions[permissionId] = { read: false, write: false, delete: false, admin: false };
      }
      updatedPermissions[permissionId][permissionType] = checked;
      return { ...prev, permissions: updatedPermissions };
    });
  };

  const saveUserPermissions = () => {
    if (!selectedUserForPermissions) return;
    
    setUsers(prev => prev.map(user => 
      user.id === selectedUserForPermissions.id ? selectedUserForPermissions : user
    ));
    setShowPermissionsModal(false);
    setSelectedUserForPermissions(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return { bg: '#dc2626', text: '#ffffff' };
      case 'premium': return { bg: '#7c3aed', text: '#ffffff' };
      case 'standard': return { bg: '#3b82f6', text: '#ffffff' };
      case 'basic': return { bg: '#6b7280', text: '#ffffff' };
      default: return { bg: '#6b7280', text: '#ffffff' };
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return { bg: '#dc2626', text: '#ffffff' };
      case 'Operations Manager': return { bg: '#7c3aed', text: '#ffffff' };
      case 'Account Executive': return { bg: '#3b82f6', text: '#ffffff' };
      case 'Collections Specialist': return { bg: '#059669', text: '#ffffff' };
      case 'View Only': return { bg: '#6b7280', text: '#ffffff' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <h1 className="page-title">Users & Access Management</h1>
          <p className="page-subtitle">Manage user accounts, roles, and permissions</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'users' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'users' ? '600' : '500',
            }}
          >
            <UsersIcon size={16} style={{ marginRight: '0.5rem' }} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'roles' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'roles' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'roles' ? '600' : '500',
            }}
          >
            <Shield size={16} style={{ marginRight: '0.5rem' }} />
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'permissions' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'permissions' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'permissions' ? '600' : '500',
            }}
          >
            <Lock size={16} style={{ marginRight: '0.5rem' }} />
            Permission Matrix
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add User
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Access Level</th>
                <th>Assigned Clients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      ...getRoleColor(user.role)
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      ...getAccessLevelColor(user.accessLevel)
                    }}>
                      {user.accessLevel.charAt(0).toUpperCase() + user.accessLevel.slice(1)}
                    </span>
                  </td>
                  <td>
                    {user.assignedClients.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {user.assignedClients.map((clientId) => {
                          const client = clients.find(c => c.id === clientId);
                          return client ? (
                            <span
                              key={clientId}
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                              }}
                            >
                              {client.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No clients assigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handlePermissionsEdit(user)}
                        className="btn btn-secondary btn-sm"
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                      >
                        <Shield size={14} />
                        Permissions
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="card">
          <h2 className="card-title">Predefined Roles & Permissions</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            These are the standard roles available in the system. Each role comes with predefined permissions that can be customized per user.
          </p>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.entries(predefinedRoles).map(([roleName, roleData]) => (
              <div key={roleName} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                      {roleName}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      {roleData.description}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    ...getRoleColor(roleName)
                  }}>
                    {Object.keys(roleData.permissions).length} Permissions
                  </span>
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Key Permissions:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(roleData.permissions).slice(0, 6).map(([permId, perms]) => {
                      const permission = allPermissions.find(p => p.id === permId);
                      if (!permission) return null;
                      
                      const hasAdmin = perms.admin;
                      const hasWrite = perms.write;
                      const hasRead = perms.read;
                      
                      let color = '#6b7280';
                      if (hasAdmin) color = '#dc2626';
                      else if (hasWrite) color = '#059669';
                      else if (hasRead) color = '#3b82f6';
                      
                      return (
                        <span key={permId} style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: color + '20',
                          color: color,
                          border: `1px solid ${color}40`
                        }}>
                          {permission.name}
                        </span>
                      );
                    })}
                    {Object.keys(roleData.permissions).length > 6 && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #d1d5db'
                      }}>
                        +{Object.keys(roleData.permissions).length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="card">
          <h2 className="card-title">Permission Matrix</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Overview of all available permissions in the system and their categories.
          </p>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {Array.from(new Set(allPermissions.map(p => p.category))).map(category => (
              <div key={category}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  {category}
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {allPermissions
                    .filter(p => p.category === category)
                    .map(permission => (
                      <div key={permission.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {permission.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {permission.description}
                          </div>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: '#e5e7eb',
                          color: '#374151'
                        }}>
                          {permission.id}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
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
              <h2 style={{ margin: 0 }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
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
                  <label htmlFor="userName" className="form-label">Full Name</label>
                  <input
                    id="userName"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userEmail" className="form-label">Email</label>
                  <input
                    id="userEmail"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userPhone" className="form-label">Phone</label>
                  <input
                    id="userPhone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userRole" className="form-label">Role</label>
                  <select
                    id="userRole"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="userAccessLevel" className="form-label">Access Level</label>
                  <select
                    id="userAccessLevel"
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Clients</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}>
                  {clients.map((client) => (
                    <label key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedClients.includes(client.name)}
                        onChange={(e) => handleClientAssignment(client.name, e.target.checked)}
                      />
                      <span>{client.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUserForPermissions && (
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
              <h2 style={{ margin: 0 }}>
                <Shield size={20} style={{ marginRight: '0.5rem' }} />
                Manage Permissions: {selectedUserForPermissions.name}
              </h2>
              <button 
                onClick={() => setShowPermissionsModal(false)}
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
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Info size={16} color="#0369a1" />
                <strong style={{ color: '#0369a1' }}>Permission Levels:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span><strong>Read:</strong> View information</span>
                <span><strong>Write:</strong> Create and edit</span>
                <span><strong>Delete:</strong> Remove records</span>
                <span><strong>Admin:</strong> Full control</span>
              </div>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {Array.from(new Set(allPermissions.map(p => p.category))).map(category => (
                <div key={category} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    {category}
                  </h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {allPermissions
                      .filter(p => p.category === category)
                      .map(permission => {
                        const userPerms = selectedUserForPermissions.permissions[permission.id] || { read: false, write: false, delete: false, admin: false };
                        
                        return (
                          <div key={permission.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto auto',
                            gap: '1rem',
                            alignItems: 'center',
                            padding: '0.75rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                {permission.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {permission.description}
                              </div>
                            </div>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={userPerms.read}
                                onChange={(e) => handlePermissionChange(permission.id, 'read', e.target.checked)}
                              />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#3b82f6' }}>Read</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={userPerms.write}
                                onChange={(e) => handlePermissionChange(permission.id, 'write', e.target.checked)}
                              />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#059669' }}>Write</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={userPerms.delete}
                                onChange={(e) => handlePermissionChange(permission.id, 'delete', e.target.checked)}
                              />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>Delete</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={userPerms.admin}
                                onChange={(e) => handlePermissionChange(permission.id, 'admin', e.target.checked)}
                              />
                              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#7c2d12' }}>Admin</span>
                            </label>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveUserPermissions}>
                <Shield size={16} style={{ marginRight: '0.5rem' }} />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 