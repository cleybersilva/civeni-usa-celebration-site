import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Users, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThematicAreas } from '@/hooks/useThematicAreas';

const SubmissaoTrabalhos = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('artigo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { thematicAreas, isLoading: isLoadingAreas, getLocalizedContent } = useThematicAreas();
  const [formData, setFormData] = useState({
    author_name: '',
    institution: '',
    email: '',
    work_title: '',
    abstract: '',
    keywords: '',
    thematic_area: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [validationStatus, setValidationStatus] = useState<{
    allowed: boolean;
    reason: string | null;
    remaining: number;
    checked: boolean;
  }>({ allowed: false, reason: null, remaining: 0, checked: false });

  // Reset validation when changing tabs
  useEffect(() => {
    setValidationStatus({ allowed: false, reason: null, remaining: 0, checked: false });
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset validation when email or author name changes
    if (name === 'email' || name === 'author_name') {
      setValidationStatus({ allowed: false, reason: null, remaining: 0, checked: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const maxSize = 50 * 1024 * 1024; // 50 MB
      
      // Verificar se é PDF
      if (selectedFile.type === 'application/pdf') {
        toast.error('Formato não permitido. Envie o arquivo somente em DOCX. PDFs não são aceitos para possibilitar correções pelos avaliadores.');
        e.target.value = '';
        return;
      }
      
      // Verificar se é DOCX
      if (selectedFile.type !== allowedType && !selectedFile.name.toLowerCase().endsWith('.docx')) {
        toast.error('Tipo de arquivo inválido. Envie um DOCX.');
        e.target.value = '';
        return;
      }
      
      // Verificar tamanho
      if (selectedFile.size > maxSize) {
        toast.error('Arquivo muito grande. O limite é 50 MB para DOCX.');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const validateRegistrationAndSubmission = async () => {
    if (!formData.email || !formData.author_name) {
      return;
    }

    setIsValidating(true);
    try {
      console.log('🔍 Validando limite de submissões via RPC...', { 
        email: formData.email.toLowerCase().trim(),
        nome: formData.author_name.trim(),
        tipo: activeTab
      });

      // Chamar função RPC para validar inscrição e limite
      const { data, error } = await supabase.rpc('can_submit_trabalho', {
        p_email: formData.email.toLowerCase().trim(),
        p_nome: formData.author_name.trim(),
        p_tipo: activeTab,
        p_evento: 'civeni-2025'
      } as any);

      if (error) {
        console.error('❌ Erro ao chamar RPC:', error);
        toast.error('Erro ao validar submissão. Tente novamente.');
        setValidationStatus({ allowed: false, reason: 'ERROR', remaining: 0, checked: true });
        return;
      }

      console.log('📋 Resposta RPC:', data);

      const result = data[0];
      
      if (!result.allowed) {
        if (result.reason === 'NOT_REGISTERED') {
          setValidationStatus({ allowed: false, reason: 'NOT_REGISTERED', remaining: 0, checked: true });
          toast.error(
            'Você ainda não está inscrito(a) no Civeni 2025.',
            {
              description: 'Para enviar Artigo/Projeto, primeiro faça sua inscrição.',
              action: {
                label: 'Inscreva-se no Civeni 2025',
                onClick: () => navigate('/inscricoes')
              }
            }
          );
        } else if (result.reason === 'LIMIT_REACHED') {
          setValidationStatus({ allowed: false, reason: 'LIMIT_REACHED', remaining: 0, checked: true });
          toast.error(
            'Limite de envios atingido.',
            {
              description: `Você já realizou o número máximo de 3 submissões para ${activeTab === 'artigo' ? 'Artigo' : 'Projeto'} no Civeni 2025.`
            }
          );
        } else {
          setValidationStatus({ allowed: false, reason: 'FORBIDDEN', remaining: 0, checked: true });
          toast.error(
            'Não foi possível validar sua submissão agora.',
            {
              description: 'Tente novamente em alguns instantes.'
            }
          );
        }
        return;
      }

      // Validação bem-sucedida
      setValidationStatus({ allowed: true, reason: null, remaining: result.remaining, checked: true });
      toast.success(
        `Validação concluída! Você pode enviar mais ${result.remaining} ${activeTab === 'artigo' ? 'artigo(s)' : 'projeto(s)'}.`
      );
      
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      toast.error('Erro ao validar dados. Tente novamente.');
      setValidationStatus({ allowed: false, reason: 'ERROR', remaining: 0, checked: true });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar limite antes de prosseguir
    if (!validationStatus.checked) {
      toast.error('Por favor, valide sua inscrição antes de enviar.');
      return;
    }

    if (!validationStatus.allowed) {
      if (validationStatus.reason === 'NOT_REGISTERED') {
        toast.error(
          'Você ainda não está inscrito(a) no Civeni 2025.',
          {
            action: {
              label: 'Inscreva-se',
              onClick: () => navigate('/inscricoes')
            }
          }
        );
      } else if (validationStatus.reason === 'LIMIT_REACHED') {
        toast.error(
          'Limite de envios atingido.',
          {
            description: `Você já realizou o número máximo de 3 submissões para ${activeTab === 'artigo' ? 'Artigo' : 'Projeto'}.`
          }
        );
      } else {
        toast.error('Não foi possível validar sua submissão. Tente novamente.');
      }
      return;
    }
    
    if (!file) {
      toast.error('Por favor, anexe um arquivo');
      return;
    }
    
    // Validação adicional do resumo
    if (formData.abstract.trim().length > 1500) {
      toast.error('Resumo muito longo. Use até 1500 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Iniciando submissão via Edge Function (anônima)');
      console.log('📊 Tamanho do arquivo:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('📝 Tipo do arquivo:', file.type);

      // Obter sessão se existir (opcional para submissão anônima)
      const { data: { session } } = await supabase.auth.getSession();

      // Preparar dados do formulário
      const fd = new FormData();
      fd.append('tipo', activeTab);
      fd.append('titulo', formData.work_title.trim());
      fd.append('autores', JSON.stringify([{
        nome: formData.author_name.trim(),
        email: formData.email.trim(),
        instituicao: formData.institution.trim()
      }]));
      fd.append('resumo', formData.abstract.trim());
      fd.append('area_tematica', formData.thematic_area.trim());
      fd.append('palavras_chave', JSON.stringify(
        formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
      ));
      fd.append('file', file);

      // Chamar Edge Function (com ou sem autenticação)
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const resp = await fetch(
        `https://wdkeqxfglmritghmakma.supabase.co/functions/v1/upload-and-register`,
        {
          method: 'POST',
          headers,
          body: fd
        }
      );

      const json = await resp.json();

      if (!resp.ok) {
        const msg = json?.error || 'Falha ao submeter. Tente novamente.';
        console.error('❌ Erro na submissão:', msg);
        toast.error(msg);
        throw new Error(msg);
      }

      console.log('✅ Submissão processada com sucesso!', json.submissao);
      toast.success('Trabalho submetido com sucesso!');
      navigate('/work-submission/success');

    } catch (error: any) {
      console.error('❌ Erro geral na submissão:', error);
      toast.error(error.message || 'Erro ao submeter trabalho. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <li><Link to="/area-tematica" className="hover:text-blue-200 transition-colors">{t('works.breadcrumb')}</Link></li>
              <li className="text-blue-200">›</li>
              <li>{t('works.submissionPage.title')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 font-poppins">
              {t('works.submissionPage.title')}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-100">
              {t('works.submissionPage.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/area-tematica" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {t('works.viewThematicAreas')}
                </button>
              </Link>
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('works.makeRegistration')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-poppins">
                {t('works.submissionPage.pageTitle')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('works.submissionPage.formDescription')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="artigo">Submissão de Artigos</TabsTrigger>
                  <TabsTrigger value="consorcio">Submissão de Projeto</TabsTrigger>
                </TabsList>
                
                <TabsContent value="artigo" className="mt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nome Completo do Autor *
                        </label>
                        <input
                          type="text"
                          name="author_name"
                          value={formData.author_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Instituição *
                        </label>
                        <input
                          type="text"
                          name="institution"
                          value={formData.institution}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <div className="space-y-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={validateRegistrationAndSubmission}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                        {isValidating && (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Validando inscrição...
                          </p>
                        )}
                        {validationStatus.checked && validationStatus.reason === 'NOT_REGISTERED' && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ Você ainda não está inscrito(a) no Civeni 2025. 
                            <Link to="/inscricoes" className="font-semibold underline ml-1">
                              Clique aqui para se inscrever
                            </Link>
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.reason === 'LIMIT_REACHED' && (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            ⚠️ Limite de envios atingido. Você já realizou o número máximo de 3 submissões para {activeTab === 'artigo' ? 'Artigo' : 'Projeto'}.
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.allowed && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            ✅ Validação concluída! Você pode enviar mais {validationStatus.remaining} {activeTab === 'artigo' ? 'artigo(s)' : 'consórcio(s)'}.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Título do Trabalho *
                      </label>
                      <input
                        type="text"
                        name="work_title"
                        value={formData.work_title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Área Temática *
                      </label>
                      <select
                        name="thematic_area"
                        value={formData.thematic_area}
                        onChange={handleInputChange}
                        required
                        disabled={isLoadingAreas}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue disabled:opacity-50"
                      >
                        <option value="">
                          {isLoadingAreas ? 'Carregando...' : 'Selecione uma área temática'}
                        </option>
                        {thematicAreas?.map((area) => {
                          const { name } = getLocalizedContent(area);
                          return (
                            <option key={area.id} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Resumo * (máximo 1500 caracteres)
                      </label>
                      <textarea
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleInputChange}
                        required
                        maxLength={1500}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                      <div className={`text-right text-sm mt-1 ${formData.abstract.length > 1500 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formData.abstract.length}/1500
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Palavras-chave * (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        required
                        placeholder="palavra1, palavra2, palavra3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Arquivo do Trabalho * (DOCX, máximo 50MB)
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Importante:</strong> Somente DOCX é aceito. PDFs não serão recebidos para permitir correções e ajustes pelos avaliadores.
                        </p>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-civeni-blue transition-colors">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          id="file-upload-artigo"
                        />
                        <label htmlFor="file-upload-artigo" className="cursor-pointer">
                          {file ? (
                            <div className="flex items-center justify-center space-x-2">
                              <FileText className="w-6 h-6 text-civeni-blue" />
                              <span className="text-civeni-blue font-semibold">{file.name}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">Clique para selecionar ou arraste um arquivo</p>
                              <p className="text-sm text-gray-400 mt-1">Apenas DOCX, máximo 50MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || !validationStatus.checked || !validationStatus.allowed}
                        className="w-full bg-civeni-blue text-white py-4 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Enviando...' : 'Submeter Artigo'}
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="consorcio" className="mt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nome Completo do Autor *
                        </label>
                        <input
                          type="text"
                          name="author_name"
                          value={formData.author_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Instituição *
                        </label>
                        <input
                          type="text"
                          name="institution"
                          value={formData.institution}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <div className="space-y-2">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={validateRegistrationAndSubmission}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                        />
                        {isValidating && (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Validando inscrição...
                          </p>
                        )}
                        {validationStatus.checked && validationStatus.reason === 'NOT_REGISTERED' && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ Você ainda não está inscrito(a) no Civeni 2025. 
                            <Link to="/inscricoes" className="font-semibold underline ml-1">
                              Clique aqui para se inscrever
                            </Link>
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.reason === 'LIMIT_REACHED' && (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            ⚠️ Limite de envios atingido. Você já realizou o número máximo de 3 submissões para {activeTab === 'artigo' ? 'Artigo' : 'Projeto'}.
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.allowed && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            ✅ Validação concluída! Você pode enviar mais {validationStatus.remaining} {activeTab === 'artigo' ? 'artigo(s)' : 'projeto(s)'}.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Título do Projeto *
                      </label>
                      <input
                        type="text"
                        name="work_title"
                        value={formData.work_title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Área Temática *
                      </label>
                      <select
                        name="thematic_area"
                        value={formData.thematic_area}
                        onChange={handleInputChange}
                        required
                        disabled={isLoadingAreas}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue disabled:opacity-50"
                      >
                        <option value="">
                          {isLoadingAreas ? 'Carregando...' : 'Selecione uma área temática'}
                        </option>
                        {thematicAreas?.map((area) => {
                          const { name } = getLocalizedContent(area);
                          return (
                            <option key={area.id} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descrição do Projeto * (máximo 1500 caracteres)
                      </label>
                      <textarea
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleInputChange}
                        required
                        maxLength={1500}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                      <div className={`text-right text-sm mt-1 ${formData.abstract.length > 1500 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formData.abstract.length}/1500
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Palavras-chave * (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        required
                        placeholder="palavra1, palavra2, palavra3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Proposta do Projeto * (DOCX, máximo 50MB)
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Importante:</strong> Somente DOCX é aceito. PDFs não serão recebidos para permitir correções e ajustes pelos avaliadores.
                        </p>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-civeni-blue transition-colors">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          id="file-upload-consorcio"
                        />
                        <label htmlFor="file-upload-consorcio" className="cursor-pointer">
                          {file ? (
                            <div className="flex items-center justify-center space-x-2">
                              <FileText className="w-6 h-6 text-civeni-blue" />
                              <span className="text-civeni-blue font-semibold">{file.name}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">Clique para selecionar ou arraste um arquivo</p>
                              <p className="text-sm text-gray-400 mt-1">Apenas DOCX, máximo 50MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || !validationStatus.checked || !validationStatus.allowed}
                        className="w-full bg-civeni-blue text-white py-4 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Enviando...' : 'Submeter Projeto'}
                      </button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubmissaoTrabalhos;
