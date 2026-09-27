import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDatabase, getDatabase, initDatabase } from '../src/database/connection.js';

describe('Database Connection & Schema (SQLite)', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Utiliza banco SQLite em memória para isolamento total dos testes
    db = getDatabase(':memory:');
    initDatabase(db);
  });

  afterAll(() => {
    closeDatabase();
  });

  it('deve criar a tabela "produtos" com os campos corretos', () => {
    const tableInfo = db.prepare("PRAGMA table_info('produtos');").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('nome');
    expect(columnNames).toContain('custo_unitario');
    expect(columnNames).toContain('preco_venda_padrao');
    expect(columnNames).toContain('estoque_atual');
    expect(columnNames).toContain('criado_em');
  });

  it('deve criar a tabela "vendas" com chave estrangeira para produtos', () => {
    const tableInfo = db.prepare("PRAGMA table_info('vendas');").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('produto_id');
    expect(columnNames).toContain('valor_venda');
    expect(columnNames).toContain('forma_pagamento');
    expect(columnNames).toContain('data_hora');
  });

  it('deve criar a tabela "notas_fiscais"', () => {
    const tableInfo = db.prepare("PRAGMA table_info('notas_fiscais');").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('data_upload');
    expect(columnNames).toContain('arquivo_origem');
    expect(columnNames).toContain('status_processamento');
  });

  it('deve criar a tabela "itens_nota_fiscal"', () => {
    const tableInfo = db.prepare("PRAGMA table_info('itens_nota_fiscal');").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('nota_fiscal_id');
    expect(columnNames).toContain('produto_id');
    expect(columnNames).toContain('descricao_extraida');
    expect(columnNames).toContain('quantidade');
    expect(columnNames).toContain('valor_unitario');
  });

  it('deve permitir a inserção e consulta de um produto de teste', () => {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, custo_unitario, preco_venda_padrao, estoque_atual)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run('Anel Solitário Folheado A Ouro', 15.50, 45.00, 10);

    expect(result.changes).toBe(1);

    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid) as any;
    expect(produto.nome).toBe('Anel Solitário Folheado A Ouro');
    expect(produto.custo_unitario).toBe(15.50);
    expect(produto.preco_venda_padrao).toBe(45.00);
    expect(produto.estoque_atual).toBe(10);
  });
});
