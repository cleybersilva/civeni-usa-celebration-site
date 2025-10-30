// Admin Dashboard Content - v2.0 - Garantindo renderização de filtros e exportação
import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import UserInfo from '@/components/admin/UserInfo';
import DashboardOverview from '@/components/admin/AdminDashboard';
import BannerManager from '@/components/admin/BannerManager';
import EventConfigManager from '@/components/admin/EventConfigManager';
import CopyrightManager from '@/components/admin/CopyrightManager';
import ScheduleManager from '@/components/admin/ScheduleManager';
import RegistrationManager from '@/components/admin/RegistrationManager';
import VenueConfigManager from '@/components/admin/VenueConfigManager';
import OnlineConfigManager from '@/components/admin/OnlineConfigManager';
import SpeakersManager from '@/components/admin/SpeakersManager';
import PartnersManager from '@/components/admin/PartnersManager';
import SiteTextsManager from '@/components/admin/SiteTextsManager';
import VideosManager from '@/components/admin/VideosManager';
import UsersManager from '@/components/admin/UsersManager';
import SyncManager from '@/components/admin/SyncManager';
import CiveniII2024ImagesManager from '@/components/admin/CiveniII2024ImagesManager';
import TransmissaoLiveManager from '@/components/admin/TransmissaoLiveManager';
import WorkSubmissionsManager from '@/components/admin/WorkSubmissionsManager';
import WorksManager from '@/components/admin/WorksManager';
import MidiaDigitalManager from '@/components/admin/MidiaDigitalManager';
import CongressoManager from '@/components/admin/CongressoManager';
import CongressoComiteManager from '@/components/admin/CongressoComiteManager';
import ThematicAreasManager from '@/components/admin/ThematicAreasManager';
import CounterConfigManager from '@/components/admin/CounterConfigManager';
import EventsManager from '@/components/admin/EventsManager';
import CiveniProgramManager from '@/components/admin/CiveniProgramManager';
import CiveniOnlineProgramManager from '@/components/admin/CiveniOnlineProgramManager';
import TransmissionStreamsManager from '@/components/admin/TransmissionStreamsManager';
import TransmissionScheduleManager from '@/components/admin/TransmissionScheduleManager';
import TransmissionFAQManager from '@/components/admin/TransmissionFAQManager';
import { SubmissionsManager } from '@/components/admin/SubmissionsManager';

import PermissionGuard from '@/components/admin/PermissionGuard';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminDashboardContent = () => {
  const { hasPermission, isAdminRoot, user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('financeiro');

  // Definir aba inicial baseada no tipo de usuário
  useEffect(() => {
    if (user) {
      if (user.user_type === 'editor') {
        setActiveTab('contador');
      } else {
        const canViewFinanceiro = isAdminRoot() || user.user_type === 'admin';
        setActiveTab(canViewFinanceiro ? 'financeiro' : 'banner');
      }
    }
  }, [user, isAdminRoot]);

  // Escutar mudanças de aba vindas do sidebar
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      console.log('Tab changed to:', event.detail.activeTab);
      setActiveTab(event.detail.activeTab);
    };

    window.addEventListener('adminTabChange', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('adminTabChange', handleTabChange as EventListener);
    };
  }, []);

  // Verificar permissões
  const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';
  const canViewUsuarios = isAdminRoot() || user?.user_type === 'admin';
  const isAdmin = isAdminRoot() || user?.user_type === 'admin';

  const renderTabContent = () => {
    console.log('Rendering tab content for:', activeTab);
    
    switch (activeTab) {
      case 'financeiro':
        return canViewFinanceiro ? <DashboardOverview /> : null;
      
      case 'midia-digital':
        return (hasPermission('banner') || hasPermission('videos') || hasPermission('palestrantes') || isAdminRoot()) ? (
          <MidiaDigitalManager />
        ) : null;
      
      case 'areas-tematicas':
        return (hasPermission('textos') || isAdminRoot()) ? (
          <PermissionGuard resource="textos">
            <ThematicAreasManager />
          </PermissionGuard>
        ) : null;
      
      case 'comite':
        return (hasPermission('palestrantes') || isAdminRoot()) ? (
          <PermissionGuard resource="palestrantes">
            <CongressoComiteManager />
          </PermissionGuard>
        ) : null;
      
      case 'congresso':
        return (hasPermission('textos') || isAdminRoot()) ? (
          <PermissionGuard resource="textos">
            <CongressoManager />
          </PermissionGuard>
        ) : null;
      
      case 'contador':
        return (hasPermission('contador') || isAdmin) ? (
          <PermissionGuard resource="contador">
            <EventConfigManager />
          </PermissionGuard>
        ) : null;
      
      case 'eventos':
        return (hasPermission('eventos') || isAdminRoot()) ? (
          <PermissionGuard resource="eventos">
            <EventsManager />
          </PermissionGuard>
        ) : null;
      
      case 'copyright':
        return (hasPermission('copyright') || isAdminRoot()) ? (
          <PermissionGuard resource="copyright">
            <CopyrightManager />
          </PermissionGuard>
        ) : null;
      
      case 'programacao':
        console.log('Rendering ScheduleManager for programacao tab');
        return (hasPermission('cronograma') || isAdminRoot()) ? (
          <PermissionGuard resource="cronograma">
            <ScheduleManager />
          </PermissionGuard>
        ) : null;
      
      case 'civeni-programacao':
        return (hasPermission('cronograma') || isAdminRoot()) ? (
          <PermissionGuard resource="cronograma">
            <CiveniProgramManager />
          </PermissionGuard>
        ) : null;
      
      case 'civeni-online-programacao':
        return (hasPermission('cronograma') || isAdminRoot()) ? (
          <PermissionGuard resource="cronograma">
            <CiveniOnlineProgramManager />
          </PermissionGuard>
        ) : null;
      
      case 'inscricoes':
        return (hasPermission('inscricoes') || isAdminRoot()) ? (
          <PermissionGuard resource="inscricoes">
            <RegistrationManager />
          </PermissionGuard>
        ) : null;
      
      case 'local':
        return (hasPermission('local') || isAdminRoot()) ? (
          <PermissionGuard resource="local">
            <VenueConfigManager />
          </PermissionGuard>
        ) : null;
      
      case 'online':
        return (hasPermission('online') || isAdminRoot()) ? (
          <PermissionGuard resource="online">
            <OnlineConfigManager />
          </PermissionGuard>
        ) : null;
      
      case 'palestrantes':
        return (hasPermission('palestrantes') || isAdmin) ? (
          <PermissionGuard resource="palestrantes">
            <SpeakersManager />
          </PermissionGuard>
        ) : null;
      
      case 'parceiros':
        return (hasPermission('parceiros') || isAdminRoot()) ? (
          <PermissionGuard resource="parceiros">
            <PartnersManager />
          </PermissionGuard>
        ) : null;
      
      case 'textos':
        return (hasPermission('textos') || isAdminRoot()) ? (
          <PermissionGuard resource="textos">
            <SiteTextsManager />
          </PermissionGuard>
        ) : null;
      
      case 'usuarios':
        return canViewUsuarios ? <UsersManager /> : null;
      
      
      case 'submissao-trabalhos':
        return (hasPermission('palestrantes') || isAdminRoot()) ? (
          <PermissionGuard resource="palestrantes">
            <WorkSubmissionsManager />
          </PermissionGuard>
        ) : null;
      
      case 'transmissao-live':
        return (hasPermission('transmissao') || isAdminRoot()) ? (
          <PermissionGuard resource="transmissao">
            <div className="space-y-8">
              <TransmissionStreamsManager />
              <TransmissionScheduleManager />
              <TransmissionFAQManager />
            </div>
          </PermissionGuard>
        ) : null;
      
      case 'trabalhos':
        return (hasPermission('palestrantes') || isAdminRoot()) ? (
          <PermissionGuard resource="palestrantes">
            <WorksManager />
          </PermissionGuard>
        ) : null;
      
      case 'sincronizacao':
        return (hasPermission('admin') || isAdminRoot()) ? (
          <SyncManager />
        ) : null;
      
      case 'submissoes':
        return (hasPermission('submissoes') || isAdmin) ? (
          <PermissionGuard resource="submissoes">
            <SubmissionsManager />
          </PermissionGuard>
        ) : null;
      
      default:
        return canViewFinanceiro ? <DashboardOverview /> : <MidiaDigitalManager />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-100 flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 space-y-6 p-6">
            <UserInfo />
            <div className="space-y-6">
              {renderTabContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardContent;
