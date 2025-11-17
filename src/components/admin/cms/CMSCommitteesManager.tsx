import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Users, Move, ExternalLink, Mail } from 'lucide-react';
import SimpleImageUpload from '../SimpleImageUpload';

interface Committee {
  id?: string;
  slug: string;
  name: string;
  locale: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface CommitteeMember {
  id?: string;
  committee_id: string;
  name: string;
  role?: string;
  affiliation: string;
  photo_url?: string;
  email?: string;
  lattes_url?: string;
  linkedin_url?: string;
  sort_order: number;
  visible: boolean;
  locale: string;
  created_at?: string;
  updated_at?: string;
}

const CMSCommitteesManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('committees');
  const [activeLocale, setActiveLocale] = useState('pt-BR');
  
  // Committee states
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isCommitteeDialogOpen, setIsCommitteeDialogOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [committeeForm, setCommitteeForm] = useState<Committee>({
    slug: '',
    name: '',
    locale: 'pt-BR',
    sort_order: 0
  });

  // Member states
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('');
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [memberForm, setMemberForm] = useState<CommitteeMember>({
    committee_id: '',
    name: '',
    role: '',
    affiliation: '',
    photo_url: '',
    email: '',
    lattes_url: '',
    linkedin_url: '',
    sort_order: 0,
    visible: true,
    locale: 'pt-BR'
  });

  useEffect(() => {
    fetchCommittees();
  }, [activeLocale]);

  useEffect(() => {
    if (selectedCommittee) {
      fetchMembers();
    }
  }, [selectedCommittee, activeLocale]);

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_committees')
        .select('*')
        .eq('locale', activeLocale)
        .order('sort_order');

      if (error) {
        console.error('Error fetching committees:', error);
        return;
      }

      setCommittees(data || []);
      
      // Set first committee as selected if none selected
      if (!selectedCommittee && data && data.length > 0) {
        setSelectedCommittee(data[0].id!);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_committee_members')
        .select('*')
        .eq('committee_id', selectedCommittee)
        .eq('locale', activeLocale)
        .order('sort_order');

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveCommittee = async () => {
    if (!committeeForm.name || !committeeForm.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingCommittee?.id) {
        // Update
        const { error } = await supabase
          .from('cms_committees')
          .update({
            slug: committeeForm.slug,
            name: committeeForm.name,
            sort_order: committeeForm.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCommittee.id);

        if (error) throw error;
        toast.success('Comitê atualizado com sucesso!');
      } else {
        // Insert
        const { error } = await supabase
          .from('cms_committees')
          .insert([{
            slug: committeeForm.slug,
            name: committeeForm.name,
            locale: activeLocale,
            sort_order: committeeForm.sort_order
          }]);

        if (error) throw error;
        toast.success('Comitê criado com sucesso!');
      }

      setIsCommitteeDialogOpen(false);
      setEditingCommittee(null);
      resetCommitteeForm();
      fetchCommittees();
    } catch (error) {
      console.error('Error saving committee:', error);
      toast.error('Erro ao salvar comitê');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!memberForm.name || !memberForm.affiliation || !memberForm.committee_id) {
      toast.error('Nome, afiliação e comitê são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingMember?.id) {
        // Update
        const { error } = await supabase
          .from('cms_committee_members')
          .update({
            committee_id: memberForm.committee_id,
            name: memberForm.name,
            role: memberForm.role,
            affiliation: memberForm.affiliation,
            photo_url: memberForm.photo_url,
            email: memberForm.email,
            lattes_url: memberForm.lattes_url,
            linkedin_url: memberForm.linkedin_url,
            sort_order: memberForm.sort_order,
            visible: memberForm.visible,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;
        toast.success('Membro atualizado com sucesso!');
      } else {
        // Insert
        const { error } = await supabase
          .from('cms_committee_members')
          .insert([{
            committee_id: memberForm.committee_id,
            name: memberForm.name,
            role: memberForm.role,
            affiliation: memberForm.affiliation,
            photo_url: memberForm.photo_url,
            email: memberForm.email,
            lattes_url: memberForm.lattes_url,
            linkedin_url: memberForm.linkedin_url,
            sort_order: memberForm.sort_order,
            visible: memberForm.visible,
            locale: activeLocale
          }]);

        if (error) throw error;
        toast.success('Membro adicionado com sucesso!');
      }

      setIsMemberDialogOpen(false);
      setEditingMember(null);
      resetMemberForm();
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Erro ao salvar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comitê?')) return;

    try {
      const { error } = await supabase
        .from('cms_committees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Comitê excluído com sucesso!');
      fetchCommittees();
    } catch (error) {
      console.error('Error deleting committee:', error);
      toast.error('Erro ao excluir comitê');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;

    try {
      const { error } = await supabase
        .from('cms_committee_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Membro excluído com sucesso!');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao excluir membro');
    }
  };

  const resetCommitteeForm = () => {
    setCommitteeForm({
      slug: '',
      name: '',
      locale: activeLocale,
      sort_order: 0
    });
  };

  const resetMemberForm = () => {
    setMemberForm({
      committee_id: selectedCommittee,
      name: '',
      role: '',
      affiliation: '',
      photo_url: '',
      email: '',
      lattes_url: '',
      linkedin_url: '',
      sort_order: 0,
      visible: true,
      locale: activeLocale
    });
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setCommitteeForm(committee);
    setIsCommitteeDialogOpen(true);
  };

  const handleEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setMemberForm(member);
    setIsMemberDialogOpen(true);
  };

  const handleAddCommittee = () => {
    setEditingCommittee(null);
    resetCommitteeForm();
    setIsCommitteeDialogOpen(true);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    resetMemberForm();
    setIsMemberDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('admin.cms.committees.title', 'Gerenciar Comitês')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.cms.committees.description', 'Gerencie comitês e seus membros')}
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
        </div>
      </div>

      {/* Language Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Idioma</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={activeLocale} onValueChange={setActiveLocale}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="committees">Comitês</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        {/* Committees Tab */}
        <TabsContent value="committees" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddCommittee} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Comitê
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committees.map((committee) => (
              <Card key={committee.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{committee.name}</h3>
                      <p className="text-sm text-muted-foreground">{committee.slug}</p>
                      <Badge variant="outline" className="mt-2">
                        Ordem: {committee.sort_order}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCommittee(committee)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCommittee(committee.id!)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione um comitê" />
                </SelectTrigger>
                <SelectContent>
                  {committees.map((committee) => (
                    <SelectItem key={committee.id} value={committee.id!}>
                      {committee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedCommittee}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Membro
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Photo Section */}
                  <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-secondary/10">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {!member.visible && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive" className="text-xs">
                          Oculto
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Info Section */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">
                      {member.name}
                    </h3>
                    
                    {member.role && (
                      <p className="text-sm font-medium text-primary mb-2 line-clamp-1">
                        {member.role}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {member.affiliation}
                    </p>
                    
                    {/* Links */}
                    {(member.lattes_url || member.linkedin_url || member.email) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {member.lattes_url && (
                          <Badge variant="secondary" className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Lattes
                          </Badge>
                        )}
                        {member.linkedin_url && (
                          <Badge variant="secondary" className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            LinkedIn
                          </Badge>
                        )}
                        {member.email && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMember(member)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMember(member.id!)}
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
        </TabsContent>
      </Tabs>

      {/* Committee Dialog */}
      <Dialog open={isCommitteeDialogOpen} onOpenChange={setIsCommitteeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCommittee ? 'Editar Comitê' : 'Adicionar Comitê'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="committee-name">Nome *</Label>
              <Input
                id="committee-name"
                value={committeeForm.name}
                onChange={(e) => setCommitteeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do comitê"
              />
            </div>
            
            <div>
              <Label htmlFor="committee-slug">Slug *</Label>
              <Input
                id="committee-slug"
                value={committeeForm.slug}
                onChange={(e) => setCommitteeForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="slug-do-comite"
              />
            </div>
            
            <div>
              <Label htmlFor="committee-order">Ordem</Label>
              <Input
                id="committee-order"
                type="number"
                value={committeeForm.sort_order}
                onChange={(e) => setCommitteeForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCommitteeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCommittee} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label htmlFor="member-committee">Comitê *</Label>
                <Select 
                  value={memberForm.committee_id} 
                  onValueChange={(value) => setMemberForm(prev => ({ ...prev, committee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um comitê" />
                  </SelectTrigger>
                  <SelectContent>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id!}>
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="member-name">Nome *</Label>
                <Input
                  id="member-name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="member-role">Cargo/Função</Label>
                <Input
                  id="member-role"
                  value={memberForm.role || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Presidente, Membro, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="member-affiliation">Afiliação *</Label>
                <Input
                  id="member-affiliation"
                  value={memberForm.affiliation}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, affiliation: e.target.value }))}
                  placeholder="Instituição de origem"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={memberForm.email || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="member-order">Ordem</Label>
                  <Input
                    id="member-order"
                    type="number"
                    value={memberForm.sort_order}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="member-lattes">URL Lattes</Label>
                <Input
                  id="member-lattes"
                  value={memberForm.lattes_url || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, lattes_url: e.target.value }))}
                  placeholder="http://lattes.cnpq.br/..."
                />
              </div>
              
              <div>
                <Label htmlFor="member-linkedin">URL LinkedIn</Label>
                <Input
                  id="member-linkedin"
                  value={memberForm.linkedin_url || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="member-visible"
                  checked={memberForm.visible}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, visible: e.target.checked }))}
                />
                <Label htmlFor="member-visible">Visível no site</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveMember} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>

            <div>
              <Label>Foto</Label>
              <SimpleImageUpload
                value={memberForm.photo_url || ''}
                onChange={(url) => setMemberForm(prev => ({ ...prev, photo_url: url }))}
                label="Foto do Membro"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSCommitteesManager;