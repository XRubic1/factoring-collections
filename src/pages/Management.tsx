import React, { useState } from 'react';
import { Users as UsersIcon, UserCheck, Building2 } from 'lucide-react';
import Clients from './Clients';
import Users from './Users';
import SisterCompanies from './SisterCompanies';

const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState('clients');

  const tabs = [
    { id: 'clients', label: 'Clients', icon: UsersIcon },
    { id: 'users', label: 'Users', icon: UserCheck },
    { id: 'sister-companies', label: 'Sister Companies', icon: Building2 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'clients':
        return <Clients hideHeader={true} />;
      case 'users':
        return <Users hideHeader={true} />;
      case 'sister-companies':
        return <SisterCompanies hideHeader={true} />;
      default:
        return <Clients hideHeader={true} />;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Management</h1>
        <p className="page-subtitle">Manage clients, users, and sister company relationships</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Management;
