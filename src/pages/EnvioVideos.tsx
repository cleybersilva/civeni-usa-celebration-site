import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Video, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const EnvioVideos = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo_participante: '',
    curso: '',
    turma: '',
    video_url: '',
    observacoes: '',
    concordo: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, tipo_participante: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, concordo: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.concordo) {
      toast.error('Você precisa concordar com os termos de uso para prosseguir.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-video', {
        body: {
          nome: formData.nome,
          email: formData.email,
          tipo_participante: formData.tipo_participante,
          curso: formData.curso || undefined,
          turma: formData.turma || undefined,
          video_url: formData.video_url,
          observacoes: formData.observacoes || undefined
        }
      });

      if (error) {
        console.error('Erro ao enviar vídeo:', error);
        toast.error(error.message || 'Falha ao enviar o vídeo. Tente novamente.');
        return;
      }

      toast.success('Vídeo enviado com sucesso! Seu material será analisado pela banca.');
      
      // Resetar formulário
      setFormData({
        nome: '',
        email: '',
        tipo_participante: '',
        curso: '',
        turma: '',
        video_url: '',
        observacoes: '',
        concordo: false
      });

    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar o vídeo. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mostrarCursoTurma = formData.tipo_participante === 'Aluno(a) VCCU';

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative z-10 text-center px-4 py-16">
          <Video className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Envio de Vídeos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Envie seu material em vídeo para análise pela banca avaliadora do III CIVENI 2025
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container max-w-3xl px-4">
          <div className="bg-card border rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome Completo */}
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* E-mail */}
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu@email.com"
                />
              </div>

              {/* Tipo de Participante, Curso e Turma em 3 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tipo_participante">Tipo de Participante *</Label>
                  <Select 
                    required 
                    value={formData.tipo_participante} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger id="tipo_participante">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluno(a) VCCU">Aluno(a) VCCU</SelectItem>
                      <SelectItem value="Participante Externo">Participante Externo</SelectItem>
                      <SelectItem value="Convidado(a)">Convidado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mostrarCursoTurma && (
                  <>
                    <div>
                      <Label htmlFor="curso">Curso</Label>
                      <Input
                        id="curso"
                        name="curso"
                        type="text"
                        value={formData.curso}
                        onChange={handleInputChange}
                        placeholder="Ex: Engenharia de Software"
                      />
                    </div>

                    <div>
                      <Label htmlFor="turma">Turma</Label>
                      <Input
                        id="turma"
                        name="turma"
                        type="text"
                        value={formData.turma}
                        onChange={handleInputChange}
                        placeholder="Ex: 2025.1"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Link do Vídeo */}
              <div>
                <Label htmlFor="video_url">Link do Vídeo *</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/... ou https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aceito: YouTube, Vimeo, Google Drive, OneDrive ou outros serviços com HTTPS
                </p>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Informações adicionais sobre seu vídeo (opcional)"
                  rows={4}
                />
              </div>

              {/* Concordância */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="concordo"
                  checked={formData.concordo}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label 
                  htmlFor="concordo" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Concordo em compartilhar este material para análise pela banca avaliadora do III CIVENI 2025 *
                </Label>
              </div>

              {/* Botão Submit */}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Enviar Vídeo
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default EnvioVideos;