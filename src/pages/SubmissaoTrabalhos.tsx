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
    isRegistered: boolean;
    hasSubmitted: boolean;
    checked: boolean;
  }>({ isRegistered: false, hasSubmitted: false, checked: false });

  // Reset validation when changing tabs
  useEffect(() => {
    setValidationStatus({ isRegistered: false, hasSubmitted: false, checked: false });
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset validation when email or author name changes
    if (name === 'email' || name === 'author_name') {
      setValidationStatus({ isRegistered: false, hasSubmitted: false, checked: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Por favor, envie apenas arquivos PDF ou DOCX');
        return;
      }
      
      if (selectedFile.size > 15 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 15MB');
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
      // Verificar se o aluno está inscrito no Civeni 2025
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select('id, email, full_name, payment_status')
        .eq('email', formData.email.toLowerCase().trim())
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (regError) {
        console.error('Erro ao verificar inscrição:', regError);
        toast.error('Erro ao validar inscrição. Tente novamente.');
        setValidationStatus({ isRegistered: false, hasSubmitted: false, checked: true });
        return;
      }

      if (!registration) {
        setValidationStatus({ isRegistered: false, hasSubmitted: false, checked: true });
        toast.error(
          'Você precisa estar inscrito no CIVENI 2025 para submeter trabalhos.',
          {
            description: 'Faça sua inscrição antes de enviar artigos ou consórcios.',
            action: {
              label: 'Ir para Inscrições',
              onClick: () => navigate('/inscricoes')
            }
          }
        );
        return;
      }

      // Verificar se já existe submissão deste tipo para este email
      const { data: existingSubmission, error: subError } = await supabase
        .from('submissions')
        .select('id, tipo, created_at')
        .eq('email', formData.email.toLowerCase().trim())
        .eq('tipo', activeTab)
        .not('status', 'eq', 'arquivado')
        .maybeSingle();

      if (subError) {
        console.error('Erro ao verificar submissões:', subError);
        toast.error('Erro ao validar submissões. Tente novamente.');
        setValidationStatus({ isRegistered: true, hasSubmitted: false, checked: true });
        return;
      }

      if (existingSubmission) {
        setValidationStatus({ isRegistered: true, hasSubmitted: true, checked: true });
        toast.error(
          `Você já enviou uma submissão de ${activeTab === 'artigo' ? 'Artigo' : 'Consórcio'}.`,
          {
            description: 'Cada aluno pode enviar apenas uma submissão por tipo.'
          }
        );
        return;
      }

      setValidationStatus({ isRegistered: true, hasSubmitted: false, checked: true });
      toast.success('Inscrição validada! Você pode prosseguir com o envio.');
    } catch (error) {
      console.error('Erro na validação:', error);
      toast.error('Erro ao validar dados. Tente novamente.');
      setValidationStatus({ isRegistered: false, hasSubmitted: false, checked: true });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar inscrição e submissão antes de prosseguir
    if (!validationStatus.checked) {
      toast.error('Por favor, valide sua inscrição antes de enviar.');
      return;
    }

    if (!validationStatus.isRegistered) {
      toast.error(
        'Você precisa estar inscrito no CIVENI 2025 para submeter trabalhos.',
        {
          action: {
            label: 'Ir para Inscrições',
            onClick: () => navigate('/inscricoes')
          }
        }
      );
      return;
    }

    if (validationStatus.hasSubmitted) {
      toast.error(
        `Você já enviou uma submissão de ${activeTab === 'artigo' ? 'Artigo' : 'Consórcio'}.`,
        {
          description: 'Cada aluno pode enviar apenas uma submissão por tipo.'
        }
      );
      return;
    }
    
    if (!file) {
      toast.error('Por favor, anexe um arquivo');
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
              <li><Link to="/area-tematica" className="hover:text-blue-200 transition-colors">Trabalhos</Link></li>
              <li className="text-blue-200">›</li>
              <li>Submissão</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Submissão Artigos/Consórcio
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Compartilhe suas pesquisas e experiências no III CIVENI 2025 - 
              Contribua para o avanço do conhecimento multidisciplinar mundial
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
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-poppins">
                Submissão Artigos/Consórcio
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Escolha o tipo de submissão e preencha todos os campos obrigatórios
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="artigo">Submissão de Artigos</TabsTrigger>
                  <TabsTrigger value="consorcio">Submissão de Consórcio</TabsTrigger>
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
                        {validationStatus.checked && !validationStatus.isRegistered && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ Você precisa estar inscrito no CIVENI 2025. 
                            <Link to="/inscricoes" className="font-semibold underline ml-1">
                              Clique aqui para se inscrever
                            </Link>
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.hasSubmitted && (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            ⚠️ Você já enviou uma submissão de {activeTab === 'artigo' ? 'Artigo' : 'Consórcio'}. 
                            Cada aluno pode enviar apenas uma submissão por tipo.
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.isRegistered && !validationStatus.hasSubmitted && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            ✅ Inscrição validada! Você pode prosseguir com o envio.
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
                        Resumo * (máximo 500 caracteres)
                      </label>
                      <textarea
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleInputChange}
                        required
                        maxLength={500}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {formData.abstract.length}/500
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
                        Arquivo do Trabalho * (PDF ou DOCX, máximo 15MB)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-civeni-blue transition-colors">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx"
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
                              <p className="text-sm text-gray-400 mt-1">PDF ou DOCX, máximo 15MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || !validationStatus.checked || !validationStatus.isRegistered || validationStatus.hasSubmitted}
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
                        {validationStatus.checked && !validationStatus.isRegistered && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ Você precisa estar inscrito no CIVENI 2025. 
                            <Link to="/inscricoes" className="font-semibold underline ml-1">
                              Clique aqui para se inscrever
                            </Link>
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.hasSubmitted && (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            ⚠️ Você já enviou uma submissão de {activeTab === 'artigo' ? 'Artigo' : 'Consórcio'}. 
                            Cada aluno pode enviar apenas uma submissão por tipo.
                          </div>
                        )}
                        {validationStatus.checked && validationStatus.isRegistered && !validationStatus.hasSubmitted && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            ✅ Inscrição validada! Você pode prosseguir com o envio.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Título do Consórcio *
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
                        Descrição do Consórcio * (máximo 500 caracteres)
                      </label>
                      <textarea
                        name="abstract"
                        value={formData.abstract}
                        onChange={handleInputChange}
                        required
                        maxLength={500}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {formData.abstract.length}/500
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
                        Proposta do Consórcio * (PDF ou DOCX, máximo 15MB)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-civeni-blue transition-colors">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx"
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
                              <p className="text-sm text-gray-400 mt-1">PDF ou DOCX, máximo 15MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || !validationStatus.checked || !validationStatus.isRegistered || validationStatus.hasSubmitted}
                        className="w-full bg-civeni-blue text-white py-4 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Enviando...' : 'Submeter Consórcio'}
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
