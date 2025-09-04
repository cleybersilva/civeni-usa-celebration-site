import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export interface ThematicArea {
  id: string;
  name_pt: string;
  name_en?: string;
  name_es?: string;
  name_tr?: string;
  description_pt: string;
  description_en?: string; 
  description_es?: string;
  description_tr?: string;
  icon_name: string;
  color_class?: string;
  order_index: number;
  is_active: boolean;
}

export const useThematicAreas = () => {
  const { i18n } = useTranslation();
  
  const { data: thematicAreas, isLoading, error } = useQuery({
    queryKey: ['thematic-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thematic_areas')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) {
        console.error('Error fetching thematic areas:', error);
        throw error;
      }
      
      return data as ThematicArea[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get localized name and description based on current language
  const getLocalizedContent = (area: ThematicArea) => {
    const locale = i18n.language;
    
    let name = area.name_pt; // Default to Portuguese
    let description = area.description_pt;
    
    switch (locale) {
      case 'en':
        name = area.name_en || area.name_pt;
        description = area.description_en || area.description_pt;
        break;
      case 'es':
        name = area.name_es || area.name_pt;
        description = area.description_es || area.description_pt;
        break;
      case 'tr':
        name = area.name_tr || area.name_pt;
        description = area.description_tr || area.description_pt;
        break;
    }
    
    return { name, description };
  };

  return {
    thematicAreas,
    isLoading,
    error,
    getLocalizedContent
  };
};