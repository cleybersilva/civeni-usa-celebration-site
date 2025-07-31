
import {
  BarChart3,
  Image,
  Timer,
  Calendar,
  UserPlus,
  MapPin,
  Monitor,
  Users,
  Handshake,
  Type,
  Play,
  Settings,
  FileText,
} from 'lucide-react';
import { MenuItem } from './types';

export const createMenuItems = (
  hasPermission: (resource: string) => boolean,
  isAdminRoot: () => boolean,
  canViewFinanceiro: boolean,
  canViewUsuarios: boolean,
  t: (key: string, fallback: string) => string
): MenuItem[] => {
  return [
    // Financeiro sempre primeiro para Admin Root e Admin
    {
      id: 'financeiro',
      label: t('admin.menu.financial', 'Financeiro'),
      icon: BarChart3,
      show: canViewFinanceiro,
      order: 0
    },
    // Demais itens em ordem alfabética
    {
      id: 'banner',
      label: t('admin.menu.banner', 'Banner'),
      icon: Image,
      show: hasPermission('banner') || isAdminRoot(),
      order: 1
    },
    {
      id: 'contador',
      label: t('admin.menu.counter', 'Contador'),
      icon: Timer,
      show: hasPermission('contador') || isAdminRoot(),
      order: 2
    },
    {
      id: 'cronograma',
      label: t('admin.menu.schedule', 'Cronograma'),
      icon: Calendar,
      show: hasPermission('cronograma') || isAdminRoot(),
      order: 3
    },
    {
      id: 'inscricoes',
      label: t('admin.menu.registrations', 'Inscrições'),
      icon: UserPlus,
      show: hasPermission('inscricoes') || isAdminRoot(),
      order: 4
    },
    {
      id: 'local',
      label: t('admin.menu.venue', 'Local'),
      icon: MapPin,
      show: hasPermission('local') || isAdminRoot(),
      order: 5
    },
    {
      id: 'online',
      label: t('admin.menu.online', 'Online'),
      icon: Monitor,
      show: hasPermission('online') || isAdminRoot(),
      order: 6
    },
    {
      id: 'palestrantes',
      label: t('admin.menu.speakers', 'Palestrantes'),
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      order: 7
    },
    {
      id: 'parceiros',
      label: t('admin.menu.partners', 'Parceiros'),
      icon: Handshake,
      show: hasPermission('parceiros') || isAdminRoot(),
      order: 8
    },
    {
      id: 'textos',
      label: t('admin.menu.texts', 'Textos'),
      icon: Type,
      show: hasPermission('textos') || isAdminRoot(),
      order: 9
    },
    {
      id: 'usuarios',
      label: t('admin.menu.users', 'Usuários'),
      icon: Settings,
      show: canViewUsuarios,
      order: 10
    },
    {
      id: 'videos',
      label: t('admin.menu.videos', 'Vídeos'),
      icon: Play,
      show: hasPermission('videos') || isAdminRoot(),
      order: 11
    },
    {
      id: 'civeni-2024-images',
      label: 'II CIVENI 2024 - Imagens',
      icon: Image,
      show: hasPermission('palestrantes') || isAdminRoot(),
      order: 11.5
    },
    {
      id: 'submissao-trabalhos',
      label: t('admin.menu.workSubmissions', 'Submissão de Trabalhos'),
      icon: FileText,
      show: hasPermission('palestrantes') || isAdminRoot(),
      order: 11.6
    },
    {
      id: 'transmissao-live',
      label: t('admin.menu.liveStream', 'Transmissão Ao Vivo'),
      icon: Play,
      show: hasPermission('transmissao') || isAdminRoot(),
      order: 11.7
    },
    {
      id: 'trabalhos',
      label: t('admin.menu.works', 'Trabalhos'),
      icon: FileText,
      show: hasPermission('palestrantes') || isAdminRoot(),
      order: 11.8
    },
    {
      id: 'sincronizacao',
      label: t('admin.menu.sync', 'Sincronização'),
      icon: Settings,
      show: hasPermission('admin') || isAdminRoot(),
      order: 12
    }
  ];
};
