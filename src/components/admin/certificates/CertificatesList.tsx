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
  event_id: string;
  registration_id: string;
  email: string;
  full_name: string;
  code: string;
  issued_at: string;
  pdf_url: string;
  keywords_matched: number;
  keywords_provided: string[];
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

  const filteredCertificates = certificates.filter(cert => {
    const matchesEmail = cert.email.toLowerCase().includes(searchEmail.toLowerCase());
    // Status filter removed since issued_certificates doesn't have status field
    return matchesEmail;
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
              placeholder="Buscar por e-mail ou nome..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Palavras Corretas</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium text-sm">
                      {cert.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cert.full_name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {cert.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="secondary">
                        {cert.keywords_matched}/3
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cert.issued_at
                        ? new Date(cert.issued_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cert.pdf_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(cert.pdf_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}
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
