import { CreateProductDTO, IProduct } from '../../types/product.js';
import { getDatabase } from '../connection.js';

/**
 * Repositório de acesso a dados para a entidade Produto.
 * Centraliza todas as operações SQL relacionadas ao catálogo de semijoias.
 */

/**
 * Insere um novo produto no catálogo.
 * Lança erro se o nome já existir (constraint UNIQUE).
 */
export function createProduto(dto: CreateProductDTO): IProduct {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO produtos (nome, custo_unitario, preco_venda_padrao, estoque_atual)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    dto.nome.trim(),
    dto.custo_unitario,
    dto.preco_venda_padrao,
    dto.estoque_inicial ?? 0
  );

  return findProdutoById(result.lastInsertRowid as number)!;
}

/**
 * Busca um produto pelo seu ID único.
 */
export function findProdutoById(id: number): IProduct | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id) as IProduct | undefined;
  return row ?? null;
}

/**
 * Busca um produto pelo nome (busca exata, case-insensitive via COLLATE NOCASE).
 */
export function findProdutoByNome(nome: string): IProduct | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM produtos WHERE nome = ? COLLATE NOCASE')
    .get(nome.trim()) as IProduct | undefined;
  return row ?? null;
}

/**
 * Retorna todos os produtos do catálogo ordenados por nome.
 */
export function listAllProdutos(): IProduct[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM produtos ORDER BY nome ASC').all() as IProduct[];
}

/**
 * Decrementa o estoque de um produto após uma venda.
 * Lança erro se o estoque for insuficiente.
 */
export function decrementarEstoque(produtoId: number, quantidade: number): void {
  const db = getDatabase();

  const produto = findProdutoById(produtoId);
  if (!produto) {
    throw new Error(`Produto com ID ${produtoId} não encontrado.`);
  }

  if (produto.estoque_atual < quantidade) {
    throw new Error(
      `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque_atual}, solicitado: ${quantidade}.`
    );
  }

  db.prepare('UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?').run(quantidade, produtoId);
}
