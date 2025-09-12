import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploadField from './ImageUploadField';
import { Calendar, Globe, Settings, Image as ImageIcon } from 'lucide-react';

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  title: string;
}

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    titulo: '',
    subtitulo: '',
    slug: '',
    descricao_richtext: '',
    
    // Dates and Location
    inicio_at: '',
    fim_at: '',
    timezone: 'America/Sao_Paulo',
    modalidade: 'online',
    endereco: '',
    
    // Media
    banner_url: '',
    youtube_url: '',
    playlist_url: '',
    
    // Registration
    tem_inscricao: false,
    inscricao_url: '',
    
    // Settings
    featured: false,
    exibir_passado: true,
    status_publicacao: 'draft',
    
    // SEO
    meta_title: '',
    meta_description: '',
    og_image: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        subtitulo: initialData.subtitulo || '',
        slug: initialData.slug || '',
        descricao_richtext: initialData.descricao_richtext || '',
        inicio_at: initialData.inicio_at ? new Date(initialData.inicio_at).toISOString().slice(0, 16) : '',
        fim_at: initialData.fim_at ? new Date(initialData.fim_at).toISOString().slice(0, 16) : '',
        timezone: initialData.timezone || 'America/Sao_Paulo',
        modalidade: initialData.modalidade || 'online',
        endereco: initialData.endereco || '',
        banner_url: initialData.banner_url || '',
        youtube_url: initialData.youtube_url || '',
        playlist_url: initialData.playlist_url || '',
        tem_inscricao: initialData.tem_inscricao || false,
        inscricao_url: initialData.inscricao_url || '',
        featured: initialData.featured || false,
        exibir_passado: initialData.exibir_passado !== undefined ? initialData.exibir_passado : true,
        status_publicacao: initialData.status_publicacao || 'draft',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        og_image: initialData.og_image || ''
      });
    } else {
      // Reset form for new event
      setFormData({
        titulo: '',
        subtitulo: '',
        slug: '',
        descricao_richtext: '',
        inicio_at: '',
        fim_at: '',
        timezone: 'America/Sao_Paulo',
        modalidade: 'online',
        endereco: '',
        banner_url: '',
        youtube_url: '',
        playlist_url: '',
        tem_inscricao: false,
        inscricao_url: '',
        featured: false,
        exibir_passado: true,
        status_publicacao: 'draft',
        meta_title: '',
        meta_description: '',
        og_image: ''
      });
    }
  }, [initialData, isOpen]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      titulo: title,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.titulo) 
        ? generateSlug(title) 
        : prev.slug, // Only auto-generate if slug is empty or matches previous title
      meta_title: prev.meta_title === '' ? title : prev.meta_title
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.slug || !formData.inicio_at) {
      alert('Por favor, preencha os campos obrigatórios: Título, Slug e Data de Início');
      return;
    }

    setLoading(true);
    try {
      // Prepare event data for the main event table
      const eventData = {
        slug: formData.slug,
        inicio_at: formData.inicio_at,
        fim_at: formData.fim_at || null,
        timezone: formData.timezone,
        modalidade: formData.modalidade,
        endereco: formData.endereco || null,
        banner_url: formData.banner_url || null,
        youtube_url: formData.youtube_url || null,
        playlist_url: formData.playlist_url || null,
        tem_inscricao: formData.tem_inscricao,
        inscricao_url: formData.inscricao_url || null,
        featured: formData.featured,
        exibir_passado: formData.exibir_passado,
        status_publicacao: formData.status_publicacao
      };

      // Prepare translation data
      const translationData = {
        idioma: 'pt-BR', // Default to Portuguese
        titulo: formData.titulo,
        subtitulo: formData.subtitulo || null,
        descricao_richtext: formData.descricao_richtext || null,
        meta_title: formData.meta_title || formData.titulo,
        meta_description: formData.meta_description || formData.subtitulo,
        og_image: formData.og_image || formData.banner_url
      };

      // Include translation data in the submission
      await onSubmit({
        ...eventData,
        translation: translationData,
        ...(initialData && { id: initialData.id })
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Mídia
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Título do evento"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="slug-do-evento"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        URL: /eventos/{formData.slug}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subtitulo">Subtítulo</Label>
                    <Input
                      id="subtitulo"
                      value={formData.subtitulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitulo: e.target.value }))}
                      placeholder="Subtítulo ou resumo do evento"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao_richtext}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao_richtext: e.target.value }))}
                      placeholder="Descrição detalhada do evento"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data e Local</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inicio_at">Data/Hora de Início *</Label>
                      <Input
                        id="inicio_at"
                        type="datetime-local"
                        value={formData.inicio_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, inicio_at: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fim_at">Data/Hora de Fim</Label>
                      <Input
                        id="fim_at"
                        type="datetime-local"
                        value={formData.fim_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, fim_at: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="modalidade">Modalidade *</Label>
                      <Select
                        value={formData.modalidade}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, modalidade: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a modalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">América/São Paulo (BRT)</SelectItem>
                          <SelectItem value="America/New_York">América/Nova York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europa/Londres (GMT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {(formData.modalidade === 'presencial' || formData.modalidade === 'hibrido') && (
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Textarea
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Endereço completo do evento"
                        rows={2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Imagens e Vídeos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ImageUploadField
                    label="Banner do Evento (16:9 recomendado)"
                    value={formData.banner_url}
                    onChange={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                    type="banner"
                  />
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">URL do YouTube (Live/Gravação)</Label>
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="playlist_url">URL da Playlist</Label>
                    <Input
                      id="playlist_url"
                      value={formData.playlist_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, playlist_url: e.target.value }))}
                      placeholder="https://youtube.com/playlist?list=..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO e Metadados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Título Meta (SEO)</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Título otimizado para SEO (até 60 caracteres)"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.meta_title.length}/60 caracteres
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Descrição Meta (SEO)</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Descrição otimizada para SEO (até 160 caracteres)"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.meta_description.length}/160 caracteres
                    </p>
                  </div>
                  
                  <ImageUploadField
                    label="Imagem Open Graph (1200x630 recomendado)"
                    value={formData.og_image}
                    onChange={(url) => setFormData(prev => ({ ...prev, og_image: url }))}
                    type="banner"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inscrições</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tem_inscricao"
                      checked={formData.tem_inscricao}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tem_inscricao: checked }))}
                    />
                    <Label htmlFor="tem_inscricao">Este evento possui inscrições</Label>
                  </div>
                  
                  {formData.tem_inscricao && (
                    <div className="space-y-2">
                      <Label htmlFor="inscricao_url">URL de Inscrição</Label>
                      <Input
                        id="inscricao_url"
                        value={formData.inscricao_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, inscricao_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Publicação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status_publicacao">Status</Label>
                    <Select
                      value={formData.status_publicacao}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status_publicacao: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                    <Label htmlFor="featured">Evento em destaque</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="exibir_passado"
                      checked={formData.exibir_passado}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, exibir_passado: checked }))}
                    />
                    <Label htmlFor="exibir_passado">Exibir quando passado</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')} Evento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};