import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ProgramacaoDia } from "@/types/programacao";

const PAGE_WIDTH = 595.28;  // A4 width em points
const PAGE_HEIGHT = 841.89; // A4 height em points
const MARGIN_X = 40;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 40;

const HEADER_FONT_SIZE = 14;
const SUBHEADER_FONT_SIZE = 11;
const TEXT_FONT_SIZE = 9;
const TABLE_HEADER_FONT_SIZE = 9;
const LINE_HEIGHT = 12;

export async function gerarProgramacaoPDF(
  programacao: ProgramacaoDia[]
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  // 🔹 Cabeçalho geral
  const tituloPrincipal = "III CIVENI 2025 – PROGRAMAÇÃO OFICIAL";
  const tituloWidth = fontBold.widthOfTextAtSize(
    tituloPrincipal,
    HEADER_FONT_SIZE
  );
  page.drawText(tituloPrincipal, {
    x: (PAGE_WIDTH - tituloWidth) / 2,
    y: cursorY,
    size: HEADER_FONT_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  cursorY -= LINE_HEIGHT * 2;

  // Função auxiliar pra criar nova página quando faltar espaço
  const novaPagina = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = PAGE_HEIGHT - MARGIN_TOP;

    // Repete o cabeçalho geral em cada página
    page.drawText(tituloPrincipal, {
      x: (PAGE_WIDTH -
        fontBold.widthOfTextAtSize(tituloPrincipal, HEADER_FONT_SIZE)) / 2,
      y: cursorY,
      size: HEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    cursorY -= LINE_HEIGHT * 2;
  };

  // Função auxiliar para verificar espaço
  const precisaDeNovaPagina = (linhasNecessarias: number) => {
    return cursorY - linhasNecessarias * LINE_HEIGHT < MARGIN_BOTTOM;
  };

  // Colunas da tabela (ajuste fino se quiser igualzinho ao modelo atual)
  const colHorarioX = MARGIN_X;
  const colAtividadeX = colHorarioX + 70;
  const colPalestranteX = colAtividadeX + 220;
  const colLocalX = colPalestranteX + 140;

  const desenharCabecalhoTabela = () => {
    // Linha de título das colunas
    page.drawText("Horário", {
      x: colHorarioX,
      y: cursorY,
      size: TABLE_HEADER_FONT_SIZE,
      font: fontBold,
    });

    page.drawText("Atividade", {
      x: colAtividadeX,
      y: cursorY,
      size: TABLE_HEADER_FONT_SIZE,
      font: fontBold,
    });

    page.drawText("Palestrante / Origem", {
      x: colPalestranteX,
      y: cursorY,
      size: TABLE_HEADER_FONT_SIZE,
      font: fontBold,
    });

    page.drawText("Local", {
      x: colLocalX,
      y: cursorY,
      size: TABLE_HEADER_FONT_SIZE,
      font: fontBold,
    });

    cursorY -= LINE_HEIGHT;

    // Linha separadora
    page.drawLine({
      start: { x: MARGIN_X, y: cursorY + 4 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY + 4 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    cursorY -= LINE_HEIGHT / 2;
  };

  // Função pra quebrar texto em várias linhas (wrap) dentro de uma largura máxima
  const quebrarTexto = (
    text: string,
    maxWidth: number,
    font = fontRegular,
    size = TEXT_FONT_SIZE
  ): string[] => {
    if (!text) return [""];
    const palavras = text.split(" ");
    const linhas: string[] = [];
    let linhaAtual = "";

    for (const palavra of palavras) {
      const teste =
        linhaAtual.length === 0 ? palavra : `${linhaAtual} ${palavra}`;
      const testeWidth = font.widthOfTextAtSize(teste, size);
      if (testeWidth > maxWidth && linhaAtual.length > 0) {
        linhas.push(linhaAtual);
        linhaAtual = palavra;
      } else {
        linhaAtual = teste;
      }
    }

    if (linhaAtual.length > 0) {
      linhas.push(linhaAtual);
    }

    return linhas;
  };

  // 🔹 Loop por dia
  for (const dia of programacao) {
    // Espaço entre blocos de dias
    if (precisaDeNovaPagina(5)) novaPagina();

    // Título do dia
    const tituloDia = `${dia.tituloDia} – ${dia.data}${
      dia.modalidade === "presencial"
        ? " – Programação Presencial"
        : " – Programação Online"
    }`;

    page.drawText(tituloDia, {
      x: MARGIN_X,
      y: cursorY,
      size: SUBHEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0.25),
    });

    cursorY -= LINE_HEIGHT * 1.5;

    // Cabeçalho da tabela
    if (precisaDeNovaPagina(4)) novaPagina();
    desenharCabecalhoTabela();

    // 🔹 Atividades do dia
    for (const atividade of dia.atividades) {
      // Quebra de linhas pra colunas de texto longo
      const linhasHorario = [atividade.horario];

      const larguraAtividade = colPalestranteX - colAtividadeX - 8;
      const larguraPalestrante = colLocalX - colPalestranteX - 8;
      const larguraLocal = PAGE_WIDTH - MARGIN_X - colLocalX;

      const linhasAtividade = quebrarTexto(
        atividade.atividade,
        larguraAtividade
      );
      const linhasPalestrante = quebrarTexto(
        atividade.palestranteOrigem,
        larguraPalestrante
      );
      const linhasLocal = quebrarTexto(atividade.local, larguraLocal);

      const numLinhas = Math.max(
        linhasHorario.length,
        linhasAtividade.length,
        linhasPalestrante.length,
        linhasLocal.length
      );

      if (precisaDeNovaPagina(numLinhas + 2)) {
        novaPagina();
        desenharCabecalhoTabela();
      }

      for (let i = 0; i < numLinhas; i++) {
        const y = cursorY;

        if (linhasHorario[i]) {
          page.drawText(linhasHorario[i], {
            x: colHorarioX,
            y,
            size: TEXT_FONT_SIZE,
            font: fontRegular,
          });
        }

        if (linhasAtividade[i]) {
          page.drawText(linhasAtividade[i], {
            x: colAtividadeX,
            y,
            size: TEXT_FONT_SIZE,
            font: fontRegular,
          });
        }

        if (linhasPalestrante[i]) {
          page.drawText(linhasPalestrante[i], {
            x: colPalestranteX,
            y,
            size: TEXT_FONT_SIZE,
            font: fontRegular,
          });
        }

        if (linhasLocal[i]) {
          page.drawText(linhasLocal[i], {
            x: colLocalX,
            y,
            size: TEXT_FONT_SIZE,
            font: fontRegular,
          });
        }

        cursorY -= LINE_HEIGHT;
      }

      // Linha separadora entre atividades
      page.drawLine({
        start: { x: MARGIN_X, y: cursorY + 4 },
        end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY + 4 },
        thickness: 0.2,
        color: rgb(0.85, 0.85, 0.85),
      });

      cursorY -= LINE_HEIGHT / 2;
    }

    cursorY -= LINE_HEIGHT; // espaço extra ao final de cada dia
  }

  // 🔹 Rodapé simples em todas as páginas (opcional)
  const pages = pdfDoc.getPages();
  pages.forEach((p, index) => {
    const footerText = `III CIVENI 2025 – Programação sujeita a ajustes – Página ${
      index + 1
    } de ${pages.length}`;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, 8);

    p.drawText(footerText, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y: MARGIN_BOTTOM / 2,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
}
