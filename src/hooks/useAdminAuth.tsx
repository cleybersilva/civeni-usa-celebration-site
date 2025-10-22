
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  user_type: 'admin' | 'editor' | 'viewer' | 'design' | 'admin_root';
  is_admin_root?: boolean;
  roles?: string[]; // Server-validated roles
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
  user: Omit<AdminUser, 'roles'>; // Don't store roles in localStorage
  timestamp: number;
  expires: number;
  session_token?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  sessionToken?: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (resource: string) => boolean;
  isAdminRoot: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);

  // Fetch roles from server
  const fetchUserRoles = async (email: string, token: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase.rpc('check_user_role_secure', {
        user_email: email,
        session_token: token
      });

      if (error || !data) {
        console.error('Failed to fetch user roles:', error);
        return [];
      }

      const roleData = data as unknown as { success: boolean; roles: string[]; is_admin_root: boolean };
      return roleData.success ? roleData.roles : [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  };

  useEffect(() => {
    // Check for valid session
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
      try {
        const sessionData: SessionData = JSON.parse(savedSession);
        if (sessionData.expires > Date.now() && sessionData.session_token) {
          // Restore session and fetch roles from server
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
                return;
              }

              // Fetch roles from server
              const roles = await fetchUserRoles(sessionData.user.email, sessionData.session_token);
              
              setUser({
                ...sessionData.user,
                roles
              });
              setSessionToken(sessionData.session_token);
            } catch (error) {
              console.error('Error restoring session:', error);
              localStorage.removeItem('adminSession');
              setUser(null);
            }
          })();
        } else {
          // Session expired
          localStorage.removeItem('adminSession');
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('temp_admin_login_secure', {
        user_email: email,
        user_password: password
      });

      if (error) {
        console.error('Login RPC error:', error);
        return { success: false, error: 'Erro ao fazer login' };
      }

      const loginResponse = data as unknown as LoginResponse & { session_token?: string };

      if (loginResponse && loginResponse.success && loginResponse.user && loginResponse.session_token) {
        const setEmailResult = await supabase.rpc('set_current_user_email_secure', {
          user_email: email,
          session_token: loginResponse.session_token
        });

        if (!setEmailResult.data) {
          console.error('Failed to set secure user email');
          return { success: false, error: 'Erro de autenticação' };
        }

        // Fetch roles from server
        const roles = await fetchUserRoles(email, loginResponse.session_token);
        
        const adminUser: AdminUser = {
          id: loginResponse.user.user_id,
          email: loginResponse.user.email,
          user_type: loginResponse.user.user_type as AdminUser['user_type'],
          is_admin_root: loginResponse.user.user_type === 'admin_root',
          roles
        };
        
        setUser(adminUser);
        setSessionToken(loginResponse.session_token);
        
        // Store session WITHOUT roles (roles fetched from server on each load)
        const sessionData: SessionData = {
          user: {
            id: adminUser.id,
            email: adminUser.email,
            user_type: adminUser.user_type,
            is_admin_root: adminUser.is_admin_root
          },
          timestamp: Date.now(),
          expires: Date.now() + (4 * 60 * 60 * 1000),
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
      const savedSession = localStorage.getItem('adminSession');
      if (savedSession && user) {
        try {
          const sessionData: SessionData = JSON.parse(savedSession);
          if (sessionData.session_token) {
            await supabase.rpc('revoke_admin_session', {
              user_email: user.email,
              session_token: sessionData.session_token
            });
          }
        } catch (error) {
          console.error('Failed to revoke session server-side:', error);
        }
      }
      
      setUser(null);
      setSessionToken(undefined);
      localStorage.removeItem('adminSession');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (resource: string): boolean => {
    if (!user) return false;
    
    // Admin Root has access to everything (use server-validated roles)
    if (user.is_admin_root || user.roles?.includes('admin_root')) {
      return true;
    }
    
    // If no roles loaded yet, deny access (they'll load on next render)
    if (!user.roles || user.roles.length === 0) {
      return false;
    }
    
    // Define permissions per role (UI-level only, RLS still enforces server-side)
    const permissions: Record<string, string[]> = {
      admin: ['banner', 'contador', 'copyright', 'cronograma', 'inscricoes', 'cupons', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos', 'eventos'],
      design: ['banner', 'palestrantes', 'videos'],
      editor: ['contador', 'cronograma', 'inscricoes', 'cupons', 'local', 'online', 'parceiros', 'textos', 'eventos'],
      viewer: ['read']
    };

    // Check if any of the user's server-validated roles grant access
    return user.roles?.some(role => 
      permissions[role as keyof typeof permissions]?.includes(resource)
    ) || false;
  };

  const isAdminRoot = () => {
    return user?.is_admin_root === true || user?.roles?.includes('admin_root') || false;
  };

  return (
    <AdminAuthContext.Provider value={{ user, sessionToken, login, logout, hasPermission, isAdminRoot }}>
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
