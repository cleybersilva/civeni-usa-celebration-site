import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProgramacaoDia } from '@/types/programacao';

const ProgramacaoImpressao = () => {
  const [searchParams] = useSearchParams();
  const modalidade = searchParams.get('modalidade') as 'presencial' | 'online' || 'presencial';
  const lang = searchParams.get('lang') || 'pt';
  
  const { t, i18n } = useTranslation();
  const [programacao, setProgramacao] = useState<ProgramacaoDia[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Set language on mount
  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

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

  // Format date based on current language
  const formatCurrentDate = () => {
    const localeMap: Record<string, string> = {
      pt: 'pt-BR',
      en: 'en-US',
      es: 'es-ES',
      tr: 'tr-TR'
    };
    return new Date().toLocaleDateString(localeMap[lang] || 'pt-BR');
  };

  if (carregando) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>{t('schedulePdf.loading')}</p>
      </div>
    );
  }

  if (programacao.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>{t('schedulePdf.noSchedule')}</p>
      </div>
    );
  }

  return (
    <div className="print-programacao" style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0b1020' }}>
      <style>{`
        body {
          margin: 0;
          padding: 0;
        }

        .program-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          background: #f9fafb;
        }

        .program-header {
          position: relative;
          overflow: hidden;
          padding: 32px 32px 40px;
          color: #fff;
          text-align: center;
          background: linear-gradient(135deg, #021b3a 0%, #731b4c 50%, #c51d3b 100%);
        }

        .program-header-overlay {
          position: absolute;
          inset: 0;
          background-image: url('/assets/conference-event.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.25;
          mix-blend-mode: soft-light;
          pointer-events: none;
        }

        .program-header-content {
          position: relative;
          z-index: 1;
        }

        .program-header h1 {
          margin: 0 0 8px;
          font-size: 20px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .program-header p {
          margin: 4px 0;
          font-size: 11px;
        }

        .program-content {
          padding: 24px 24px 32px;
        }

        .day-block {
          margin-bottom: 24px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.09);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          page-break-inside: avoid;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9));
          color: #f9fafb;
        }

        .day-header-left h2 {
          margin: 0 0 2px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .day-header-left .day-date {
          font-size: 11px;
          opacity: 0.85;
        }

        .day-badge {
          font-size: 11px;
          text-transform: uppercase;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid rgba(248, 250, 252, 0.9);
          background: rgba(16, 185, 129, 0.18);
        }

        .day-table-wrapper {
          padding: 10px 14px 16px;
        }

        .program-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .program-table thead th {
          text-align: left;
          padding: 6px 6px;
          font-weight: 600;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
          background: #f3f4f6;
        }

        .program-table tbody td {
          padding: 5px 6px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }

        .program-table tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .program-table th:nth-child(1),
        .program-table td:nth-child(1) {
          width: 14%;
        }

        .program-table th:nth-child(2),
        .program-table td:nth-child(2) {
          width: 42%;
        }

        .program-table th:nth-child(3),
        .program-table td:nth-child(3) {
          width: 26%;
        }

        .program-table th:nth-child(4),
        .program-table td:nth-child(4) {
          width: 18%;
        }

        .program-footer {
          text-align: center;
          padding: 12px 16px 18px;
          font-size: 10px;
          color: #6b7280;
          background: #f3f4f6;
        }

        @media (max-width: 768px) {
          .program-wrapper {
            max-width: 100%;
          }

          .program-header {
            padding: 24px 16px 28px;
          }

          .program-content {
            padding: 16px;
          }

          .day-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        @page {
          size: A4;
          margin: 12mm 10mm;
        }

        @media print {
          body {
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .program-wrapper {
            box-shadow: none;
            margin: 0;
          }

          .day-block {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="program-wrapper">
        <header className="program-header">
          <div className="program-header-overlay"></div>
          <div className="program-header-content">
            <h1>{t('schedulePdf.title')}</h1>
            <p>
              {modalidade === 'presencial' 
                ? t('schedulePdf.subtitlePresencial') 
                : t('schedulePdf.subtitleOnline')}
            </p>
            <p>{t('schedulePdf.timezoneObs')}</p>
          </div>
        </header>

        <main className="program-content">
          {programacao.map((dia, index) => (
            <section key={index} className="day-block">
              <header className="day-header">
                <div className="day-header-left">
                  <h2>{dia.tituloDia}</h2>
                  <span className="day-date">{dia.data}</span>
                </div>
                <span className="day-badge">
                  {modalidade === 'presencial' 
                    ? t('schedulePdf.badgePresencial') 
                    : t('schedulePdf.badgeOnline')}
                </span>
              </header>

              <div className="day-table-wrapper">
                <table className="program-table">
                  <thead>
                    <tr>
                      <th>{t('schedulePdf.tableTime')}</th>
                      <th>{t('schedulePdf.tableActivity')}</th>
                      <th>{t('schedulePdf.tableSpeaker')}</th>
                      <th>{t('schedulePdf.tableLocation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dia.atividades.map((atividade, idx) => (
                      <tr key={idx}>
                        <td>{atividade.horario}</td>
                        <td>{atividade.atividade}</td>
                        <td>{atividade.palestranteOrigem}</td>
                        <td>{atividade.local}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </main>

        <footer className="program-footer">
          {t('schedulePdf.footerTitle')}<br/>
          {t('schedulePdf.footerSubject')} – {t('schedulePdf.footerUpdated')} {formatCurrentDate()}
        </footer>
      </div>
    </div>
  );
};

export default ProgramacaoImpressao;