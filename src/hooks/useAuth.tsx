import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '../lib/api';
import { useCart } from './useCart';

export interface User {
  id: number;
  nome: string;
  email: string;
  isAdmin: boolean;
  cpf?: string;
}

interface SignUpData {
  email: string;
  senha: string;
  nome: string;
  cpf: string;
}

type ProfileUpdateData = {
  nome: string;
  senha?: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, senha: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (dados: SignUpData) => Promise<{ user: User | null; error: Error | null }>;
  updateProfile: (dados: ProfileUpdateData) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setCartSession = useCart((state) => state.setCartSession);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');

    if (!token) {
      localStorage.removeItem('user_data');
      setUser(null);
      setCartSession(null);
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setCartSession(parsedUser.id);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setCartSession(null);
      }
    }
  }, [setCartSession]);

  const persistUser = (token: string, userData: User) => {
    setCartSession(userData.id);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const signIn = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      persistUser(data.token, data.user);
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Erro ao autenticar') };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (dados: SignUpData) => {
    setIsLoading(true);
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Erro ao cadastrar') };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setCartSession(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const updateProfile = async (dados: ProfileUpdateData) => {
    setIsLoading(true);
    try {
      await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
      if (user) {
        const novoUser = { ...user, ...dados };
        const userToStore = { ...novoUser };
        if ('senha' in userToStore) {
            delete (userToStore as {senha?: string}).senha;
        }
        localStorage.setItem('user_data', JSON.stringify(userToStore));
        setUser(userToStore as User);
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Erro ao atualizar perfil') };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.isAdmin || false, signIn, signUp, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};