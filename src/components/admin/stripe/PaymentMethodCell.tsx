import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentMethodCellProps {
  participantName: string;
  expectedAmount: number;
  cardBrand?: string;
  last4?: string;
  paymentStatus: string;
}

const SUPABASE_URL = "https://wdkeqxfglmritghmakma.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka2VxeGZnbG1yaXRnaG1ha21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc0ODksImV4cCI6MjA2NTgyMzQ4OX0.h-HiLfyMh2EaYWQro1TvCVROwHnOJDyynsUIptmhKuo";

export const PaymentMethodCell: React.FC<PaymentMethodCellProps> = ({
  participantName,
  expectedAmount,
  cardBrand,
  last4,
  paymentStatus,
}) => {
  const [resolvedMethod, setResolvedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se já tem card_brand, não precisa resolver
    if (cardBrand) {
      return;
    }

    // Se não está pago, não precisa resolver
    if (paymentStatus !== 'completed') {
      setResolvedMethod('Não definida');
      return;
    }

    const resolveMethod = async () => {
      setLoading(true);
      try {
        const expectedCents = Math.round(expectedAmount * 100);
        const url = `${SUPABASE_URL}/functions/v1/resolve-payment-method?name=${encodeURIComponent(participantName)}&amount=${expectedCents}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to resolve payment method');
        }

        const result = await response.json();
        
        if (result.methodLabel && result.methodLabel !== '—') {
          setResolvedMethod(result.methodLabel);
        } else {
          setResolvedMethod('Voucher/Gratuito');
        }
      } catch (err) {
        console.error('Error resolving payment method:', err);
        setResolvedMethod('Voucher/Gratuito');
      } finally {
        setLoading(false);
      }
    };

    resolveMethod();
  }, [participantName, expectedAmount, cardBrand, paymentStatus]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Verificando...</span>
      </div>
    );
  }

  if (cardBrand) {
    return (
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        <span className="font-medium capitalize">Cartão ({cardBrand})</span>
        {last4 && <span className="text-muted-foreground">•••• {last4}</span>}
      </div>
    );
  }

  return (
    <span className="text-muted-foreground">
      {resolvedMethod || (paymentStatus === 'completed' ? 'Voucher/Gratuito' : 'Não definida')}
    </span>
  );
};

