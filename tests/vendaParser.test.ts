import { describe, expect, it } from 'vitest';
import { parseVendaMessage } from '../src/utils/vendaParser.js';

describe('parseVendaMessage', () => {
  it('deve parsear uma mensagem de venda válida', () => {
    const result = parseVendaMessage('venda / colar dourado / 45 / pix');

    expect(result).not.toBeNull();
    expect(result!.nomeProduto).toBe('colar dourado');
    expect(result!.valorVenda).toBe(45);
    expect(result!.formaPagamento).toBe('pix');
    expect(result!.quantidade).toBe(1);
  });

  it('deve parsear venda com valor decimal usando vírgula', () => {
    const result = parseVendaMessage('venda / anel prata / 29,90 / dinheiro');

    expect(result).not.toBeNull();
    expect(result!.valorVenda).toBe(29.9);
    expect(result!.formaPagamento).toBe('dinheiro');
  });

  it('deve parsear venda com quantidade informada', () => {
    const result = parseVendaMessage('venda / brinco folheado / 18 / cartão / 3');

    expect(result).not.toBeNull();
    expect(result!.quantidade).toBe(3);
  });

  it('deve normalizar "credito" para "crédito"', () => {
    const result = parseVendaMessage('venda / pulseira / 35 / credito');
    expect(result!.formaPagamento).toBe('crédito');
  });

  it('deve normalizar "debito" para "débito"', () => {
    const result = parseVendaMessage('venda / pulseira / 35 / debito');
    expect(result!.formaPagamento).toBe('débito');
  });

  it('deve normalizar "especie" para "dinheiro"', () => {
    const result = parseVendaMessage('venda / anel / 20 / especie');
    expect(result!.formaPagamento).toBe('dinheiro');
  });

  it('deve retornar null se faltar partes obrigatórias', () => {
    expect(parseVendaMessage('venda / colar / 45')).toBeNull();
    expect(parseVendaMessage('venda / colar')).toBeNull();
  });

  it('deve retornar null se não começar com "venda"', () => {
    expect(parseVendaMessage('compra / colar / 45 / pix')).toBeNull();
    expect(parseVendaMessage('olá / colar / 45 / pix')).toBeNull();
  });

  it('deve retornar null se o valor for inválido', () => {
    expect(parseVendaMessage('venda / colar / abc / pix')).toBeNull();
    expect(parseVendaMessage('venda / colar / -10 / pix')).toBeNull();
    expect(parseVendaMessage('venda / colar / 0 / pix')).toBeNull();
  });

  it('deve aceitar variações de maiúsculas/minúsculas no prefixo "venda"', () => {
    expect(parseVendaMessage('VENDA / colar / 45 / pix')).not.toBeNull();
    expect(parseVendaMessage('Venda / colar / 45 / pix')).not.toBeNull();
  });
});
