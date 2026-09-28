/**
 * Interface que representa um produto do catálogo de semijoias no banco de dados.
 */
export interface IProduct {
  id: number;
  nome: string;
  custo_unitario: number;
  preco_venda_padrao: number;
  estoque_atual: number;
  criado_em?: string;
}

/**
 * Data Transfer Object (DTO) para criação de um novo produto.
 */
export interface CreateProductDTO {
  nome: string;
  custo_unitario: number;
  preco_venda_padrao: number;
  estoque_inicial?: number;
}
