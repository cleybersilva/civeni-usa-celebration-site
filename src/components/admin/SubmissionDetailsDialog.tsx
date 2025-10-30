import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Building,
  Calendar,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { Submission } from '@/hooks/useSubmissions';

interface SubmissionDetailsDialogProps {
  submission: Submission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (id: string) => Promise<boolean>;
  onInvalidate: (id: string, motivo: string) => Promise<boolean>;
  onDownload: (path: string, filename: string) => void;
}

export const SubmissionDetailsDialog = ({
  submission,
  open,
  onOpenChange,
  onValidate,
  onInvalidate,
  onDownload,
}: SubmissionDetailsDialogProps) => {
  const [invalidateMotivo, setInvalidateMotivo] = useState('');
  const [showInvalidateForm, setShowInvalidateForm] = useState(false);

  const handleValidate = async () => {
    const success = await onValidate(submission.id);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleInvalidate = async () => {
    if (!invalidateMotivo.trim()) {
      return;
    }
    const success = await onInvalidate(submission.id, invalidateMotivo);
    if (success) {
      onOpenChange(false);
      setShowInvalidateForm(false);
      setInvalidateMotivo('');
    }
  };

  const filename = submission.arquivo_path.split('/').pop() || 'arquivo';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Submissão
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a submissão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Tipo */}
          <div className="flex items-center gap-4">
            <Badge variant={submission.tipo === 'artigo' ? 'default' : 'secondary'}>
              {submission.tipo === 'artigo' ? 'Artigo' : 'Consórcio'}
            </Badge>
            <Badge 
              variant={
                submission.status === 'validado' ? 'default' :
                submission.status === 'invalidado' ? 'destructive' :
                'secondary'
              }
            >
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>

          <Separator />

          {/* Informações do Trabalho */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Trabalho</h3>
            
            <div>
              <Label>Título</Label>
              <p className="text-sm mt-1">{submission.titulo}</p>
            </div>

            {submission.resumo && (
              <div>
                <Label>Resumo</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{submission.resumo}</p>
              </div>
            )}

            {submission.area_tematica && (
              <div>
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Área Temática
                </Label>
                <p className="text-sm mt-1">{submission.area_tematica}</p>
              </div>
            )}

            {submission.palavras_chave && submission.palavras_chave.length > 0 && (
              <div>
                <Label>Palavras-chave</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {submission.palavras_chave.map((keyword, idx) => (
                    <Badge key={idx} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações do Autor */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Autor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autor Principal
                </Label>
                <p className="text-sm mt-1">{submission.autor_principal}</p>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-sm mt-1">{submission.email}</p>
              </div>

              {submission.telefone && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <p className="text-sm mt-1">{submission.telefone}</p>
                </div>
              )}

              {submission.whatsapp && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <p className="text-sm mt-1">{submission.whatsapp}</p>
                </div>
              )}

              {submission.instituicao && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Instituição
                  </Label>
                  <p className="text-sm mt-1">{submission.instituicao}</p>
                </div>
              )}
            </div>

            {submission.autores && (
              <div>
                <Label>Coautores</Label>
                <div className="text-sm mt-1 space-y-1">
                  {Array.isArray(submission.autores) ? (
                    submission.autores.map((autor: any, idx: number) => (
                      <p key={idx}>
                        {typeof autor === 'string' ? autor : autor.nome || JSON.stringify(autor)}
                      </p>
                    ))
                  ) : (
                    <p>{JSON.stringify(submission.autores)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações do Arquivo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Arquivo Submetido</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(submission.arquivo_size / 1024 / 1024).toFixed(2)} MB • {submission.arquivo_mime}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => onDownload(submission.arquivo_path, filename)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>

          {submission.status_motivo && (
            <>
              <Separator />
              <div>
                <Label>Motivo da Invalidação</Label>
                <p className="text-sm mt-1 text-destructive">{submission.status_motivo}</p>
              </div>
            </>
          )}

          {/* Ações */}
          {!showInvalidateForm && (
            <div className="flex gap-3 pt-4">
              {submission.status !== 'validado' && (
                <Button onClick={handleValidate} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar e Notificar
                </Button>
              )}
              
              {submission.status !== 'invalidado' && (
                <Button
                  variant="destructive"
                  onClick={() => setShowInvalidateForm(true)}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Invalidar
                </Button>
              )}
            </div>
          )}

          {showInvalidateForm && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label>Motivo da Invalidação</Label>
                <Textarea
                  value={invalidateMotivo}
                  onChange={(e) => setInvalidateMotivo(e.target.value)}
                  placeholder="Descreva o motivo da invalidação..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleInvalidate}
                  disabled={!invalidateMotivo.trim()}
                  className="flex-1"
                >
                  Confirmar Invalidação
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInvalidateForm(false);
                    setInvalidateMotivo('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
