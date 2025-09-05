import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';

export interface CounterSettingsData {
  eventDate: string;
  eventTitlePt: string;
  eventTitleEn: string;
  eventTitleEs: string;
  eventTitleTr: string;
  eventDescriptionPt: string;
  eventDescriptionEn: string;
  eventDescriptionEs: string;
  eventDescriptionTr: string;
}

export const useCounterSettings = () => {
  const [settings, setSettings] = useState<CounterSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAdminAuth();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('counter_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          eventDate: data.event_date,
          eventTitlePt: data.event_title_pt || '',
          eventTitleEn: data.event_title_en || '',
          eventTitleEs: data.event_title_es || '',
          eventTitleTr: data.event_title_tr || '',
          eventDescriptionPt: data.event_description_pt || '',
          eventDescriptionEn: data.event_description_en || '',
          eventDescriptionEs: data.event_description_es || '',
          eventDescriptionTr: data.event_description_tr || ''
        });
      }
    } catch (error) {
      console.error('Error loading counter settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (data: CounterSettingsData) => {
    // Get session from localStorage
    const sessionRaw = localStorage.getItem('adminSession');
    if (!sessionRaw || !user?.email) {
      throw new Error('Session not available');
    }

    const session = JSON.parse(sessionRaw);
    if (!session?.session_token) {
      throw new Error('Session token not available');
    }

    try {
      setSaving(true);
      
      const { data: result, error } = await supabase.rpc('save_counter_settings', {
        p_event_date: data.eventDate,
        p_event_title_pt: data.eventTitlePt,
        p_event_title_en: data.eventTitleEn,
        p_event_title_es: data.eventTitleEs,
        p_event_title_tr: data.eventTitleTr,
        p_event_description_pt: data.eventDescriptionPt,
        p_event_description_en: data.eventDescriptionEn,
        p_event_description_es: data.eventDescriptionEs,
        p_event_description_tr: data.eventDescriptionTr,
        p_user_email: user.email,
        p_session_token: session.session_token
      });

      if (error) throw error;

      // Reload settings after successful save
      await loadSettings();
      
      return result;
    } catch (error) {
      console.error('Error saving counter settings:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Setup realtime subscription for immediate updates
  useEffect(() => {
    const channel = supabase
      .channel('counter_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'counter_settings' },
        () => {
          console.log('Counter settings changed, reloading...');
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    refreshSettings: loadSettings
  };
};