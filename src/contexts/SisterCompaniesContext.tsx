import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SisterCompany {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalPaid: number;
  outstanding: number;
  createdAt: string;
}

interface SisterCompaniesContextType {
  sisterCompanies: SisterCompany[];
  addSisterCompany: (company: Omit<SisterCompany, 'id' | 'totalPaid' | 'outstanding' | 'createdAt'>) => void;
  updateSisterCompany: (id: string, updates: Partial<SisterCompany>) => void;
  deleteSisterCompany: (id: string) => void;
  getSisterCompanyById: (id: string) => SisterCompany | undefined;
  getSisterCompanyByName: (name: string) => SisterCompany | undefined;
}

const SisterCompaniesContext = createContext<SisterCompaniesContextType | undefined>(undefined);

export const useSisterCompanies = () => {
  const context = useContext(SisterCompaniesContext);
  if (context === undefined) {
    throw new Error('useSisterCompanies must be used within a SisterCompaniesProvider');
  }
  return context;
};

interface SisterCompaniesProviderProps {
  children: ReactNode;
}

export const SisterCompaniesProvider: React.FC<SisterCompaniesProviderProps> = ({ children }) => {
  const [sisterCompanies, setSisterCompanies] = useState<SisterCompany[]>([
    {
      id: '1',
      name: 'Fuel Co',
      email: 'payments@fuelco.com',
      phone: '555-0101',
      totalPaid: 125000,
      outstanding: 25000,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Equipment Co',
      email: 'finance@equipmentco.com',
      phone: '555-0202',
      totalPaid: 89000,
      outstanding: 15000,
      createdAt: '2024-01-01',
    },
    {
      id: '3',
      name: 'BJK Fuel',
      email: 'accounts@bjkfuel.com',
      phone: '555-0303',
      totalPaid: 67000,
      outstanding: 8000,
      createdAt: '2024-01-01',
    },
    {
      id: '4',
      name: 'TDX',
      email: 'payments@tdx.com',
      phone: '555-0404',
      totalPaid: 45000,
      outstanding: 12000,
      createdAt: '2024-01-01',
    },
  ]);

  const addSisterCompany = (companyData: Omit<SisterCompany, 'id' | 'totalPaid' | 'outstanding' | 'createdAt'>) => {
    const newCompany: SisterCompany = {
      id: Date.now().toString(),
      ...companyData,
      totalPaid: 0,
      outstanding: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSisterCompanies(prev => [...prev, newCompany]);
  };

  const updateSisterCompany = (id: string, updates: Partial<SisterCompany>) => {
    setSisterCompanies(prev => 
      prev.map(company => 
        company.id === id ? { ...company, ...updates } : company
      )
    );
  };

  const deleteSisterCompany = (id: string) => {
    setSisterCompanies(prev => prev.filter(company => company.id !== id));
  };

  const getSisterCompanyById = (id: string) => {
    return sisterCompanies.find(company => company.id === id);
  };

  const getSisterCompanyByName = (name: string) => {
    return sisterCompanies.find(company => company.name === name);
  };

  const value: SisterCompaniesContextType = {
    sisterCompanies,
    addSisterCompany,
    updateSisterCompany,
    deleteSisterCompany,
    getSisterCompanyById,
    getSisterCompanyByName,
  };

  return (
    <SisterCompaniesContext.Provider value={value}>
      {children}
    </SisterCompaniesContext.Provider>
  );
};
