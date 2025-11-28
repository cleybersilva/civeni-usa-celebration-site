
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, User, Edit, Eye, Palette } from 'lucide-react';

const UserInfo: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAdminRoot } = useAdminAuth();

  if (!user) return null;

  const getUserTypeInfo = (userType: string) => {
    switch (userType) {
      case 'admin_root':
        return {
          label: t('admin.adminRoot', 'Admin Root'),
          icon: <Crown className="h-4 w-4" />,
          variant: 'default' as const,
          description: t('admin.totalSystemAccess', 'Acesso total ao sistema')
        };
      case 'admin':
        return {
          label: t('admin.administrator', 'Administrador'),
          icon: <User className="h-4 w-4" />,
          variant: 'secondary' as const,
          description: t('admin.operationalManagement', 'Gerenciamento operacional')
        };
      case 'design':
        return {
          label: t('admin.designer', 'Designer'),
          icon: <Palette className="h-4 w-4" />,
          variant: 'outline' as const,
          description: t('admin.visualElements', 'Elementos visuais')
        };
      case 'editor':
        return {
          label: t('admin.editor', 'Editor'),
          icon: <Edit className="h-4 w-4" />,
          variant: 'outline' as const,
          description: t('admin.contentAndSettings', 'Conteúdo e configurações')
        };
      case 'viewer':
        return {
          label: t('admin.viewer', 'Visualizador'),
          icon: <Eye className="h-4 w-4" />,
          variant: 'outline' as const,
          description: t('admin.viewOnly', 'Apenas visualização')
        };
      default:
        return {
          label: t('admin.user', 'Usuário'),
          icon: <User className="h-4 w-4" />,
          variant: 'outline' as const,
          description: t('admin.basicAccess', 'Acesso básico')
        };
    }
  };

  const userTypeInfo = getUserTypeInfo(user.user_type);

  return (
    <Card className="mb-4 sm:mb-6 overflow-hidden border-none shadow-lg">
      <CardHeader 
        className="pb-2 sm:pb-3 px-3 sm:px-6"
        style={{
          background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)'
        }}
      >
        <CardTitle className="text-sm sm:text-lg flex items-center gap-2 text-white drop-shadow-md">
          {userTypeInfo.icon}
          {t('admin.userInfo', 'Informações do Usuário')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 font-medium mt-1">{userTypeInfo.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={userTypeInfo.variant} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
              {userTypeInfo.icon}
              {userTypeInfo.label}
            </Badge>
            {isAdminRoot() && (
              <Badge variant="destructive" className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
                <Crown className="h-3 w-3" />
                Root
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfo;
