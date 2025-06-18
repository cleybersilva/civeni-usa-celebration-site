
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface ScheduleTableProps {
  schedules: any[];
  isLoading: boolean;
  type: 'presencial' | 'online';
  onEdit: (schedule: any) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  isLoading,
  type,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      palestra: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      painel: 'bg-purple-100 text-purple-800',
      intervalo: 'bg-gray-100 text-gray-800',
      credenciamento: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Horário</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>{type === 'presencial' ? 'Local' : 'Plataforma'}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules?.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>{new Date(schedule.date).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</TableCell>
            <TableCell className="font-medium">{schedule.title}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(schedule.category)}`}>
                {schedule.category}
              </span>
            </TableCell>
            <TableCell>{type === 'presencial' ? (schedule.location || '-') : (schedule.platform || '-')}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePublish(schedule.id, !schedule.is_published)}
                className={schedule.is_published ? 'text-green-600' : 'text-gray-400'}
              >
                {schedule.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(schedule)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(schedule.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ScheduleTable;
