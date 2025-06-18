
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SpeakersManager from '@/components/admin/SpeakersManager';
import BannerManager from '@/components/admin/BannerManager';
import RegistrationManager from '@/components/admin/RegistrationManager';
import EventConfigManager from '@/components/admin/EventConfigManager';
import SiteTextsManager from '@/components/admin/SiteTextsManager';
import VenueConfigManager from '@/components/admin/VenueConfigManager';
import OnlineConfigManager from '@/components/admin/OnlineConfigManager';
import PartnersManager from '@/components/admin/PartnersManager';
import VideosManager from '@/components/admin/VideosManager';
import DashboardOverview from '@/components/admin/AdminDashboard';
import UsersManager from '@/components/admin/UsersManager';
import ScheduleManager from '@/components/admin/ScheduleManager';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminTabs = () => {
  const { hasPermission, isAdminRoot, user } = useAdminAuth();

  // Verificar se o usuário pode ver a guia Financeiro (apenas Admin Root e Admin)
  const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';

  // Verificar se o usuário pode ver a guia Usuários (apenas Admin Root e Admin)
  const canViewUsuarios = isAdminRoot() || user?.user_type === 'admin';

  // Definir a guia padrão baseada no tipo de usuário
  const getDefaultTab = () => {
    if (user?.user_type === 'editor') {
      return 'contador';
    }
    if (canViewFinanceiro) {
      return 'financeiro';
    }
    return 'banner';
  };

  return (
    <Tabs defaultValue={getDefaultTab()} className="space-y-12">
      <TabsList className="grid w-full grid-cols-7 lg:grid-cols-12">
        {canViewFinanceiro && <TabsTrigger value="financeiro">Financeiro</TabsTrigger>}
        {(hasPermission('banner') || isAdminRoot()) && <TabsTrigger value="banner">Banner</TabsTrigger>}
        {(hasPermission('contador') || isAdminRoot()) && <TabsTrigger value="contador">Contador</TabsTrigger>}
        {(hasPermission('cronograma') || isAdminRoot()) && <TabsTrigger value="cronograma">Cronograma</TabsTrigger>}
        {(hasPermission('inscricoes') || isAdminRoot()) && <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>}
        {(hasPermission('local') || isAdminRoot()) && <TabsTrigger value="local">Local</TabsTrigger>}
        {(hasPermission('online') || isAdminRoot()) && <TabsTrigger value="online">Online</TabsTrigger>}
        {(hasPermission('palestrantes') || isAdminRoot()) && <TabsTrigger value="palestrantes">Palestrantes</TabsTrigger>}
        {(hasPermission('parceiros') || isAdminRoot()) && <TabsTrigger value="parceiros">Parceiros</TabsTrigger>}
        {(hasPermission('textos') || isAdminRoot()) && <TabsTrigger value="textos">Textos</TabsTrigger>}
        {(hasPermission('videos') || isAdminRoot()) && <TabsTrigger value="videos">Vídeos</TabsTrigger>}
        {canViewUsuarios && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
      </TabsList>

      {canViewFinanceiro && (
        <TabsContent value="financeiro">
          <DashboardOverview />
        </TabsContent>
      )}

      {(hasPermission('banner') || isAdminRoot()) && (
        <TabsContent value="banner">
          <PermissionGuard resource="banner">
            <BannerManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('contador') || isAdminRoot()) && (
        <TabsContent value="contador">
          <PermissionGuard resource="contador">
            <EventConfigManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('cronograma') || isAdminRoot()) && (
        <TabsContent value="cronograma">
          <PermissionGuard resource="cronograma">
            <ScheduleManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('inscricoes') || isAdminRoot()) && (
        <TabsContent value="inscricoes">
          <PermissionGuard resource="inscricoes">
            <RegistrationManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('local') || isAdminRoot()) && (
        <TabsContent value="local">
          <PermissionGuard resource="local">
            <VenueConfigManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('online') || isAdminRoot()) && (
        <TabsContent value="online">
          <PermissionGuard resource="online">
            <OnlineConfigManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('palestrantes') || isAdminRoot()) && (
        <TabsContent value="palestrantes">
          <PermissionGuard resource="palestrantes">
            <SpeakersManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('parceiros') || isAdminRoot()) && (
        <TabsContent value="parceiros">
          <PermissionGuard resource="parceiros">
            <PartnersManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('textos') || isAdminRoot()) && (
        <TabsContent value="textos">
          <PermissionGuard resource="textos">
            <SiteTextsManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {(hasPermission('videos') || isAdminRoot()) && (
        <TabsContent value="videos">
          <PermissionGuard resource="videos">
            <VideosManager />
          </PermissionGuard>
        </TabsContent>
      )}

      {canViewUsuarios && (
        <TabsContent value="usuarios">
          <UsersManager />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default AdminTabs;
