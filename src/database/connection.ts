import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

let dbInstance: Database.Database | null = null;

/**
 * Retorna a instância ativa do banco de dados SQLite.
 * 
 * @param customPath Caminho opcional para o banco de dados
 */
export function getDatabase(customPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const targetPath = customPath || env.DB_PATH;

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Database(targetPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  return dbInstance;
}

/**
 * Inicializa a estrutura de tabelas do banco de dados caso ainda não existam.
 */
export function initDatabase(db?: Database.Database): void {
  const connection = db || getDatabase();

  // Tabela de Produtos (Catálogo de semijoias)
  connection.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      custo_unitario REAL NOT NULL DEFAULT 0.0,
      preco_venda_padrao REAL NOT NULL DEFAULT 0.0,
      estoque_atual INTEGER NOT NULL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela de Vendas (com suporte a quantidade vendida)
  connection.exec(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      valor_venda REAL NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      forma_pagamento TEXT NOT NULL,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  `);

  // Tabela de Notas Fiscais
  connection.exec(`
    CREATE TABLE IF NOT EXISTS notas_fiscais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
      arquivo_origem TEXT NOT NULL,
      status_processamento TEXT NOT NULL DEFAULT 'PENDENTE'
    );
  `);

  // Tabela de Itens Extraídos da Nota Fiscal
  connection.exec(`
    CREATE TABLE IF NOT EXISTS itens_nota_fiscal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nota_fiscal_id INTEGER NOT NULL,
      produto_id INTEGER,
      descricao_extraida TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      valor_unitario REAL NOT NULL,
      FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  `);
}

/**
 * Encerra a conexão ativa com o banco de dados de forma graciosa.
 */
export function closeDatabase(): void {
  if (dbInstance && dbInstance.open) {
    dbInstance.close();
    dbInstance = null;
  }
}
