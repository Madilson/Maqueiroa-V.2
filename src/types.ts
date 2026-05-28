/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatusChamado = 'Aguardando' | 'Aceito' | 'Em_Transporte' | 'Finalizado' | 'Cancelado';
export type PrioridadeChamado = 'Baixa' | 'Media' | 'Alta' | 'Emergencia';

export interface Chamado {
  id: string;
  paciente: string;
  origem: string;
  destino: string;
  prioridade: PrioridadeChamado;
  observacao: string;
  status: StatusChamado;
  solicitante: string; // Nome ou Identificação da Enfermagem
  maqueiro?: string;  // Nome ou Identificação do Maqueiro
  criadoEm: string;   // ISO Date String
  aceitoEm?: string;  // ISO Date String
  iniciadoEm?: string; // ISO Date String
  finalizadoEm?: string; // ISO Date String
}

export interface Usuario {
  id: string;
  usuario: string;
  nome: string;
  tipo: 'Enfermagem' | 'Maqueiro' | 'Admin';
}

export interface Local {
  id: string;
  nome: string;
  tipo: 'Origem' | 'Destino';
}

export interface SystemLog {
  id: string;
  data: string;
  descricao: string;
  usuario: string;
  tipo: 'INFO' | 'AÇÃO' | 'ALERTA' | 'LOG';
}

export interface DashboardStats {
  totalCount: number;
  aguardandoCount: number;
  emTransporteCount: number;
  finalizadosCount: number;
  canceladosCount: number;
  tempoMedioAtendimento: number; // Em minutos
  porPrioridade: {
    Baixa: number;
    Media: number;
    Alta: number;
    Emergencia: number;
  };
  porOrigem: Record<string, number>;
  porDestino: Record<string, number>;
  corridasMaqueiro: Record<string, number>;
}
