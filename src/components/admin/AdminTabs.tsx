
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

      {/* CERTIFICADOS - SEMPRE RENDERIZADO */}
      <TabsContent value="certificados">
        {canViewCertificados ? (
          <CertificateManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* FINANCEIRO */}
      <TabsContent value="financeiro">
        {canViewFinanceiro ? (
          <FinancialDashboard />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* BANNER */}
      <TabsContent value="banner">
        {hasPermission('banner') ? (
          <BannerManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* CONTADOR */}
      <TabsContent value="contador">
        {hasPermission('contador') ? (
          <EventConfigManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* CRONOGRAMA */}
      <TabsContent value="cronograma">
        {hasPermission('cronograma') ? (
          <ScheduleManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* EVENTOS */}
      <TabsContent value="eventos">
        <EventsManager />
      </TabsContent>

      {/* INSCRIÇÕES */}
      <TabsContent value="inscricoes">
        {hasPermission('inscricoes') ? (
          <RegistrationManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* LOCAL */}
      <TabsContent value="local">
        {hasPermission('local') ? (
          <VenueConfigManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* ONLINE */}
      <TabsContent value="online">
        {hasPermission('online') ? (
          <OnlineConfigManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* PALESTRANTES */}
      <TabsContent value="palestrantes">
        {hasPermission('palestrantes') ? (
          <SpeakersManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* PARCEIROS */}
      <TabsContent value="parceiros">
        {hasPermission('parceiros') ? (
          <PartnersManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* TEXTOS */}
      <TabsContent value="textos">
        {hasPermission('textos') ? (
          <SiteTextsManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* SUBMISSÕES */}
      <TabsContent value="submissoes">
        {hasPermission('submissoes') ? (
          <SubmissionsManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* ENVIO DE VÍDEOS */}
      <TabsContent value="envio-videos">
        {hasPermission('submissoes') ? (
          <VideoSubmissionsManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* TRABALHOS */}
      <TabsContent value="trabalhos">
        {hasPermission('trabalhos') ? (
          <WorkSubmissionsManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* USUÁRIOS */}
      <TabsContent value="usuarios">
        {canViewUsuarios ? (
          <UsersManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* VÍDEOS */}
      <TabsContent value="videos">
        {hasPermission('videos') ? (
          <VideosManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>

      {/* SALAS DE APRESENTAÇÃO */}
      <TabsContent value="salas-apresentacao">
        {hasPermission('cronograma') ? (
          <PresentationRoomsManager />
        ) : (
          <div className="p-8 text-center">
            <p>Acesso negado</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
