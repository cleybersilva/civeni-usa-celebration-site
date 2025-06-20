
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: string;
  speaker_name?: string;
  location?: string;
  description?: string;
  date: string;
  platform?: string;
  virtual_link?: string;
}

export const formatTime = (time: string) => {
  return time.substring(0, 5);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

export const downloadSchedule = (schedules: Schedule[] | undefined, type: string) => {
  if (!schedules || schedules.length === 0) {
    alert('Nenhum cronograma disponível para download');
    return;
  }

  let csvContent = '';
  let filename = `cronograma_${type}_${new Date().toISOString().split('T')[0]}.csv`;
  
  if (type === 'online') {
    csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Horário,Título,Categoria,Palestrante,Plataforma,Link,Descrição\n";
    
    const scheduleData = schedules.map(schedule => ({
      data: formatDate(schedule.date),
      horario: `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`,
      titulo: schedule.title,
      categoria: schedule.category,
      palestrante: schedule.speaker_name || '',
      plataforma: schedule.platform || '',
      link: schedule.virtual_link || '',
      descricao: schedule.description || ''
    }));

    csvContent += scheduleData.map(row => 
      `"${row.data}","${row.horario}","${row.titulo}","${row.categoria}","${row.palestrante}","${row.plataforma}","${row.link}","${row.descricao}"`
    ).join("\n");
  } else {
    csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Horário,Título,Categoria,Palestrante,Local,Descrição\n";
    
    const scheduleData = schedules.map(schedule => ({
      data: formatDate(schedule.date),
      horario: `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`,
      titulo: schedule.title,
      categoria: schedule.category,
      palestrante: schedule.speaker_name || '',
      local: schedule.location || '',
      descricao: schedule.description || ''
    }));

    csvContent += scheduleData.map(row => 
      `"${row.data}","${row.horario}","${row.titulo}","${row.categoria}","${row.palestrante}","${row.local}","${row.descricao}"`
    ).join("\n");
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
