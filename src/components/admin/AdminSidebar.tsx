
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  Image,
  Timer,
  Copyright,
  Calendar,
  UserPlus,
  MapPin,
  Monitor,
  Users,
  Handshake,
  Type,
  Play,
  Settings,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
import PermissionGuard from '@/components/admin/PermissionGuard';

const AdminSidebar = () => {
  const { hasPermission, isAdminRoot, user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.user_type === 'editor') {
      return 'contador';
    }
    const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';
    return canViewFinanceiro ? 'financeiro' : 'banner';
  });

  // Verificar permissões
  const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';
  const canViewUsuarios = isAdminRoot() || user?.user_type === 'admin';

  const menuItems = [
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: BarChart3,
      show: canViewFinanceiro,
      component: <DashboardOverview />
    },
    {
      id: 'banner',
      label: 'Banner',
      icon: Image,
      show: hasPermission('banner') || isAdminRoot(),
      component: (
        <PermissionGuard resource="banner">
          <BannerManager />
        </PermissionGuard>
      )
    },
    {
      id: 'contador',
      label: 'Contador',
      icon: Timer,
      show: hasPermission('contador') || isAdminRoot(),
      component: (
        <PermissionGuard resource="contador">
          <EventConfigManager />
        </PermissionGuard>
      )
    },
    {
      id: 'copyright',
      label: 'Copyright',
      icon: Copyright,
      show: hasPermission('copyright') || isAdminRoot(),
      component: (
        <PermissionGuard resource="copyright">
          <CopyrightManager />
        </PermissionGuard>
      )
    },
    {
      id: 'cronograma',
      label: 'Cronograma',
      icon: Calendar,
      show: hasPermission('cronograma') || isAdminRoot(),
      component: (
        <PermissionGuard resource="cronograma">
          <ScheduleManager />
        </PermissionGuard>
      )
    },
    {
      id: 'inscricoes',
      label: 'Inscrições',
      icon: UserPlus,
      show: hasPermission('inscricoes') || isAdminRoot(),
      component: (
        <PermissionGuard resource="inscricoes">
          <RegistrationManager />
        </PermissionGuard>
      )
    },
    {
      id: 'local',
      label: 'Local',
      icon: MapPin,
      show: hasPermission('local') || isAdminRoot(),
      component: (
        <PermissionGuard resource="local">
          <VenueConfigManager />
        </PermissionGuard>
      )
    },
    {
      id: 'online',
      label: 'Online',
      icon: Monitor,
      show: hasPermission('online') || isAdminRoot(),
      component: (
        <PermissionGuard resource="online">
          <OnlineConfigManager />
        </PermissionGuard>
      )
    },
    {
      id: 'palestrantes',
      label: 'Palestrantes',
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      component: (
        <PermissionGuard resource="palestrantes">
          <SpeakersManager />
        </PermissionGuard>
      )
    },
    {
      id: 'parceiros',
      label: 'Parceiros',
      icon: Handshake,
      show: hasPermission('parceiros') || isAdminRoot(),
      component: (
        <PermissionGuard resource="parceiros">
          <PartnersManager />
        </PermissionGuard>
      )
    },
    {
      id: 'textos',
      label: 'Textos',
      icon: Type,
      show: hasPermission('textos') || isAdminRoot(),
      component: (
        <PermissionGuard resource="textos">
          <SiteTextsManager />
        </PermissionGuard>
      )
    },
    {
      id: 'videos',
      label: 'Vídeos',
      icon: Play,
      show: hasPermission('videos') || isAdminRoot(),
      component: (
        <PermissionGuard resource="videos">
          <VideosManager />
        </PermissionGuard>
      )
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: Settings,
      show: canViewUsuarios,
      component: <UsersManager />
    }
  ];

  const visibleItems = menuItems.filter(item => item.show);
  const activeItem = visibleItems.find(item => item.id === activeTab);

  // Renderizar o conteúdo da aba ativa
  React.useEffect(() => {
    const contentElement = document.getElementById('admin-content');
    if (contentElement && activeItem) {
      const root = document.createElement('div');
      contentElement.innerHTML = '';
      contentElement.appendChild(root);
      
      import('react-dom/client').then(({ createRoot }) => {
        const reactRoot = createRoot(root);
        reactRoot.render(activeItem.component);
      });
    }
  }, [activeTab, activeItem]);

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-civeni-blue">
              Admin Panel
            </h2>
            <p className="text-xs text-muted-foreground">
              VCCU/Civeni USA
            </p>
          </div>
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-1">
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-civeni-blue/10 data-[active=true]:bg-civeni-blue data-[active=true]:text-white"
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
