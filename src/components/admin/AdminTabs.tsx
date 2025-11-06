
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
import SimpleEventsManager from './SimpleEventsManager';
import WorkSubmissionsManager from './WorkSubmissionsManager';
import { SubmissionsManager } from './SubmissionsManager';
import VideoSubmissionsManager from './VideoSubmissionsManager';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminTabs = () => {
  const { user } = useAdminAuth();

  if (!user) return null;

  const hasPermission = (resource: string) => {
    if (user.user_type === 'admin_root') return true;
    if (user.user_type === 'admin') {
      return ['banner', 'contador', 'cronograma', 'eventos', 'inscricoes', 'cupons', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos', 'trabalhos', 'submissoes'].includes(resource);
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
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">Gerenciar Eventos</h1>
          <p className="text-gray-600 mb-6">Crie e gerencie eventos, palestras e atividades</p>
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Lista de Eventos</h3>
              <p className="text-gray-500">Nenhum evento encontrado</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + Novo Evento
              </button>
            </div>
          </div>
        </div>
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
    </Tabs>
  );
};

export default AdminTabs;
