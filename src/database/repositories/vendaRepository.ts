import { CreateSaleDTO, ISale } from '../../types/sale.js';
import { getDatabase } from '../connection.js';
import { decrementarEstoque } from './produtoRepository.js';

/**
 * Repositório de acesso a dados para a entidade Venda.
 * Centraliza todas as operações SQL relacionadas ao registro de vendas.
 */

/**
 * Registra uma nova venda no banco de dados e decrementa o estoque do produto.
 * A operação é executada em uma transação para garantir atomicidade.
 */
export function createVenda(dto: CreateSaleDTO): ISale {
  const db = getDatabase();
  const quantidade = dto.quantidade ?? 1;

  const transacao = db.transaction(() => {
    // Decrementa o estoque antes de registrar a venda
    decrementarEstoque(dto.produto_id, quantidade);

    const stmt = db.prepare(`
      INSERT INTO vendas (produto_id, valor_venda, quantidade, forma_pagamento)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(dto.produto_id, dto.valor_venda, quantidade, dto.forma_pagamento.trim());

    return findVendaById(result.lastInsertRowid as number)!;
  });

  return transacao();
}

/**
 * Busca uma venda pelo seu ID, incluindo o nome do produto por JOIN.
 */
export function findVendaById(id: number): ISale | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT v.*, p.nome AS nome_produto, p.custo_unitario
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       WHERE v.id = ?`
    )
    .get(id) as ISale | undefined;
  return row ?? null;
}

/**
 * Retorna todas as vendas registradas em uma data específica (formato YYYY-MM-DD).
 * Inclui o nome do produto e custo unitário para cálculos de fechamento.
 */
export function listVendasByDate(data: string): ISale[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT v.*, p.nome AS nome_produto, p.custo_unitario
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       WHERE DATE(v.data_hora) = ?
       ORDER BY v.data_hora DESC`
    )
    .all(data) as ISale[];
}

/**
 * Retorna todas as vendas de hoje.
 */
export function listVendasHoje(): ISale[] {
  return listVendasByDate(new Date().toISOString().split('T')[0]);
}
