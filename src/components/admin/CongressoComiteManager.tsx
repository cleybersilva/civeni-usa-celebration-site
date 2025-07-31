import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Users, Move } from 'lucide-react';
import SimpleImageUpload from './SimpleImageUpload';

interface ComiteMember {
  id?: string;
  nome: string;
  cargo_pt: string;
  cargo_en: string;
  cargo_es: string;
  instituicao: string;
  foto_url?: string;
  categoria: 'organizador' | 'cientifico' | 'avaliacao' | 'apoio_tecnico';
  ordem: number;
}

const CongressoComiteManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ComiteMember[]>([]);
  const [editingMember, setEditingMember] = useState<ComiteMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pt');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formData, setFormData] = useState<ComiteMember>({
    nome: '',
    cargo_pt: '',
    cargo_en: '',
    cargo_es: '',
    instituicao: '',
    foto_url: '',
    categoria: 'organizador',
    ordem: 1
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .order('categoria')
        .order('ordem');

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers((data || []) as ComiteMember[]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cargo_pt || !formData.instituicao) {
      toast.error(t('admin.congress.committee.required_fields', 'Preencha todos os campos obrigatórios'));
      return;
    }

    setLoading(true);
    try {
      if (editingMember?.id) {
        // Update existing member
        const { error } = await supabase
          .from('congresso_comite')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;
        toast.success(t('admin.congress.committee.update_success', 'Membro atualizado com sucesso!'));
      } else {
        // Insert new member
        const { error } = await supabase
          .from('congresso_comite')
          .insert([formData]);

        if (error) throw error;
        toast.success(t('admin.congress.committee.add_success', 'Membro adicionado com sucesso!'));
      }

      setIsDialogOpen(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(t('admin.congress.committee.save_error', 'Erro ao salvar membro'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.congress.committee.confirm_delete', 'Tem certeza que deseja excluir este membro?'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('congresso_comite')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('admin.congress.committee.delete_success', 'Membro removido com sucesso!'));
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(t('admin.congress.committee.delete_error', 'Erro ao remover membro'));
    }
  };

  const handleEdit = (member: ComiteMember) => {
    setEditingMember(member);
    setFormData(member);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cargo_pt: '',
      cargo_en: '',
      cargo_es: '',
      instituicao: '',
      foto_url: '',
      categoria: 'organizador',
      ordem: 1
    });
    setActiveTab('pt');
  };

  const handleAddNew = () => {
    setEditingMember(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof ComiteMember, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      foto_url: url
    }));
  };

  const getCategoryLabel = (categoria: string) => {
    const labels = {
      organizador: t('admin.congress.committee.categories.organizador', 'Comitê Organizador'),
      cientifico: t('admin.congress.committee.categories.cientifico', 'Comitê Científico'),
      avaliacao: t('admin.congress.committee.categories.avaliacao', 'Comissão de Avaliação'),
      apoio_tecnico: t('admin.congress.committee.categories.apoio_tecnico', 'Apoio Técnico')
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  const getCategoryColor = (categoria: string) => {
    const colors = {
      organizador: 'bg-primary text-primary-foreground',
      cientifico: 'bg-secondary text-secondary-foreground',
      avaliacao: 'bg-accent text-accent-foreground',
      apoio_tecnico: 'bg-muted text-muted-foreground'
    };
    return colors[categoria as keyof typeof colors] || colors.organizador;
  };

  const filteredMembers = selectedCategory === 'all' 
    ? members 
    : members.filter(member => member.categoria === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('admin.congress.committee.title', 'Gerenciar Comitê')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.congress.committee.description', 'Gerencie os membros do comitê do congresso')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2"
          >
            <a href="/congresso/comite" target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
              {t('admin.preview', 'Visualizar')}
            </a>
          </Button>
          
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('admin.congress.committee.add_member', 'Adicionar Membro')}
          </Button>
        </div>
      </div>

      {/* Filter by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('admin.congress.committee.filter', 'Filtrar por Categoria')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.congress.committee.all_categories', 'Todas as Categorias')}</SelectItem>
              <SelectItem value="organizador">{getCategoryLabel('organizador')}</SelectItem>
              <SelectItem value="cientifico">{getCategoryLabel('cientifico')}</SelectItem>
              <SelectItem value="avaliacao">{getCategoryLabel('avaliacao')}</SelectItem>
              <SelectItem value="apoio_tecnico">{getCategoryLabel('apoio_tecnico')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Photo Section */}
              <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-secondary/10">
                {member.foto_url ? (
                  <img
                    src={member.foto_url}
                    alt={member.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <Badge className={`${getCategoryColor(member.categoria)} text-xs`}>
                    {member.categoria.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">
                  {member.nome}
                </h3>
                
                <p className="text-sm font-medium text-primary mb-2 line-clamp-1">
                  {member.cargo_pt}
                </p>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {member.instituicao}
                </p>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(member)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(member.id!)}
                    className="flex-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember 
                ? t('admin.congress.committee.edit_member', 'Editar Membro') 
                : t('admin.congress.committee.add_member', 'Adicionar Membro')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Nome completo do membro"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="instituicao">Instituição *</Label>
                    <Input
                      id="instituicao"
                      value={formData.instituicao}
                      onChange={(e) => handleInputChange('instituicao', e.target.value)}
                      placeholder="Instituição de origem"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => handleInputChange('categoria', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="organizador">{getCategoryLabel('organizador')}</SelectItem>
                          <SelectItem value="cientifico">{getCategoryLabel('cientifico')}</SelectItem>
                          <SelectItem value="avaliacao">{getCategoryLabel('avaliacao')}</SelectItem>
                          <SelectItem value="apoio_tecnico">{getCategoryLabel('apoio_tecnico')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input
                        id="ordem"
                        type="number"
                        value={formData.ordem}
                        onChange={(e) => handleInputChange('ordem', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multilingual Positions */}
              <Card>
                <CardHeader>
                  <CardTitle>Cargo/Posição (Multilíngue)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pt">Português</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="es">Español</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pt" className="mt-4">
                      <div>
                        <Label htmlFor="cargo_pt">Cargo (Português) *</Label>
                        <Input
                          id="cargo_pt"
                          value={formData.cargo_pt}
                          onChange={(e) => handleInputChange('cargo_pt', e.target.value)}
                          placeholder="Cargo em português"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="en" className="mt-4">
                      <div>
                        <Label htmlFor="cargo_en">Position (English)</Label>
                        <Input
                          id="cargo_en"
                          value={formData.cargo_en}
                          onChange={(e) => handleInputChange('cargo_en', e.target.value)}
                          placeholder="Position in English"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="es" className="mt-4">
                      <div>
                        <Label htmlFor="cargo_es">Cargo (Español)</Label>
                        <Input
                          id="cargo_es"
                          value={formData.cargo_es}
                          onChange={(e) => handleInputChange('cargo_es', e.target.value)}
                          placeholder="Cargo en español"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('admin.cancel', 'Cancelar')}
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? t('admin.saving', 'Salvando...') : t('admin.save', 'Salvar')}
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleImageUpload
                    value={formData.foto_url || ''}
                    onChange={handleImageUpload}
                    label="Foto do Membro"
                  />
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden">
                      {formData.foto_url ? (
                        <img
                          src={formData.foto_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">
                              {formData.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center space-y-1">
                      <h4 className="font-semibold">{formData.nome}</h4>
                      <p className="text-sm text-primary">{formData.cargo_pt}</p>
                      <p className="text-xs text-muted-foreground">{formData.instituicao}</p>
                      <Badge className={`${getCategoryColor(formData.categoria)} text-xs`}>
                        {getCategoryLabel(formData.categoria)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CongressoComiteManager;