import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PresentationRoom {
  id: string;
  nome_sala: string;
  descricao_sala: string | null;
  meet_link: string;
  data_apresentacao: string;
  horario_inicio_sala: string;
  horario_fim_sala: string;
  status: 'rascunho' | 'publicado' | 'inativo';
  responsavel_sala: string | null;
  created_at: string;
  updated_at: string;
  ordem_sala?: number | null;
}

export interface PresentationAssignment {
  id: string;
  room_id: string;
  submission_id: string;
  ordem_apresentacao: number;
  inicio_apresentacao: string;
  fim_apresentacao: string;
  observacoes: string | null;
  submission?: {
    autor_principal: string;
    email: string;
    titulo: string;
    tipo: string;
  };
}

export interface PresentationRoomWork {
  id: string;
  sala_id: string;
  titulo_apresentacao: string;
  autores: string;
  ordem: number | null;
}

export interface RoomWithAssignments extends PresentationRoom {
  assignments: PresentationAssignment[];
  fallbackWorks?: PresentationRoomWork[];
}

export const usePresentationRooms = (publicOnly = false) => {
  return useQuery({
    queryKey: ['presentation-rooms', publicOnly],
    queryFn: async () => {
      let query = supabase
        .from('presentation_rooms')
        .select('*')
        .order('data_apresentacao', { ascending: true })
        .order('horario_inicio_sala', { ascending: true })
        .order('ordem_sala', { ascending: true });

      if (publicOnly) {
        query = query.eq('status', 'publicado');
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as PresentationRoom[]) || [];
    },
    refetchInterval: publicOnly ? 60000 : false, // 1min for public
  });
};

export const usePresentationRoomDetails = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['presentation-room-details', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data: room, error: roomError } = await supabase
        .from('presentation_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('presentation_room_assignments')
        .select(`
          *,
          submission:submissions (
            autor_principal,
            email,
            titulo,
            tipo
          )
        `)
        .eq('room_id', roomId)
        .order('ordem_apresentacao', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      return {
        ...room,
        assignments: assignments || [],
      } as RoomWithAssignments;
    },
    enabled: !!roomId,
  });
};

export const usePublicPresentationRoomsWithAssignments = () => {
  return useQuery({
    queryKey: ['public-presentation-rooms-with-assignments'],
    queryFn: async () => {
      const { data: rooms, error: roomsError } = await supabase
        .from('presentation_rooms')
        .select('*')
        .eq('status', 'publicado')
        .order('data_apresentacao', { ascending: true })
        .order('horario_inicio_sala', { ascending: true });

      if (roomsError) throw roomsError;

      const roomIds = (rooms || []).map((room) => room.id);

      let worksByRoom: Record<string, PresentationRoomWork[]> = {};

      if (roomIds.length > 0) {
        const { data: works, error: worksError } = await supabase
          .from('salas_apresentacao_trabalhos')
          .select('*')
          .in('sala_id', roomIds);

        if (worksError) throw worksError;

        worksByRoom = (works || []).reduce((acc, work) => {
          const key = work.sala_id as string;
          const existing = acc[key] || [];
          acc[key] = [...existing, work as PresentationRoomWork];
          return acc;
        }, {} as Record<string, PresentationRoomWork[]>);

        Object.keys(worksByRoom).forEach((key) => {
          worksByRoom[key] = worksByRoom[key].slice().sort((a, b) => {
            if (a.ordem == null && b.ordem == null) return 0;
            if (a.ordem == null) return 1;
            if (b.ordem == null) return -1;
            return a.ordem - b.ordem;
          });
        });
      }

      const roomsWithAssignments = await Promise.all(
        (rooms || []).map(async (room) => {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('presentation_room_assignments')
            .select(`
              *,
              submission:submissions (
                autor_principal,
                email,
                titulo,
                tipo
              )
            `)
            .eq('room_id', room.id)
            .order('inicio_apresentacao', { ascending: true })
            .order('ordem_apresentacao', { ascending: true });

          if (assignmentsError) throw assignmentsError;

          return {
            ...room,
            assignments: assignments || [],
            fallbackWorks: worksByRoom[room.id] || [],
          } as RoomWithAssignments;
        })
      );

      return roomsWithAssignments;
    },
    refetchInterval: 60000, // 1min
  });
};
