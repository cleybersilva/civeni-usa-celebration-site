
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import { useCoupons, Coupon } from '@/hooks/useCoupons';
import { useRegistrationCategories } from '@/hooks/useRegistrationCategories';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const CouponManager = () => {
  const { coupons, loading, createCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const { categories } = useRegistrationCategories();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'category_override',
    discount_value: '',
    category_id: '',
    participant_type: '',
    is_active: true,
    usage_limit: '',
    status: 'active',
    valid_from: '',
    valid_until: ''
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      category_id: '',
      participant_type: '',
      is_active: true,
      usage_limit: '',
      status: 'active',
      valid_from: '',
      valid_until: ''
    });
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
      category_id: formData.category_id || null,
      participant_type: formData.participant_type || null,
      is_active: formData.is_active,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      status: formData.status || 'active',
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null
    };

    let result;
    if (editingCoupon) {
      result = await updateCoupon(editingCoupon.id, couponData);
    } else {
      result = await createCoupon(couponData);
    }

    if (result.success) {
      setIsDialogOpen(false);
      resetForm();
      alert(editingCoupon ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!');
    } else {
      console.error('Erro ao salvar cupom:', result.error);
      alert(`Erro ao salvar cupom: ${result.error?.message || 'Tente novamente.'}`);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value?.toString() || '',
      category_id: coupon.category_id || '',
      participant_type: (coupon as any).participant_type || '',
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit?.toString() || '',
      status: (coupon as any).status || 'active',
      valid_from: (coupon as any).valid_from || '',
      valid_until: (coupon as any).valid_until || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      const result = await deleteCoupon(couponId);
      if (result.success) {
        alert('Cupom excluído com sucesso!');
      } else {
        alert('Erro ao excluir cupom. Tente novamente.');
      }
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed_amount':
        return <DollarSign className="w-4 h-4" />;
      case 'category_override':
        return <Tag className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentagem';
      case 'fixed_amount':
        return 'Valor Fixo';
      case 'category_override':
        return 'Categoria Específica';
      default:
        return type;
    }
  };

  const formatDiscountValue = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      return `${coupon.discount_value}%`;
    } else if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return `R$ ${coupon.discount_value.toFixed(2)}`;
    } else if (coupon.discount_type === 'category_override') {
      const category = categories.find(cat => cat.id === coupon.category_id);
      return category ? category.category_name : 'Categoria não encontrada';
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Carregando cupons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Cupons de Desconto</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Adicionar Cupom'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code" className="block text-sm font-medium mb-2">
                  Código do Cupom
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="Ex: DESCONTO2025"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="block text-sm font-medium mb-2">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do cupom..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="discount_type" className="block text-sm font-medium mb-2">
                  Tipo de Desconto
                </Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed_amount' | 'category_override') => 
                    setFormData({...formData, discount_type: value, discount_value: '', category_id: ''})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem</SelectItem>
                    <SelectItem value="fixed_amount">Valor Fixo (R$)</SelectItem>
                    <SelectItem value="category_override">Categoria Específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <Label htmlFor="discount_value" className="block text-sm font-medium mb-2">
                    Percentual de Desconto (%)
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    placeholder="Ex: 10"
                    required
                  />
                </div>
              )}

              {formData.discount_type === 'fixed_amount' && (
                <div>
                  <Label htmlFor="discount_value" className="block text-sm font-medium mb-2">
                    Valor do Desconto (R$)
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    placeholder="Ex: 50.00"
                    required
                  />
                </div>
              )}

              {formData.discount_type === 'category_override' && (
                <div>
                  <Label htmlFor="category_id" className="block text-sm font-medium mb-2">
                    Categoria de Destino
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({...formData, category_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.category_name} - {category.is_exempt ? 'GRATUITO' : `R$ ${category.price_brl.toFixed(2)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="participant_type" className="block text-sm font-medium mb-2">
                  Tipo de Participante (opcional)
                </Label>
                <Select
                  value={formData.participant_type}
                  onValueChange={(value) => setFormData({...formData, participant_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os participantes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os participantes</SelectItem>
                    <SelectItem value="professor">Professor(a)</SelectItem>
                    <SelectItem value="palestrante">Palestrante</SelectItem>
                    <SelectItem value="convidado">Convidado(a)</SelectItem>
                    <SelectItem value="estudante">Estudante</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from" className="block text-sm font-medium mb-2">
                    Válido de (opcional)
                  </Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until" className="block text-sm font-medium mb-2">
                    Válido até (opcional)
                  </Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="usage_limit" className="block text-sm font-medium mb-2">
                  Limite de Uso (opcional)
                </Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                  placeholder="Ex: 100"
                />
              </div>

              <div>
                <Label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status do Cupom
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Cupom ativo
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  {editingCoupon ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cupons de Desconto ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum cupom cadastrado. Clique em "Adicionar Cupom" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-bold">{coupon.code}</div>
                        {coupon.description && (
                          <div className="text-sm text-gray-500">{coupon.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDiscountTypeIcon(coupon.discount_type)}
                        <span className="text-sm">{getDiscountTypeLabel(coupon.discount_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatDiscountValue(coupon)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{coupon.used_count || 0} usado(s)</div>
                        {coupon.usage_limit && (
                          <div className="text-gray-500">
                            Limite: {coupon.usage_limit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponManager;
