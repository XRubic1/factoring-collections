import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loan, ClosedInstallment } from '../types';

interface LoansContextType {
  loans: Loan[];
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  getLoanById: (id: string) => Loan | undefined;
  getLoanByLoanId: (loanId: string) => Loan | undefined;
  getLoansByClient: (clientName: string) => Loan[];
}

const LoansContext = createContext<LoansContextType | undefined>(undefined);

export const useLoans = () => {
  const context = useContext(LoansContext);
  if (context === undefined) {
    throw new Error('useLoans must be used within a LoansProvider');
  }
  return context;
};

interface LoansProviderProps {
  children: ReactNode;
}

export const LoansProvider: React.FC<LoansProviderProps> = ({ children }) => {
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      loanId: 'L000',
      clientName: 'STU Enterprises',
      loanProvider: 'Fuel Co',
      loanAmount: 15000,
      totalInstallments: 15,
      installmentsLeft: 15,
      openBalance: 15000,
      installmentAmount: 1000,
      factoringFee: 450,
      loanProviderFee: 300,
      loanDate: '2025-07-11',
      firstInstallmentDate: '2025-07-18',
      createdAt: '2025-07-11',
      closedInstallments: [] as ClosedInstallment[]
    }
  ]);

  const addLoan = (loanData: Omit<Loan, 'id' | 'createdAt'>) => {
    const newLoan: Loan = {
      id: Date.now().toString(),
      ...loanData,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLoans(prev => [...prev, newLoan]);
  };

  const updateLoan = (id: string, updates: Partial<Loan>) => {
    setLoans(prev => {
      const updatedLoans = prev.map(loan => 
        loan.id === id ? { ...loan, ...updates } : loan
      );
      return updatedLoans;
    });
  };

  const deleteLoan = (id: string) => {
    try {
      setLoans(prev => {
        const loanToDelete = prev.find(loan => loan.id === id);
        if (!loanToDelete) {
          console.warn(`Loan with ID ${id} not found for deletion`);
          return prev;
        }
        console.log(`Deleting loan: ${loanToDelete.loanId} for client: ${loanToDelete.clientName}`);
        return prev.filter(loan => loan.id !== id);
      });
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const getLoanById = (id: string) => {
    return loans.find(loan => loan.id === id);
  };

  const getLoanByLoanId = (loanId: string) => {
    return loans.find(loan => loan.loanId === loanId);
  };

  const getLoansByClient = (clientName: string) => {
    return loans.filter(loan => loan.clientName === clientName);
  };

  const value: LoansContextType = {
    loans,
    addLoan,
    updateLoan,
    deleteLoan,
    getLoanById,
    getLoanByLoanId,
    getLoansByClient,
  };

  return (
    <LoansContext.Provider value={value}>
      {children}
    </LoansContext.Provider>
  );
};
