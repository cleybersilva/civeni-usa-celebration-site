import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, FileText, Download, Search } from 'lucide-react';

interface IssuedCertificate {
  id: string;
  user_email: string;
  hash: string;
  status: string;
  emitido_at: string;
  arquivo_url?: string;
  event_id: string;
  created_at: string;
}

interface CertificatesListProps {
  certificates: IssuedCertificate[];
  onToggleStatus: (certId: string, currentStatus: string) => Promise<void>;
}

const CertificatesList: React.FC<CertificatesListProps> = ({
  certificates,
  onToggleStatus
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCertificates = certificates.filter(cert => {
    const matchesEmail = cert.user_email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesEmail && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certificados Emitidos
          </div>
          <Badge variant="secondary">
            {filteredCertificates.length} de {certificates.length} certificados
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="issued">Válidos</SelectItem>
              <SelectItem value="revoked">Revogados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {certificates.length === 0
                ? 'Nenhum certificado emitido ainda'
                : 'Nenhum certificado encontrado com os filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">
                      {cert.user_email}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {cert.hash.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cert.emitido_at
                        ? new Date(cert.emitido_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cert.status === 'issued' ? 'default' : 'destructive'}
                      >
                        {cert.status === 'issued' ? 'Válido' : 'Revogado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cert.arquivo_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(cert.arquivo_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={cert.status === 'issued' ? 'destructive' : 'default'}
                          onClick={() => onToggleStatus(cert.id, cert.status)}
                        >
                          {cert.status === 'issued' ? 'Revogar' : 'Revalidar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificatesList;
