/**
 * Interface que representa um registro de venda finalizada no banco de dados.
 */
export interface ISale {
  id: number;
  produto_id: number;
  valor_venda: number;
  quantidade: number;
  forma_pagamento: string;
  data_hora?: string;
  // Propriedades calculadas/juntas para relatórios
  nome_produto?: string;
  custo_unitario?: number;
}

/**
 * Data Transfer Object (DTO) para registrar uma nova venda.
 */
export interface CreateSaleDTO {
  produto_id: number;
  valor_venda: number;
  quantidade?: number;
  forma_pagamento: string;
}
