export type Modalidade = "presencial" | "online";

export interface ProgramacaoAtividade {
  horario: string;             // "08:00–08:30"
  atividade: string;           // "Credenciamento e Cerimônia de Abertura"
  palestranteOrigem: string;   // "Dr. Chai Ching Tan" ou "Palestra Magistral"
  local: string;               // "Celebration/FL-USA" ou "Online"
}

export interface ProgramacaoDia {
  tituloDia: string;           // "QUINTA-FEIRA – DIA 1 – ABERTURA E CONFERÊNCIAS"
  data: string;                // "11/12/2025"
  modalidade: Modalidade;      // "presencial" | "online"
  atividades: ProgramacaoAtividade[];
}
