import { Context } from 'telegraf';
import { findProdutoByNome } from '../../database/repositories/produtoRepository.js';
import { createVenda } from '../../database/repositories/vendaRepository.js';
import { parseVendaMessage } from '../../utils/vendaParser.js';

/**
 * Handler para mensagens de texto livre no formato de venda:
 *   `venda / <produto> / <valor> / <pagamento>`
 *   `venda / <produto> / <valor> / <pagamento> / <quantidade>`
 *
 * Este handler deve ser registrado como `bot.on('text', ...)` após os comandos.
 */
export async function handleVendaMessage(ctx: Context): Promise<void> {
  const texto = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

  // Só processa mensagens que começam com "venda"
  if (!texto.toLowerCase().trim().startsWith('venda')) return;

  const parsed = parseVendaMessage(texto);

  if (!parsed) {
    await ctx.reply(
      '⚠️ Formato de venda inválido. Use:\n\n' +
        '`venda / <produto> / <valor> / <pagamento>`\n\n' +
        '*Exemplo:* `venda / colar dourado / 45 / pix`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const { nomeProduto, valorVenda, formaPagamento, quantidade } = parsed;

  try {
    // Busca o produto pelo nome
    const produto = findProdutoByNome(nomeProduto);

    if (!produto) {
      await ctx.reply(
        `❌ Produto *"${nomeProduto}"* não encontrado no catálogo.\n\n` +
          `Use /produtos para ver os itens disponíveis ou /cadastrar para adicionar um novo produto.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Registra a venda (já faz o abatimento de estoque via transação)
    const venda = createVenda({
      produto_id: produto.id,
      valor_venda: valorVenda,
      quantidade,
      forma_pagamento: formaPagamento,
    });

    const custoTotal = produto.custo_unitario * quantidade;
    const lucro = valorVenda - custoTotal;
    const margem = valorVenda > 0 ? ((lucro / valorVenda) * 100).toFixed(1) : '0.0';
    const estoqueRestante = produto.estoque_atual - quantidade;

    await ctx.reply(
      `✅ *Venda registrada com sucesso!* 🎉\n\n` +
        `📦 *Produto:* ${produto.nome}\n` +
        `🔢 *Quantidade:* ${quantidade} un.\n` +
        `💵 *Valor de venda:* R$ ${valorVenda.toFixed(2)}\n` +
        `💳 *Pagamento:* ${formaPagamento}\n\n` +
        `📊 *Resumo Financeiro:*\n` +
        `   └ Custo total: R$ ${custoTotal.toFixed(2)}\n` +
        `   └ *Lucro: R$ ${lucro.toFixed(2)}* (${margem}%)\n\n` +
        `🗃️ Estoque restante: ${estoqueRestante} un. | 🆔 Venda #${venda.id}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('Erro ao registrar venda:', error);

    // Erros de estoque chegam com mensagem amigável do repositório
    if (error.message?.includes('Estoque insuficiente')) {
      await ctx.reply(`⚠️ ${error.message}`);
    } else {
      await ctx.reply(`❌ Erro ao registrar a venda: ${error.message ?? 'Erro desconhecido.'}`);
    }
  }
}
