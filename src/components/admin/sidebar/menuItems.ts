
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
  CalendarDays,
} from 'lucide-react';
import { MenuItem } from './types';

export const createMenuItems = (
  hasPermission: (resource: string) => boolean,
  isAdminRoot: () => boolean,
  canViewFinanceiro: boolean,
  canViewUsuarios: boolean,
  t: (key: string, fallback: string) => string
): MenuItem[] => {
  const items = [
    // Financeiro sempre primeiro para Admin Root e Admin
    {
      id: 'financeiro',
      label: t('admin.menu.financial', 'Financeiro'),
      icon: BarChart3,
      show: canViewFinanceiro,
      isPriority: true
    },
    // Demais itens serão ordenados alfabeticamente
    {
      id: 'areas-tematicas',
      label: t('admin.menu.thematicAreas', 'Áreas Temáticas'),
      icon: FileText,
      show: hasPermission('textos') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'contador',
      label: t('admin.menu.counter', 'Contador'),
      icon: Timer,
      show: hasPermission('contador') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'eventos',
      label: t('admin.menu.events', 'Eventos'),
      icon: CalendarDays,
      show: hasPermission('eventos') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'programacao',
      label: t('admin.menu.schedule', 'Programação'),
      icon: Calendar,
      show: hasPermission('cronograma') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'civeni-programacao',
      label: 'CIVENI Presencial',
      icon: CalendarDays,
      show: hasPermission('cronograma') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'civeni-online-programacao',
      label: 'CIVENI Online',
      icon: Monitor,
      show: hasPermission('cronograma') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'inscricoes',
      label: t('admin.menu.registrations', 'Inscrições'),
      icon: UserPlus,
      show: hasPermission('inscricoes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'local',
      label: t('admin.menu.venue', 'Local'),
      icon: MapPin,
      show: hasPermission('local') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'midia-digital',
      label: t('admin.menu.digitalMedia', 'Mídia Digital'),
      icon: Image,
      show: hasPermission('banner') || hasPermission('videos') || hasPermission('palestrantes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'online',
      label: t('admin.menu.online', 'Online'),
      icon: Monitor,
      show: hasPermission('online') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'palestrantes',
      label: t('admin.menu.speakers', 'Palestrantes'),
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'parceiros',
      label: t('admin.menu.partners', 'Parceiros'),
      icon: Handshake,
      show: hasPermission('parceiros') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'sincronizacao',
      label: t('admin.menu.sync', 'Sincronização'),
      icon: Settings,
      show: hasPermission('admin') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'textos',
      label: t('admin.menu.texts', 'Textos'),
      icon: Type,
      show: hasPermission('textos') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'trabalhos',
      label: t('admin.menu.works', 'Trabalhos'),
      icon: FileText,
      show: hasPermission('palestrantes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'transmissao-live',
      label: t('admin.menu.liveStream', 'Transmissão Ao Vivo'),
      icon: Play,
      show: hasPermission('transmissao') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'avaliadores',
      label: t('admin.menu.evaluators', 'Avaliadores'),
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'comite',
      label: t('admin.menu.committee', 'Comissão Organizadora'),
      icon: Users,
      show: hasPermission('palestrantes') || isAdminRoot(),
      isPriority: false
    },
    {
      id: 'usuarios',
      label: t('admin.menu.users', 'Usuários'),
      icon: Settings,
      show: canViewUsuarios,
      isPriority: false
    }
  ];

  // Filtrar items visíveis e ordenar alfabeticamente (exceto itens prioritários)
  const visibleItems = items.filter(item => item.show);
  const priorityItems = visibleItems.filter(item => item.isPriority);
  const regularItems = visibleItems
    .filter(item => !item.isPriority)
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  // Combinar itens prioritários primeiro, depois os ordenados alfabeticamente
  return [...priorityItems, ...regularItems].map((item, index) => ({
    ...item,
    order: index
  }));
};
