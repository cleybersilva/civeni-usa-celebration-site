
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {userTypeInfo.icon}
          {t('admin.userInfo', 'Informações do Usuário')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground">{userTypeInfo.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={userTypeInfo.variant} className="flex items-center gap-1">
              {userTypeInfo.icon}
              {userTypeInfo.label}
            </Badge>
            {isAdminRoot() && (
              <Badge variant="destructive" className="flex items-center gap-1">
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
