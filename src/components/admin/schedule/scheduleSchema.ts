
import { z } from 'zod';

export const scheduleSchema = z.object({
  type: z.enum(['presencial', 'online']),
  date: z.string().min(1, 'Data é obrigatória'),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  end_time: z.string().min(1, 'Horário de fim é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  speaker_name: z.string().optional(),
  speaker_photo_url: z.string().optional(),
  category: z.enum(['palestra', 'workshop', 'painel', 'intervalo', 'credenciamento']),
  location: z.string().optional(),
  virtual_link: z.string().optional(),
  platform: z.string().optional(),
  is_recorded: z.boolean().default(false),
  recording_url: z.string().optional(),
  is_published: z.boolean().default(false),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;
