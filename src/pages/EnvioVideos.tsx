import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Video, CheckCircle, BookOpen, Users } from 'lucide-react';
import { useCursos, useTurmas } from '@/hooks/useCursos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const EnvioVideos = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursoId, setCursoId] = useState<string>('');
  const [emailWarning, setEmailWarning] = useState<string>('');
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

  const { cursos } = useCursos();
  const { turmas } = useTurmas(cursoId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailBlur = async () => {
    if (formData.email) {
      const { data, error } = await supabase
        .from('registrations')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (!data && !error) {
        setEmailWarning('⚠️ Este e-mail não está cadastrado no sistema de inscrições do CIVENI.');
      } else {
        setEmailWarning('');
      }
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, tipo_participante: value }));
  };

  const handleCursoChange = (value: string) => {
    setCursoId(value);
    const cursoSelecionado = cursos.find(c => c.id === value);
    setFormData(prev => ({ 
      ...prev, 
      curso: cursoSelecionado?.nome_curso || '',
      turma: '' // Limpa turma ao mudar curso
    }));
  };

  const handleTurmaChange = (value: string) => {
    const turmaSelecionada = turmas.find(t => t.id === value);
    setFormData(prev => ({ 
      ...prev, 
      turma: turmaSelecionada?.nome_turma || ''
    }));
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

    // Validação adicional para alunos VCCU
    if (formData.tipo_participante === 'Aluno(a) VCCU') {
      if (!formData.curso || !formData.turma) {
        toast.error('Curso e Turma são obrigatórios para alunos VCCU.');
        return;
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/area-tematica" className="hover:text-blue-200 transition-colors">Trabalhos</Link></li>
              <li className="text-blue-200">›</li>
              <li>Envio de Vídeos</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Video className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-bold font-poppins">
                Envio de Vídeos
              </h1>
              <Video className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
            </div>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Envie seu material em vídeo para análise pela banca avaliadora do III CIVENI 2025
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/area-tematica">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Ver Áreas Temáticas
                </button>
              </Link>
              
              <Link to="/inscricoes">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
            </div>
          </div>
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
                  placeholder="Nome completo conforme inscrição no Civeni"
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
                  onBlur={handleEmailBlur}
                  placeholder="email_inscricao_civeni@email.com"
                />
                {emailWarning && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    {emailWarning}
                  </p>
                )}
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
                      <Label htmlFor="curso">Curso *</Label>
                      <Select 
                        required 
                        value={cursoId} 
                        onValueChange={handleCursoChange}
                      >
                        <SelectTrigger id="curso">
                          <SelectValue placeholder="Selecione o curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome_curso}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="turma">Turma *</Label>
                      <Select 
                        required 
                        value={formData.turma} 
                        onValueChange={handleTurmaChange}
                        disabled={!cursoId}
                      >
                        <SelectTrigger id="turma">
                          <SelectValue placeholder={cursoId ? "Selecione a turma" : "Selecione o curso primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome_turma}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
    </div>
  );
};

export default EnvioVideos;