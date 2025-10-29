import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeSummary {
  bruto: number;
  taxas: number;
  liquido: number;
  pagos: number;
  naoPagos: number;
  falhas: number;
  reembolsos: number;
  disputas: number;
  ticketMedio: number;
  taxaConversao: string;
  proximoPayout: any;
}

interface StripeDashboardFilters {
  range?: string;
  customFrom?: Date;
  customTo?: Date;
  status?: string;
  lote?: string;
  cupom?: string;
  brand?: string;
  chargesOffset?: number;
  customersOffset?: number;
  chargesSearch?: string;
  customersSearch?: string;
}

export const useStripeDashboard = (filters: StripeDashboardFilters = {}) => {
  const [summary, setSummary] = useState<StripeSummary | null>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [byBrand, setByBrand] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [chargesPagination, setChargesPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [customersPagination, setCustomersPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Use custom dates if provided, otherwise calculate from range
      let from: string | undefined;
      let to: string | undefined;

      if (filters.customFrom && filters.customTo) {
        // Criar cópias das datas para não modificar as originais
        const fromDate = new Date(filters.customFrom.getTime());
        const toDate = new Date(filters.customTo.getTime());
        
        // Ajustar para início do dia (00:00:00) no fuso local
        fromDate.setHours(0, 0, 0, 0);
        
        // Ajustar para fim do dia (23:59:59.999) no fuso local
        toDate.setHours(23, 59, 59, 999);
        
        from = fromDate.toISOString();
        to = toDate.toISOString();
        
        console.log('📅 Filtro personalizado:', {
          fromLocal: fromDate.toLocaleString('pt-BR'),
          toLocal: toDate.toLocaleString('pt-BR'),
          fromISO: from,
          toISO: to
        });
      } else if (filters.range && filters.range !== 'custom') {
        const now = new Date();
        const days = parseInt(filters.range) || 30;
        const fromDate = new Date(now.getTime());
        
        // Retroceder N dias
        fromDate.setDate(fromDate.getDate() - days);
        
        // Ajustar para início do dia
        fromDate.setHours(0, 0, 0, 0);
        
        from = fromDate.toISOString();
        to = now.toISOString();
        
        console.log('📅 Filtro por período:', {
          days,
          fromLocal: fromDate.toLocaleString('pt-BR'),
          toLocal: now.toLocaleString('pt-BR'),
          fromISO: from,
          toISO: to
        });
      }

      console.log('🔄 Fetching Stripe dashboard data...', { from, to, filters });

      // Build query params for all requests
      const buildParams = (includeOffset?: 'charges' | 'customers', includeSearch?: 'charges' | 'customers') => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.lote) params.append('lote', filters.lote);
        if (filters.cupom) params.append('cupom', filters.cupom);
        if (filters.brand && filters.brand !== 'all') params.append('brand', filters.brand);
        
        // Add offset and search based on context
        if (includeOffset === 'charges') {
          params.append('offset', String(filters.chargesOffset || 0));
        }
        if (includeOffset === 'customers') {
          params.append('offset', String(filters.customersOffset || 0));
        }
        if (includeSearch === 'charges' && filters.chargesSearch) {
          params.append('search', filters.chargesSearch);
        }
        if (includeSearch === 'customers' && filters.customersSearch) {
          params.append('search', filters.customersSearch);
        }
        
        return params.toString();
      };

      const baseQueryString = buildParams();
      const baseRequestUrl = baseQueryString ? `?${baseQueryString}` : '';
      
      const chargesQueryString = buildParams('charges', 'charges');
      const chargesRequestUrl = chargesQueryString ? `?${chargesQueryString}` : '';
      
      const customersQueryString = buildParams('customers', 'customers');
      const customersRequestUrl = customersQueryString ? `?${customersQueryString}` : '';

      const [summaryRes, timeseriesRes, brandRes, funnelRes, chargesRes, customersRes] = await Promise.all([
        supabase.functions.invoke(`finance-summary${baseRequestUrl}`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => {
          console.log('📊 Summary response:', res);
          return res;
        }),
        supabase.functions.invoke(`finance-timeseries${baseRequestUrl}`, { 
          method: 'GET'
        }).then(res => {
          console.log('📈 Timeseries response:', res);
          return res;
        }),
        supabase.functions.invoke(`finance-by-brand${baseRequestUrl}`, { 
          method: 'GET'
        }).then(res => {
          console.log('💳 By-brand response:', res);
          return res;
        }),
        supabase.functions.invoke(`finance-funnel${baseRequestUrl}`, { 
          method: 'GET'
        }).then(res => {
          console.log('🔽 Funnel response:', res);
          return res;
        }),
        supabase.functions.invoke(`finance-charges${chargesRequestUrl}`, { 
          method: 'GET'
        }).then(res => {
          console.log('💰 Charges response:', res);
          return res;
        }),
        supabase.functions.invoke(`finance-customers${customersRequestUrl}`, {
          method: 'GET'
        }).then(res => {
          console.log('👥 Customers response:', res);
          return res;
        })
      ]);

      if (summaryRes.error) {
        console.error('Summary error:', summaryRes.error);
      } else if (summaryRes.data) {
        console.log('✅ Summary data:', summaryRes.data);
        setSummary(summaryRes.data);
      }

      if (timeseriesRes.data) setTimeseries(timeseriesRes.data.data || timeseriesRes.data || []);
      if (brandRes.data) setByBrand(brandRes.data.data || brandRes.data || []);
      if (funnelRes.data) setFunnel(funnelRes.data);
      if (chargesRes.data) {
        setCharges(chargesRes.data.data || chargesRes.data || []);
        if (chargesRes.data.pagination) {
          setChargesPagination(chargesRes.data.pagination);
        }
      }
      if (customersRes.data) {
        setCustomers(customersRes.data.data || customersRes.data || []);
        if (customersRes.data.pagination) {
          setCustomersPagination(customersRes.data.pagination);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
      toast({
        title: "Erro ao carregar dashboard",
        description: error.message || "Não foi possível carregar os dados financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('stripe_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stripe_charges' }, () => {
        console.log('💰 Stripe charge updated, refreshing...');
        setTimeout(fetchAll, 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { 
    summary, 
    timeseries, 
    byBrand, 
    funnel, 
    charges, 
    customers, 
    chargesPagination,
    customersPagination,
    loading, 
    refresh: fetchAll 
  };
};
