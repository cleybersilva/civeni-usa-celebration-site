import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, FileText } from "lucide-react";
import civeniLogo from '@/assets/civeni-2025-logo.png';
import conferenceImage from '@/assets/conference-event.jpg';

const WorkSubmissionSuccess = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="absolute inset-0">
        <img 
          src={conferenceImage} 
          alt="Evento de Conferência" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-8 px-8 space-y-8">
              {/* CIVENI Logo */}
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={civeniLogo} 
                    alt="CIVENI 2025" 
                    className="h-32 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Success Icon and Title */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Trabalho Submetido com Sucesso!
                </h1>
                
                <p className="text-lg text-muted-foreground">
                  Obrigado por submeter seu trabalho ao III CIVENI 2025
                </p>

                <div className="text-base text-foreground space-y-3">
                  <p className="font-bold text-lg">
                    📢 Aviso Importante — Submissão de Trabalhos
                  </p>
                  <p>
                    Cada participante inscrito no III CIVENI 2025 – Celebration/Florida-EUA poderá enviar até 3 (três) Artigos e até 3 (três) Consórcios por inscrição.
                    Essa limitação garante que todas as submissões sejam devidamente avaliadas pela comissão científica e que o processo mantenha qualidade, equidade e organização.
                  </p>
                  <p className="font-medium">
                    📎 Dica: verifique as normas e o formato exigido antes de enviar seu trabalho para evitar reprovações por formato incorreto.
                  </p>
                </div>
              </div>
              
              {/* Next Steps Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-civeni-blue flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Próximos Passos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Seu trabalho está sendo analisado pela nossa equipe de avaliadores. 
                      Você receberá atualizações sobre o status da avaliação por e-mail e ou WhatsApp realizado na inscrição do Civeni 2025.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                <Button 
                  asChild
                  size="lg"
                  className="w-full bg-civeni-blue hover:bg-blue-700 text-white"
                >
                  <Link to="/area-tematica">
                    Ver Áreas Temáticas
                  </Link>
                </Button>
                
                <Button 
                  asChild
                  variant="outline" 
                  size="lg"
                  className="w-full"
                >
                  <Link to="/">
                    Voltar ao Início
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkSubmissionSuccess;
