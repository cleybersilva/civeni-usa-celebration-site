
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  user_type: 'admin' | 'editor' | 'viewer' | 'design' | 'admin_root';
  is_admin_root?: boolean;
}

interface LoginResponse {
  success: boolean;
  user?: {
    user_id: string;
    email: string;
    user_type: string;
  };
  error?: string;
}

interface SessionData {
  user: AdminUser;
  timestamp: number;
  expires: number;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (resource: string) => boolean;
  isAdminRoot: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check for valid session
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
      try {
        const sessionData: SessionData = JSON.parse(savedSession);
        if (sessionData.expires > Date.now()) {
          setUser(sessionData.user);
        } else {
          // Session expired, clear it
          localStorage.removeItem('adminSession');
          localStorage.removeItem('adminUser'); // Clean up old format too
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use the new secure login function with rate limiting
      const { data, error } = await supabase.rpc('verify_admin_login_secure', {
        user_email: email,
        user_password: password,
        user_ip: null // Could be enhanced to get real IP
      });

      if (error) throw error;

      const loginResponse = data as unknown as LoginResponse;
      if (loginResponse?.success && loginResponse.user) {
        const userData = loginResponse.user;
        
        // Verificar se é admin root
        const { data: isRootData } = await supabase.rpc('is_admin_root_user', {
          user_email: email
        });

        const adminUser: AdminUser = {
          id: userData.user_id,
          email: userData.email,
          user_type: userData.user_type as AdminUser['user_type'],
          is_admin_root: isRootData || false
        };
        
        setUser(adminUser);
        
        // Store session with expiration (24 hours)
        const sessionData = {
          user: adminUser,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        return { success: true };
      } else {
        return { success: false, error: loginResponse?.error || 'Credenciais inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminUser'); // Clean up old format too
  };

  const hasPermission = (resource: string) => {
    if (!user) return false;
    
    // Admin Root tem acesso total
    if (user.user_type === 'admin_root' || user.is_admin_root) {
      return true;
    }
    
    // Definir permissões por categoria
    const permissions = {
      admin: ['banner', 'contador', 'copyright', 'cronograma', 'inscricoes', 'cupons', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos'],
      design: ['banner', 'palestrantes', 'videos'],
      editor: ['contador', 'cronograma', 'inscricoes', 'cupons', 'local', 'online', 'parceiros', 'textos'],
      viewer: ['read'] // Apenas visualização
    };

    return permissions[user.user_type]?.includes(resource) || false;
  };

  const isAdminRoot = () => {
    return user?.user_type === 'admin_root' || user?.is_admin_root === true;
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, hasPermission, isAdminRoot }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
