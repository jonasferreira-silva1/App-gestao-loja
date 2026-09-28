import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDatabase, initDatabase, closeDatabase } from '../src/database/connection.js';
import {
  createProduto,
  decrementarEstoque,
  findProdutoByNome,
  findProdutoById,
  listAllProdutos,
} from '../src/database/repositories/produtoRepository.js';

describe('ProdutoRepository', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = getDatabase(':memory:');
    initDatabase(db);
  });

  beforeEach(() => {
    // Limpa a tabela entre testes para isolamento
    db.prepare('DELETE FROM vendas').run();
    db.prepare('DELETE FROM produtos').run();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('deve cadastrar um produto e retorná-lo com ID gerado', () => {
    const produto = createProduto({
      nome: 'Colar Dourado',
      custo_unitario: 12.0,
      preco_venda_padrao: 45.0,
      estoque_inicial: 10,
    });

    expect(produto.id).toBeGreaterThan(0);
    expect(produto.nome).toBe('Colar Dourado');
    expect(produto.custo_unitario).toBe(12.0);
    expect(produto.preco_venda_padrao).toBe(45.0);
    expect(produto.estoque_atual).toBe(10);
  });

  it('deve usar estoque 0 quando estoque_inicial não for informado', () => {
    const produto = createProduto({
      nome: 'Anel Prata',
      custo_unitario: 8.0,
      preco_venda_padrao: 25.0,
    });

    expect(produto.estoque_atual).toBe(0);
  });

  it('deve lançar erro ao tentar cadastrar produto com nome duplicado', () => {
    createProduto({ nome: 'Brinco Folheado', custo_unitario: 5.0, preco_venda_padrao: 18.0 });

    expect(() =>
      createProduto({ nome: 'Brinco Folheado', custo_unitario: 6.0, preco_venda_padrao: 20.0 })
    ).toThrow();
  });

  it('deve buscar produto por nome (case-insensitive)', () => {
    createProduto({ nome: 'Pulseira Trançada', custo_unitario: 10.0, preco_venda_padrao: 35.0 });

    const encontrado = findProdutoByNome('pulseira trançada');
    expect(encontrado).not.toBeNull();
    expect(encontrado!.nome).toBe('Pulseira Trançada');
  });

  it('deve retornar null ao buscar produto inexistente por nome', () => {
    const resultado = findProdutoByNome('produto que nao existe');
    expect(resultado).toBeNull();
  });

  it('deve buscar produto por ID', () => {
    const criado = createProduto({ nome: 'Anel Ouro', custo_unitario: 20.0, preco_venda_padrao: 60.0 });
    const encontrado = findProdutoById(criado.id);

    expect(encontrado).not.toBeNull();
    expect(encontrado!.id).toBe(criado.id);
  });

  it('deve retornar null ao buscar ID inexistente', () => {
    const resultado = findProdutoById(999999);
    expect(resultado).toBeNull();
  });

  it('deve listar todos os produtos em ordem alfabética', () => {
    createProduto({ nome: 'Tornozeleira', custo_unitario: 15.0, preco_venda_padrao: 40.0 });
    createProduto({ nome: 'Anel', custo_unitario: 10.0, preco_venda_padrao: 30.0 });
    createProduto({ nome: 'Colar', custo_unitario: 12.0, preco_venda_padrao: 45.0 });

    const lista = listAllProdutos();
    expect(lista.length).toBe(3);
    expect(lista[0].nome).toBe('Anel');
    expect(lista[1].nome).toBe('Colar');
    expect(lista[2].nome).toBe('Tornozeleira');
  });

  it('deve decrementar o estoque corretamente após uma venda', () => {
    const produto = createProduto({
      nome: 'Brinco Dourado',
      custo_unitario: 6.0,
      preco_venda_padrao: 20.0,
      estoque_inicial: 5,
    });

    decrementarEstoque(produto.id, 2);

    const atualizado = findProdutoById(produto.id);
    expect(atualizado!.estoque_atual).toBe(3);
  });

  it('deve lançar erro ao tentar vender mais do que o estoque disponível', () => {
    const produto = createProduto({
      nome: 'Cordão Prata',
      custo_unitario: 18.0,
      preco_venda_padrao: 55.0,
      estoque_inicial: 2,
    });

    expect(() => decrementarEstoque(produto.id, 5)).toThrow('Estoque insuficiente');
  });
});
