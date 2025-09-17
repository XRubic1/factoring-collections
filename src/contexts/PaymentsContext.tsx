import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Payment } from '../types';

interface PaymentsContextType {
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>, updateLoanCallback?: () => void) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  getPaymentById: (id: string) => Payment | undefined;
  getPaymentsByLoan: (loanId: string) => Payment[];
  getPaymentsByCompany: (companyName: string) => Payment[];
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
};

interface PaymentsProviderProps {
  children: ReactNode;
}

export const PaymentsProvider: React.FC<PaymentsProviderProps> = ({ children }) => {
  const [payments, setPayments] = useState<Payment[]>([]);

  const addPayment = (paymentData: Omit<Payment, 'id' | 'createdAt'>, updateLoanCallback?: () => void) => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      ...paymentData,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setPayments(prev => [...prev, newPayment]);
    
    // If this is a loan payment, trigger loan update callback
    if (paymentData.paymentType === 'Loan' && paymentData.loanId && updateLoanCallback) {
      updateLoanCallback();
    }
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.id === id ? { ...payment, ...updates } : payment
      )
    );
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(payment => payment.id !== id));
  };

  const getPaymentById = (id: string) => {
    return payments.find(payment => payment.id === id);
  };

  const getPaymentsByLoan = (loanId: string) => {
    return payments.filter(payment => payment.loanId === loanId);
  };

  const getPaymentsByCompany = (companyName: string) => {
    return payments.filter(payment => payment.companyName === companyName);
  };

  const value: PaymentsContextType = {
    payments,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentById,
    getPaymentsByLoan,
    getPaymentsByCompany,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};
