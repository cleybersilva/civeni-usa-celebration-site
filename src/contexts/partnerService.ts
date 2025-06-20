
import { supabase } from '@/integrations/supabase/client';
import { Partner } from './types';

export const fetchPartners = async (): Promise<Partner[]> => {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Transform database data to match Partner interface
    return (data || []).map(partner => ({
      id: partner.id,
      name: partner.name,
      logo: partner.logo,
      type: partner.type as 'organizer' | 'academic' | 'sponsor',
      sort_order: partner.sort_order
    }));
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
};

export const updatePartnersInDatabase = async (partners: Partner[]): Promise<void> => {
  try {
    // First, delete all existing partners
    await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Then insert new partners
    if (partners.length > 0) {
      const { error } = await supabase
        .from('partners')
        .insert(partners.map(partner => ({
          name: partner.name,
          logo: partner.logo,
          type: partner.type,
          sort_order: partner.sort_order || 1
        })));

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating partners:', error);
    throw error;
  }
};
