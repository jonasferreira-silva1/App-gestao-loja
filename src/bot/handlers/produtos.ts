import { Context } from 'telegraf';
import { listAllProdutos } from '../../database/repositories/produtoRepository.js';

/**
 * Handler do comando /produtos.
 * Lista todos os produtos cadastrados no catálogo com custo, preço e estoque.
 */
export async function handleProdutosCommand(ctx: Context): Promise<void> {
  try {
    const produtos = listAllProdutos();

    if (produtos.length === 0) {
      await ctx.reply(
        '📦 Nenhum produto cadastrado ainda.\n\n' +
          'Use /cadastrar para adicionar produtos ao catálogo.\n\n' +
          '*Exemplo:* `/cadastrar colar dourado / 12.00 / 45.00 / 20`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const linhas = produtos.map((p, i) => {
      const margem = p.preco_venda_padrao > 0
        ? (((p.preco_venda_padrao - p.custo_unitario) / p.preco_venda_padrao) * 100).toFixed(1)
        : '0.0';

      const estoqueEmoji = p.estoque_atual === 0 ? '🔴' : p.estoque_atual <= 3 ? '🟡' : '🟢';

      return (
        `*${i + 1}. ${p.nome}* (ID: ${p.id})\n` +
        `   💰 Custo: R$ ${p.custo_unitario.toFixed(2)} | 🏷️ Venda: R$ ${p.preco_venda_padrao.toFixed(2)} | 📈 Margem: ${margem}%\n` +
        `   ${estoqueEmoji} Estoque: ${p.estoque_atual} un.`
      );
    });

    const header = `📦 *Catálogo de Produtos — Loja de Semijoias* 💎\n\n`;
    const footer = `\n\n_Total: ${produtos.length} produto(s) cadastrado(s)._`;

    // Telegram tem limite de 4096 chars por mensagem; quebramos se necessário
    const corpo = linhas.join('\n\n');
    const mensagemCompleta = header + corpo + footer;

    if (mensagemCompleta.length <= 4000) {
      await ctx.reply(mensagemCompleta, { parse_mode: 'Markdown' });
    } else {
      // Envia em blocos para catálogos grandes
      await ctx.reply(header + `_(${produtos.length} produtos encontrados — exibindo em partes)_`, {
        parse_mode: 'Markdown',
      });
      for (let i = 0; i < linhas.length; i += 10) {
        const bloco = linhas.slice(i, i + 10).join('\n\n');
        await ctx.reply(bloco, { parse_mode: 'Markdown' });
      }
    }
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    await ctx.reply('❌ Não foi possível listar os produtos. Tente novamente em instantes.');
  }
}
