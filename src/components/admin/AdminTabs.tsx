
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BannerManager from './BannerManager';
import SpeakersManager from './SpeakersManager';
import PartnersManager from './PartnersManager';
import VideosManager from './VideosManager';
import EventConfigManager from './EventConfigManager';
import VenueConfigManager from './VenueConfigManager';
import OnlineConfigManager from './OnlineConfigManager';
import SiteTextsManager from './SiteTextsManager';
import ScheduleManager from './ScheduleManager';
import RegistrationManager from './RegistrationManager';
import FinancialDashboard from './FinancialDashboard';
import UsersManager from './UsersManager';
import EventsManager from './EventsManager';
import WorkSubmissionsManager from './WorkSubmissionsManager';
import { SubmissionsManager } from './SubmissionsManager';
import VideoSubmissionsManager from './VideoSubmissionsManager';
import { PresentationRoomsManager } from './PresentationRoomsManager';
import CertificateManager from './CertificateManager';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminTabs = () => {
  const { user } = useAdminAuth();

  if (!user) return null;

  const hasPermission = (resource: string) => {
    if (user.user_type === 'admin_root') return true;
    if (user.user_type === 'admin') {
      return ['banner', 'contador', 'cronograma', 'eventos', 'inscricoes', 'cupons', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos', 'trabalhos', 'submissoes', 'certificados'].includes(resource);
    }
    if (user.user_type === 'design') {
      return ['banner', 'eventos', 'palestrantes', 'videos'].includes(resource);
    }
    if (user.user_type === 'editor') {
      return ['contador', 'eventos', 'inscricoes', 'cupons', 'local', 'online', 'parceiros', 'textos', 'trabalhos', 'submissoes'].includes(resource);
    }
    return false;
  };

  const isAdminRoot = () => user.user_type === 'admin_root';
  const canViewFinanceiro = user.user_type === 'admin_root' || user.user_type === 'admin';
  const canViewUsuarios = user.user_type === 'admin_root' || user.is_admin_root;
  const canViewCertificados = hasPermission('certificados') || user.user_type === 'admin_root' || user.user_type === 'admin';

  return (
    <Tabs defaultValue="eventos" className="w-full">
      <TabsList className="flex flex-wrap w-full gap-1 h-auto p-2">
        {canViewFinanceiro && (
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        )}
        {hasPermission('banner') && (
          <TabsTrigger value="banner">Banner</TabsTrigger>
        )}
        {hasPermission('contador') && (
          <TabsTrigger value="contador">Contador</TabsTrigger>
        )}
        {hasPermission('cronograma') && (
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
        )}
        <TabsTrigger value="eventos">Eventos</TabsTrigger>
        {hasPermission('inscricoes') && (
          <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
        )}
        {hasPermission('local') && (
          <TabsTrigger value="local">Local</TabsTrigger>
        )}
        {hasPermission('online') && (
          <TabsTrigger value="online">Online</TabsTrigger>
        )}
        {hasPermission('palestrantes') && (
          <TabsTrigger value="palestrantes">Palestrantes</TabsTrigger>
        )}
        {hasPermission('parceiros') && (
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
        )}
        {hasPermission('textos') && (
          <TabsTrigger value="textos">Textos</TabsTrigger>
        )}
        {hasPermission('submissoes') && (
          <TabsTrigger value="submissoes">Submissões</TabsTrigger>
        )}
        {hasPermission('submissoes') && (
          <TabsTrigger value="envio-videos">Envio de Vídeos</TabsTrigger>
        )}
        {hasPermission('trabalhos') && (
          <TabsTrigger value="trabalhos">Trabalhos</TabsTrigger>
        )}
        {canViewUsuarios && (
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        )}
        {hasPermission('videos') && (
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        )}
        {hasPermission('cronograma') && (
          <TabsTrigger value="salas-apresentacao">Salas de Apresentação</TabsTrigger>
        )}
        {canViewCertificados && (
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
        )}
      </TabsList>

      {canViewFinanceiro && (
        <TabsContent value="financeiro">
          <FinancialDashboard />
        </TabsContent>
      )}

      {hasPermission('banner') && (
        <TabsContent value="banner">
          <BannerManager />
        </TabsContent>
      )}

      {hasPermission('contador') && (
        <TabsContent value="contador">
          <EventConfigManager />
        </TabsContent>
      )}

      {hasPermission('cronograma') && (
        <TabsContent value="cronograma">
          <ScheduleManager />
        </TabsContent>
      )}

      <TabsContent value="eventos">
        <EventsManager />
      </TabsContent>

      {hasPermission('inscricoes') && (
        <TabsContent value="inscricoes">
          <RegistrationManager />
        </TabsContent>
      )}

      {hasPermission('local') && (
        <TabsContent value="local">
          <VenueConfigManager />
        </TabsContent>
      )}

      {hasPermission('online') && (
        <TabsContent value="online">
          <OnlineConfigManager />
        </TabsContent>
      )}

      {hasPermission('palestrantes') && (
        <TabsContent value="palestrantes">
          <SpeakersManager />
        </TabsContent>
      )}

      {hasPermission('parceiros') && (
        <TabsContent value="parceiros">
          <PartnersManager />
        </TabsContent>
      )}

      {hasPermission('textos') && (
        <TabsContent value="textos">
          <SiteTextsManager />
        </TabsContent>
      )}

      {hasPermission('submissoes') && (
        <TabsContent value="submissoes">
          <SubmissionsManager />
        </TabsContent>
      )}

      {hasPermission('submissoes') && (
        <TabsContent value="envio-videos">
          <VideoSubmissionsManager />
        </TabsContent>
      )}

      {hasPermission('trabalhos') && (
        <TabsContent value="trabalhos">
          <WorkSubmissionsManager />
        </TabsContent>
      )}

      {canViewUsuarios && (
        <TabsContent value="usuarios">
          <UsersManager />
        </TabsContent>
      )}

      {hasPermission('videos') && (
        <TabsContent value="videos">
          <VideosManager />
        </TabsContent>
      )}

      {hasPermission('cronograma') && (
        <TabsContent value="salas-apresentacao">
          <PresentationRoomsManager />
        </TabsContent>
      )}

      {canViewCertificados && (
        <TabsContent value="certificados">
          <CertificateManager />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default AdminTabs;
