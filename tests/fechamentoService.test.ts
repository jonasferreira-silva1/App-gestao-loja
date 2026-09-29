import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, getDatabase, initDatabase } from '../src/database/connection.js';
import { createProduto } from '../src/database/repositories/produtoRepository.js';
import { createVenda } from '../src/database/repositories/vendaRepository.js';
import {
  calcularFechamento,
  formatarFechamento,
} from '../src/services/fechamentoService.js';

describe('FechamentoService', () => {
  let db: Database.Database;
  let produtoAId: number;
  let produtoBId: number;
  const HOJE = new Date().toISOString().split('T')[0];

  beforeAll(() => {
    db = getDatabase(':memory:');
    initDatabase(db);
  });

  beforeEach(() => {
    db.prepare('DELETE FROM vendas').run();
    db.prepare('DELETE FROM produtos').run();

    const prodA = createProduto({
      nome: 'Colar Dourado',
      custo_unitario: 10.0,
      preco_venda_padrao: 45.0,
      estoque_inicial: 20,
    });
    const prodB = createProduto({
      nome: 'Anel Prata',
      custo_unitario: 8.0,
      preco_venda_padrao: 30.0,
      estoque_inicial: 20,
    });
    produtoAId = prodA.id;
    produtoBId = prodB.id;
  });

  afterAll(() => {
    closeDatabase();
  });

  it('deve retornar resultado zerado quando não há vendas', () => {
    const result = calcularFechamento(HOJE);

    expect(result.totalVendas).toBe(0);
    expect(result.faturamentoBruto).toBe(0);
    expect(result.custoTotal).toBe(0);
    expect(result.lucroBruto).toBe(0);
    expect(result.margemPercent).toBe(0);
    expect(result.produtoCampeao).toBeNull();
    expect(result.vendas).toHaveLength(0);
  });

  it('deve calcular faturamento, custo e lucro corretamente', () => {
    // Venda 1: colar por R$45 (custo R$10)
    createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });
    // Venda 2: anel por R$30 (custo R$8)
    createVenda({ produto_id: produtoBId, valor_venda: 30.0, forma_pagamento: 'dinheiro' });

    const result = calcularFechamento(HOJE);

    expect(result.totalVendas).toBe(2);
    expect(result.faturamentoBruto).toBeCloseTo(75.0);
    expect(result.custoTotal).toBeCloseTo(18.0);
    expect(result.lucroBruto).toBeCloseTo(57.0);
    expect(result.margemPercent).toBeCloseTo(76.0, 0);
  });

  it('deve identificar o produto campeão pelo maior volume vendido', () => {
    // Colar: 1 unidade
    createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });
    // Anel: 3 unidades
    createVenda({ produto_id: produtoBId, valor_venda: 30.0, forma_pagamento: 'pix', quantidade: 3 });

    const result = calcularFechamento(HOJE);

    expect(result.produtoCampeao).toBe('Anel Prata');
    expect(result.produtoCampeaoQtd).toBe(3);
  });

  it('deve consolidar totais por forma de pagamento', () => {
    createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });
    createVenda({ produto_id: produtoBId, valor_venda: 30.0, forma_pagamento: 'pix' });
    createVenda({ produto_id: produtoAId, valor_venda: 40.0, forma_pagamento: 'dinheiro' });

    const result = calcularFechamento(HOJE);

    expect(result.formasPagamento['pix']).toBeCloseTo(75.0);
    expect(result.formasPagamento['dinheiro']).toBeCloseTo(40.0);
  });

  it('deve considerar quantidade na venda para cálculo do custo total', () => {
    // 2 colares a R$45 cada (custo R$10 cada = R$20 total)
    createVenda({ produto_id: produtoAId, valor_venda: 90.0, forma_pagamento: 'pix', quantidade: 2 });

    const result = calcularFechamento(HOJE);

    expect(result.custoTotal).toBeCloseTo(20.0);
    expect(result.lucroBruto).toBeCloseTo(70.0);
  });

  it('deve retornar resultado zerado para data sem vendas', () => {
    createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });

    const result = calcularFechamento('2000-01-01');
    expect(result.totalVendas).toBe(0);
  });

  describe('formatarFechamento', () => {
    it('deve incluir mensagem de nenhuma venda quando totalVendas = 0', () => {
      const result = calcularFechamento(HOJE);
      const texto = formatarFechamento(result);

      expect(texto).toContain('Nenhuma venda');
    });

    it('deve incluir faturamento, lucro e margem quando há vendas', () => {
      createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });

      const result = calcularFechamento(HOJE);
      const texto = formatarFechamento(result);

      expect(texto).toContain('Faturamento bruto');
      expect(texto).toContain('Lucro bruto');
      expect(texto).toContain('Margem');
      expect(texto).toContain('Produto campeão');
      expect(texto).toContain('Colar Dourado');
    });

    it('deve exibir emoji verde para margem >= 40%', () => {
      createVenda({ produto_id: produtoAId, valor_venda: 45.0, forma_pagamento: 'pix' });
      const result = calcularFechamento(HOJE);
      const texto = formatarFechamento(result);
      expect(texto).toContain('🟢');
    });

    it('deve exibir emoji vermelho para margem < 20%', () => {
      // Custo 10, venda 11 → margem ~9%
      createVenda({ produto_id: produtoAId, valor_venda: 11.0, forma_pagamento: 'pix' });
      const result = calcularFechamento(HOJE);
      const texto = formatarFechamento(result);
      expect(texto).toContain('🔴');
    });
  });
});
