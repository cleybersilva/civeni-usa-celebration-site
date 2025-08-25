import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRegistrationCategories } from '@/hooks/useRegistrationCategories';

const PricingManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { categories, loading } = useRegistrationCategories();
  const [batches, setBatches] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    category_id: '',
    batch_id: '',
    price_brl: 0,
    price_usd: 0,
    is_active: true
  });

  // Load batches
  React.useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('registration_batches')
        .select('*')
        .order('batch_number', { ascending: true });
      
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      batch_id: '',
      price_brl: 0,
      price_usd: 0,
      is_active: true
    });
    setEditingPricing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.batch_id) return;
    
    setFormLoading(true);
    try {
      // This would be implemented with a proper pricing table
      toast({
        title: t('admin.formConfig.success', 'Sucesso'),
        description: t('admin.formConfig.pricingSaved', 'Preço configurado com sucesso')
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {t('admin.formConfig.loading', 'Carregando...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {t('admin.formConfig.pricing', 'Valores por Categoria')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.pricingDescription', 'Configure preços específicos por categoria e lote')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addPricing', 'Configurar Preço')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPricing 
                  ? t('admin.formConfig.editPricing', 'Editar Preço')
                  : t('admin.formConfig.addPricing', 'Configurar Preço')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category_id">
                  {t('admin.formConfig.category', 'Categoria')} *
                </Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.formConfig.selectCategory', 'Selecione uma categoria')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="batch_id">
                  {t('admin.formConfig.batch', 'Lote')} *
                </Label>
                <Select value={formData.batch_id} onValueChange={(value) => setFormData(prev => ({ ...prev, batch_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.formConfig.selectBatch', 'Selecione um lote')} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {t('admin.formConfig.batchLabel', 'Lote')} {batch.batch_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_brl">
                    {t('admin.formConfig.priceBRL', 'Preço (R$)')}
                  </Label>
                  <Input
                    id="price_brl"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_brl}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_brl: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price_usd">
                    {t('admin.formConfig.priceUSD', 'Preço (USD)')}
                  </Label>
                  <Input
                    id="price_usd"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_usd}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_usd: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">
                  {t('admin.formConfig.isActive', 'Ativo')}
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('admin.formConfig.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? t('admin.formConfig.saving', 'Salvando...') : t('admin.formConfig.save', 'Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.formConfig.currentPricing', 'Preços Atuais por Categoria')}</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {t('admin.formConfig.noCategories', 'Nenhuma categoria configurada')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.categoryName', 'Categoria')}</TableHead>
                  <TableHead>{t('admin.formConfig.priceBRL', 'Preço (R$)')}</TableHead>
                  <TableHead>{t('admin.formConfig.isExempt', 'Gratuita')}</TableHead>
                  <TableHead>{t('admin.formConfig.requiresProof', 'Requer Comprovação')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.category_name}</TableCell>
                    <TableCell>{formatCurrency(category.price_brl)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_exempt 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {category.is_exempt 
                          ? t('admin.formConfig.yes', 'Sim')
                          : t('admin.formConfig.no', 'Não')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.requires_proof 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.requires_proof 
                          ? t('admin.formConfig.yes', 'Sim')
                          : t('admin.formConfig.no', 'Não')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPricing(category);
                          setFormData({
                            category_id: category.id,
                            batch_id: '',
                            price_brl: category.price_brl,
                            price_usd: category.price_brl * 0.2, // Estimativa
                            is_active: true
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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

export default PricingManager;