import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, Users, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SubmissaoTrabalhos = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('artigo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const thematicAreas = [
    "Educação e Tecnologia",
    "Metodologias Inovadoras", 
    "Formação Docente",
    "Educação Global",
    "Neuroeducação",
    "Educação Digital"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Por favor, envie apenas arquivos PDF ou DOCX');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('O arquivo deve ter no máximo 10MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File, submissionId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${submissionId}.${fileExt}`;
    const filePath = `${submissionId}/${fileName}`;

    const { error } = await supabase.storage
      .from('work-submissions')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    return { filePath, fileName };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Por favor, anexe um arquivo');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('=== SUBMITTING WORK ===');
      console.log('Form data:', formData);
      console.log('Active tab:', activeTab);
      console.log('File:', file?.name, file?.type, file?.size);
      
      // Use the submit-work edge function for secure submission
      const { data, error } = await supabase.functions.invoke('submit-work', {
        body: {
          ...formData,
          submission_kind: activeTab as 'artigo' | 'consorcio'
        }
      });

      console.log('=== FUNCTION RESPONSE ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Erro na função de submissão');
      }

      if (!data?.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Erro desconhecido na submissão');
      }

      const submissionId = data.id;
      console.log('Submission ID:', submissionId);

      // Upload file after successful submission
      const { filePath, fileName } = await uploadFile(file, submissionId);
      console.log('File uploaded:', filePath, fileName);

      // Update submission with file info
      const { error: updateError } = await supabase
        .from('work_submissions')
        .update({ 
          file_path: filePath,
          file_name: fileName 
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setIsSubmitted(true);
      toast.success('Trabalho submetido com sucesso!');

    } catch (error: any) {
      console.error('Error submitting work:', error);
      toast.error('Erro ao submeter trabalho. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-green-50 rounded-2xl p-8 mb-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-green-800 mb-4">
                  Trabalho Submetido com Sucesso!
                </h1>
                <p className="text-green-700 text-lg mb-6">
                  Seu trabalho foi recebido e está sendo analisado pela nossa equipe. 
                  Você receberá um e-mail de confirmação em breve.
                </p>
                <button
                  onClick={() => window.location.href = '/area-tematica'}
                  className="bg-civeni-blue text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                  Voltar às Áreas Temáticas
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

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
              Submissão de Artigos
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
                Submissão de Artigos
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
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      >
                        <option value="">Selecione uma área temática</option>
                        {thematicAreas.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
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
                        Arquivo do Trabalho * (PDF ou DOCX, máximo 10MB)
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
                              <p className="text-sm text-gray-400 mt-1">PDF ou DOCX, máximo 10MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
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
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      />
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civeni-blue focus:border-civeni-blue"
                      >
                        <option value="">Selecione uma área temática</option>
                        {thematicAreas.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
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
                        Arquivo do Trabalho * (PDF ou DOCX, máximo 10MB)
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
                              <p className="text-sm text-gray-400 mt-1">PDF ou DOCX, máximo 10MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
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