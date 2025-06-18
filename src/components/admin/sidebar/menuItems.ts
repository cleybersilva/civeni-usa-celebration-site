
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
import { MenuItem } from './types';

export const createMenuItems = (
  hasPermission: (resource: string) => boolean,
  isAdminRoot: () => boolean,
  canViewFinanceiro: boolean,
  canViewUsuarios: boolean
): MenuItem[] => {
  return [
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
};
