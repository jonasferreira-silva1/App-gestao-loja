import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDatabase, initDatabase, closeDatabase } from '../src/database/connection.js';
import { createProduto } from '../src/database/repositories/produtoRepository.js';
import { createVenda, listVendasByDate } from '../src/database/repositories/vendaRepository.js';

describe('VendaRepository', () => {
  let db: Database.Database;
  let produtoId: number;

  beforeAll(() => {
    db = getDatabase(':memory:');
    initDatabase(db);
  });

  beforeEach(() => {
    db.prepare('DELETE FROM vendas').run();
    db.prepare('DELETE FROM produtos').run();

    // Produto base para os testes
    const produto = createProduto({
      nome: 'Colar de Teste',
      custo_unitario: 10.0,
      preco_venda_padrao: 40.0,
      estoque_inicial: 20,
    });
    produtoId = produto.id;
  });

  afterAll(() => {
    closeDatabase();
  });

  it('deve registrar uma venda e retorná-la com o nome do produto', () => {
    const venda = createVenda({
      produto_id: produtoId,
      valor_venda: 40.0,
      forma_pagamento: 'pix',
    });

    expect(venda.id).toBeGreaterThan(0);
    expect(venda.produto_id).toBe(produtoId);
    expect(venda.valor_venda).toBe(40.0);
    expect(venda.forma_pagamento).toBe('pix');
    expect(venda.quantidade).toBe(1);
    expect(venda.nome_produto).toBe('Colar de Teste');
  });

  it('deve decrementar o estoque do produto ao registrar a venda', () => {
    createVenda({ produto_id: produtoId, valor_venda: 40.0, forma_pagamento: 'pix' });
    createVenda({ produto_id: produtoId, valor_venda: 40.0, forma_pagamento: 'dinheiro', quantidade: 3 });

    const produto = db.prepare('SELECT estoque_atual FROM produtos WHERE id = ?').get(produtoId) as any;
    expect(produto.estoque_atual).toBe(16); // 20 - 1 - 3
  });

  it('deve lançar erro ao tentar vender além do estoque disponível', () => {
    expect(() =>
      createVenda({ produto_id: produtoId, valor_venda: 40.0, forma_pagamento: 'pix', quantidade: 50 })
    ).toThrow('Estoque insuficiente');
  });

  it('deve fazer rollback da transação se o estoque for insuficiente', () => {
    const estoqueAntes = (
      db.prepare('SELECT estoque_atual FROM produtos WHERE id = ?').get(produtoId) as any
    ).estoque_atual;

    try {
      createVenda({ produto_id: produtoId, valor_venda: 40.0, forma_pagamento: 'pix', quantidade: 999 });
    } catch (_) {
      // esperado
    }

    const estoqueDepois = (
      db.prepare('SELECT estoque_atual FROM produtos WHERE id = ?').get(produtoId) as any
    ).estoque_atual;

    const totalVendas = (db.prepare('SELECT COUNT(*) as total FROM vendas').get() as any).total;

    expect(estoqueDepois).toBe(estoqueAntes); // estoque não foi alterado
    expect(totalVendas).toBe(0); // nenhuma venda foi inserida
  });

  it('deve listar vendas por data', () => {
    createVenda({ produto_id: produtoId, valor_venda: 40.0, forma_pagamento: 'pix' });
    createVenda({ produto_id: produtoId, valor_venda: 35.0, forma_pagamento: 'dinheiro' });

    const hoje = new Date().toISOString().split('T')[0];
    const vendas = listVendasByDate(hoje);

    expect(vendas.length).toBe(2);
    expect(vendas[0].nome_produto).toBe('Colar de Teste');
  });

  it('deve retornar lista vazia para data sem vendas', () => {
    const vendas = listVendasByDate('2000-01-01');
    expect(vendas).toHaveLength(0);
  });
});
