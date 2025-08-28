
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
  session_token?: string;
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
          // Set the current user email for RLS policies when restoring session
          if (sessionData.session_token) {
            (async () => {
              try {
                const setEmailResult = await supabase.rpc('set_current_user_email_secure', {
                  user_email: sessionData.user.email,
                  session_token: sessionData.session_token
                });
                if (!setEmailResult.data) {
                  console.error('Failed to restore secure session, clearing storage');
                  localStorage.removeItem('adminSession');
                  setUser(null);
                }
              } catch (error) {
                console.error('Error setting user email for RLS:', error);
                localStorage.removeItem('adminSession');
                setUser(null);
              }
            })();
          } else {
            // Legacy session without token, clear it
            localStorage.removeItem('adminSession');
          }
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
      // Use the secure admin login function from Supabase
      const { data, error } = await supabase.rpc('temp_admin_login_secure', {
        user_email: email,
        user_password: password
      });

      if (error) {
        console.error('Login RPC error:', error);
        return { success: false, error: 'Erro ao fazer login' };
      }

      // Type assertion for the response data
      const loginResponse = data as unknown as LoginResponse & { session_token?: string };

      if (loginResponse && loginResponse.success && loginResponse.user && loginResponse.session_token) {
        const adminUser: AdminUser = {
          id: loginResponse.user.user_id,
          email: loginResponse.user.email,
          user_type: loginResponse.user.user_type as AdminUser['user_type'],
          is_admin_root: loginResponse.user.user_type === 'admin_root'
        };
        
        setUser(adminUser);
        
        // Set the current user email for RLS policies using secure method
        const setEmailResult = await supabase.rpc('set_current_user_email_secure', {
          user_email: email,
          session_token: loginResponse.session_token
        });

        if (!setEmailResult.data) {
          console.error('Failed to set secure user email');
          return { success: false, error: 'Erro de autenticação' };
        }
        
        // Store session with expiration (4 hours) and token - aligned with server-side TTL
        const sessionData = {
          user: adminUser,
          timestamp: Date.now(),
          expires: Date.now() + (4 * 60 * 60 * 1000), // 4 hours - matches server session
          session_token: loginResponse.session_token
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

  const logout = async () => {
    try {
      // Get current session data to check for token
      const savedSession = localStorage.getItem('adminSession');
      if (savedSession && user) {
        try {
          const sessionData: SessionData = JSON.parse(savedSession);
          if (sessionData.session_token) {
            // Revoke session server-side
            await supabase.rpc('revoke_admin_session', {
              user_email: user.email,
              session_token: sessionData.session_token
            });
          }
        } catch (error) {
          console.error('Failed to revoke session server-side:', error);
          // Continue with logout even if server-side revocation fails
        }
      }
      
      setUser(null);
      localStorage.removeItem('adminSession');
      localStorage.removeItem('adminUser'); // Clean up old format too
    } catch (error) {
      console.error('Logout error:', error);
    }
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
