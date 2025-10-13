import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const WorkSubmissionSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      <div className="relative min-h-screen flex items-center justify-center py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-civeni-blue/10 to-civeni-red/10"></div>
        
        <Card className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur shadow-2xl border-0 relative z-10">
          <div className="p-8 md:p-12 text-center">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/18e671d0-0426-486d-977d-88d336f3c0de.png" 
                alt="CIVENI Logo" 
                className="w-48 mx-auto"
              />
            </div>
            
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trabalho Submetido com Sucesso!
              </h1>
              
              <p className="text-lg text-gray-700 mb-6">
                Obrigado por submeter seu trabalho ao III CIVENI 2025
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-6 h-6 text-civeni-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Confirmação por E-mail
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Um e-mail de confirmação foi enviado para o endereço cadastrado. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-civeni-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Próximos Passos
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Seu trabalho está sendo analisado pela nossa equipe de avaliadores. 
                    Você receberá atualizações sobre o status da avaliação por e-mail.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link to="/area-tematica" className="block">
                <Button className="w-full bg-civeni-blue hover:bg-blue-700 text-white text-lg py-6">
                  Ver Áreas Temáticas
                </Button>
              </Link>
              
              <Link to="/" className="block">
                <Button variant="outline" className="w-full text-lg py-6">
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default WorkSubmissionSuccess;
