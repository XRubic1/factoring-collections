import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  CreditCard, 
  DollarSign, 
  FileText,
  TrendingUp
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/management', label: 'Management', icon: Settings },
    { path: '/loans', label: 'Loans', icon: CreditCard },
    { path: '/loan-status', label: 'Loan Status', icon: TrendingUp },
    { path: '/payments', label: 'Payments', icon: DollarSign },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Factoring Collections</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar; 