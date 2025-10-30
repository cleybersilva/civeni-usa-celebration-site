
import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  resource, 
  children, 
  fallback 
}) => {
  const { hasPermission, user } = useAdminAuth();

  console.log('[PermissionGuard] Checking resource:', resource, 'User:', user);

  if (!user) {
    console.log('[PermissionGuard] No user logged in');
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você precisa estar logado para acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  const hasAccess = hasPermission(resource);
  console.log('[PermissionGuard] hasPermission result:', hasAccess);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade.
          <br />
          <small>Seu perfil: {user.user_type} | Recurso necessário: {resource}</small>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
