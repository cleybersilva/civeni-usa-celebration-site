
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  user_type: 'admin' | 'editor' | 'viewer' | 'design' | 'admin_root';
  is_admin_root?: boolean;
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
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        user_email: email,
        user_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        
        // Verificar se é admin root
        const { data: isRootData } = await supabase.rpc('is_admin_root_user', {
          user_email: email
        });

        const adminUser: AdminUser = {
          id: userData.user_id,
          email: userData.email,
          user_type: userData.user_type,
          is_admin_root: isRootData || false
        };
        
        setUser(adminUser);
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        return { success: true };
      } else {
        return { success: false, error: 'Credenciais inválidas' };
      }
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminUser');
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
