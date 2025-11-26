import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProgramacaoDia } from '@/types/programacao';

const ProgramacaoImpressao = () => {
  const [searchParams] = useSearchParams();
  const modalidade = searchParams.get('modalidade') as 'presencial' | 'online' || 'presencial';
  
  const [programacao, setProgramacao] = useState<ProgramacaoDia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const { fetchProgramacaoData } = await import('@/lib/pdf/fetchProgramacao');
        const data = await fetchProgramacaoData(modalidade);
        setProgramacao(data);
      } catch (e) {
        console.error('Erro ao carregar programação para impressão', e);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [modalidade]);

  useEffect(() => {
    if (!carregando && programacao.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [carregando, programacao]);

  if (carregando) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Carregando programação...</p>
      </div>
    );
  }

  if (programacao.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Nenhuma programação encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px 30px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '10pt',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: auto;
        }
        
        thead {
          display: table-header-group;
        }
        
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px 6px;
          text-align: left;
          vertical-align: top;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 9pt;
        }
        
        .dia-section {
          page-break-before: auto;
          margin-bottom: 30px;
        }
        
        .dia-titulo {
          font-size: 12pt;
          font-weight: bold;
          color: #003366;
          margin: 20px 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 2px solid #003366;
        }
        
        .header-programacao {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 8px;
          background: linear-gradient(135deg, #003366, #0077cc);
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        
        .header-programacao::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.15;
          background-image: url('/assets/conference-event.jpg');
          background-size: cover;
          background-position: center;
        }
        
        .header-programacao-content {
          position: relative;
          z-index: 1;
        }
        
        .header-programacao h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0 0 10px 0;
          color: #fff;
        }
        
        .header-programacao p {
          font-size: 9pt;
          color: #e0e7ff;
          margin: 5px 0;
        }
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 8pt;
          color: #999;
        }
      `}</style>

      <header className="header-programacao">
        <div className="header-programacao-content">
          <h1>III CIVENI 2025 – PROGRAMAÇÃO OFICIAL</h1>
          <p>
            {modalidade === 'presencial' ? 'Programação Presencial' : 'Programação Online'}
          </p>
          <p style={{ fontSize: '8pt', color: '#e0e7ff' }}>
            *Horários em America/Fortaleza (GMT-3). Programação sujeita a ajustes.
          </p>
        </div>
      </header>

      {programacao.map((dia, index) => (
        <section key={index} className="dia-section">
          <h2 className="dia-titulo">
            {dia.tituloDia} – {dia.data}
          </h2>
          
          <table>
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Horário</th>
                <th style={{ width: '35%' }}>Atividade</th>
                <th style={{ width: '35%' }}>Palestrante / Origem</th>
                <th style={{ width: '18%' }}>Local</th>
              </tr>
            </thead>
            <tbody>
              {dia.atividades.map((atividade, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: '9pt' }}>{atividade.horario}</td>
                  <td style={{ fontSize: '9pt' }}>{atividade.atividade}</td>
                  <td style={{ fontSize: '9pt' }}>{atividade.palestranteOrigem}</td>
                  <td style={{ fontSize: '9pt' }}>{atividade.local}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="footer-programacao">
        <p>III CIVENI 2025 – Congresso Internacional Virtual de Educação e Inovação</p>
        <p>Programação sujeita a ajustes – Versão atualizada em {new Date().toLocaleDateString('pt-BR')}</p>
      </footer>
    </div>
  );
};

export default ProgramacaoImpressao;
