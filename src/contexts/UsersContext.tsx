import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedClients: string[];
  createdAt: string;
}

interface UsersContextType {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  assignClientToUser: (userId: string, clientName: string) => void;
  removeClientFromUser: (userId: string, clientName: string) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@factoring.com',
      phone: '(555) 111-2222',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@factoring.com',
      phone: '(555) 222-3333',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-01-01',
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike.davis@factoring.com',
      phone: '(555) 333-4444',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-01-01',
    },
    {
      id: '4',
      name: 'Lisa Wilson',
      email: 'lisa.wilson@factoring.com',
      phone: '(555) 444-5555',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-01-01',
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david.brown@factoring.com',
      phone: '(555) 555-6666',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-02-01',
    },
    {
      id: '6',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@factoring.com',
      phone: '(555) 666-7777',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-01-15',
    },
    {
      id: '7',
      name: 'Robert Garcia',
      email: 'robert.garcia@factoring.com',
      phone: '(555) 777-8888',
      role: 'Account Executive',
      assignedClients: [],
      createdAt: '2024-03-01',
    },
    {
      id: '8',
      name: 'Amanda Martinez',
      email: 'amanda.martinez@factoring.com',
      phone: '(555) 888-9999',
      role: 'Account Executive',
      assignedClients: ['STU Enterprises'],
      createdAt: '2024-01-01',
    }
  ]);

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === id ? { ...user, ...updates } : user
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const assignClientToUser = (userId: string, clientName: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, assignedClients: [...user.assignedClients, clientName] }
          : user
      )
    );
  };

  const removeClientFromUser = (userId: string, clientName: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, assignedClients: user.assignedClients.filter(client => client !== clientName) }
          : user
      )
    );
  };

  const value: UsersContextType = {
    users,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    assignClientToUser,
    removeClientFromUser,
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};

