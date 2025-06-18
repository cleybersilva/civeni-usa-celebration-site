
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
    // Financeiro sempre primeiro para Admin Root e Admin
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: BarChart3,
      show: canViewFinanceiro,
      order: 0
    },
    // Demais itens em ordem alfabética
    {
      id: 'banner',
      label: 'Banner',
      icon: Image,
      show: hasPermission('banner') || isAdminRoot(),
      order: 1
    },
    {
      id: 'contador',
      label: 'Contador',
      icon: Timer,
      show: hasPermission('contador') || isAdminRoot(),
      order: 2
    },
    {
      id: 'copyright',
      label: 'Copyright',
      icon: Copyright,
      show: hasPermission('copyright') || isAdminRoot(),
      order: 3
    },
    {
      id: 'cronograma',
      label: 'Cronograma',
      icon: Calendar,
      show: hasPermission('cronograma') || isAdminRoot(),
      order: 4
    },
    {
      id: 'inscricoes',
      label: 'Inscrições',
      icon: UserPlus,
      show: hasPermission('inscricoes') || isAdminRoot(),
      order: 5
    },
    {
      id: 'local',
      label: 'Local',
      icon: MapPin,
      show: hasPermission('local') || isAdminRoot(),
      order: 6
    },
    {
      id: 'online',
      label: 'Online',
      icon: Monitor,
      show: hasPermission('online') || isAdminRoot(),
      order: 7
    },
    {
      id: 'palestrantes',
      label: 'Palestrantes',
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      order: 8
    },
    {
      id: 'parceiros',
      label: 'Parceiros',
      icon: Handshake,
      show: hasPermission('parceiros') || isAdminRoot(),
      order: 9
    },
    {
      id: 'textos',
      label: 'Textos',
      icon: Type,
      show: hasPermission('textos') || isAdminRoot(),
      order: 10
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: Settings,
      show: canViewUsuarios,
      order: 11
    },
    {
      id: 'videos',
      label: 'Vídeos',
      icon: Play,
      show: hasPermission('videos') || isAdminRoot(),
      order: 12
    }
  ];

  const visibleItems = menuItems
    .filter(item => item.show)
    .sort((a, b) => a.order - b.order);

  // Comunicar mudança de aba para o componente pai
  React.useEffect(() => {
    // Dispatch custom event para comunicar mudança de aba
    window.dispatchEvent(new CustomEvent('adminTabChange', { 
      detail: { activeTab } 
    }));
  }, [activeTab]);

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
