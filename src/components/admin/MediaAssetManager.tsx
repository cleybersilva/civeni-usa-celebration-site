import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  uploadImageToStorage, 
  saveAssetMetadata, 
  getAssetsBySection, 
  updateAsset,
  MediaAsset,
  resolveProductionAssetUrl
} from '@/utils/imageAssetManager';
import { Trash2, Edit, Save, X } from 'lucide-react';

interface MediaAssetManagerProps {
  section: string;
  title: string;
  description?: string;
}

export const MediaAssetManager: React.FC<MediaAssetManagerProps> = ({
  section,
  title,
  description
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAssets();
  }, [section]);

  const loadAssets = async () => {
    try {
      const data = await getAssetsBySection(section);
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar assets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await uploadImageToStorage(file, section);
      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      const assetData = {
        section,
        path: uploadResult.path,
        alt_text_pt: file.name.replace(/\.[^/.]+$/, ""),
        width: 0,
        height: 0
      };

      const savedAsset = await saveAssetMetadata(assetData);
      if (savedAsset) {
        setAssets(prev => [savedAsset, ...prev]);
        toast({
          title: "Sucesso",
          description: "Imagem carregada com sucesso"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Falha no upload da imagem",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleUpdateAsset = async (id: string, updates: Partial<MediaAsset>) => {
    try {
      const success = await updateAsset(id, updates);
      if (success) {
        setAssets(prev => prev.map(asset => 
          asset.id === id ? { ...asset, ...updates } : asset
        ));
        setEditingId(null);
        toast({
          title: "Sucesso",
          description: "Asset atualizado com sucesso"
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar asset",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Carregando assets...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div>
          <Label htmlFor={`upload-${section}`}>Adicionar Nova Imagem</Label>
          <Input
            id={`upload-${section}`}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mt-1"
          />
          {uploading && <p className="text-sm text-muted-foreground mt-2">Carregando...</p>}
        </div>

        {/* Assets List */}
        <div className="space-y-4">
          {assets.length === 0 ? (
            <p className="text-muted-foreground">Nenhum asset encontrado para esta seção.</p>
          ) : (
            assets.map(asset => (
              <div key={asset.id} className="border rounded p-4">
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={resolveProductionAssetUrl(asset.path)}
                      alt={asset.alt_text_pt || ''}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback para preview
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666">Imagem</text></svg>';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    {editingId === asset.id ? (
                      <EditForm
                        asset={asset}
                        onSave={(updates) => handleUpdateAsset(asset.id, updates)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div>
                        <p className="font-medium">{asset.alt_text_pt || 'Sem descrição'}</p>
                        <p className="text-sm text-muted-foreground">Caminho: {asset.path}</p>
                        <p className="text-sm text-muted-foreground">
                          URL: {resolveProductionAssetUrl(asset.path)}
                        </p>
                        {asset.width && asset.height && (
                          <p className="text-sm text-muted-foreground">
                            Dimensões: {asset.width}x{asset.height}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(asset.id)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface EditFormProps {
  asset: MediaAsset;
  onSave: (updates: Partial<MediaAsset>) => void;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ asset, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    alt_text_pt: asset.alt_text_pt || '',
    alt_text_en: asset.alt_text_en || '',
    alt_text_es: asset.alt_text_es || '',
    width: asset.width || 0,
    height: asset.height || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="alt_pt">Alt Text (PT)</Label>
        <Input
          id="alt_pt"
          value={formData.alt_text_pt}
          onChange={(e) => setFormData(prev => ({ ...prev, alt_text_pt: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="alt_en">Alt Text (EN)</Label>
        <Input
          id="alt_en"
          value={formData.alt_text_en}
          onChange={(e) => setFormData(prev => ({ ...prev, alt_text_en: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="alt_es">Alt Text (ES)</Label>
        <Input
          id="alt_es"
          value={formData.alt_text_es}
          onChange={(e) => setFormData(prev => ({ ...prev, alt_text_es: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="width">Largura</Label>
          <Input
            id="width"
            type="number"
            value={formData.width}
            onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="height">Altura</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          <Save className="w-4 h-4 mr-1" />
          Salvar
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default MediaAssetManager;