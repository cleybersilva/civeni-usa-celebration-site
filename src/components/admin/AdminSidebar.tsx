
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
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
  const { state } = useSidebar();
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
    <Sidebar className="border-r bg-white shadow-sm">
      <SidebarHeader className="border-b px-4 py-4 bg-gradient-to-r from-civeni-blue to-civeni-blue/90">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              Admin Panel
            </h2>
            <p className="text-xs text-white/80">
              VCCU/Civeni USA
            </p>
          </div>
          <SidebarTrigger className="h-8 w-8 text-white hover:bg-white/20 transition-colors duration-200 rounded-md flex items-center justify-center">
            <div className="relative w-5 h-5 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? 'rotate-45 translate-y-0.5' : 'mb-1'}`}></span>
              <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? 'opacity-0' : 'mb-1'}`}></span>
              <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? '-rotate-45 -translate-y-0.5' : ''}`}></span>
            </div>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4 flex-1">
        <SidebarMenu className="space-y-1">
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-civeni-blue/10 hover:text-civeni-blue data-[active=true]:bg-civeni-blue data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg group"
              >
                <item.icon className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-all duration-200">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 bg-gray-50/50">
        <div className="flex justify-center items-center">
          <img 
            src="/lovable-uploads/02742229-722b-483d-b3fa-def871f44852.png" 
            alt="Civeni 2025" 
            className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
