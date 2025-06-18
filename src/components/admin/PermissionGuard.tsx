
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

  if (!user) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você precisa estar logado para acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasPermission(resource)) {
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
