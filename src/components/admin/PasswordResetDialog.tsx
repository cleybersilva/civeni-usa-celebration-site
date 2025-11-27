
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface PasswordResetDialogProps {
  children: React.ReactNode;
}

const PasswordResetDialog = ({ children }: PasswordResetDialogProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.rpc('request_password_reset', {
        user_email: email
      });

      if (error) throw error;

      if (data) {
        setMessage('Se o email existir em nosso sistema, você receberá instruções para recuperação de senha.');
      } else {
        setMessage('Se o email existir em nosso sistema, você receberá instruções para recuperação de senha.');
      }
      
      setTimeout(() => {
        setIsOpen(false);
        setEmail('');
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recuperar Senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              required
            />
          </div>
          {message && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
              {message}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Instruções'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;
