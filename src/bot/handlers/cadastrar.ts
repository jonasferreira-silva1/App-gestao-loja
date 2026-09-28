import { Context } from 'telegraf';
import { createProduto, findProdutoByNome } from '../../database/repositories/produtoRepository.js';

/**
 * Handler do comando /cadastrar.
 *
 * Formatos aceitos:
 *   /cadastrar <nome> / <custo> / <preco_venda>
 *   /cadastrar <nome> / <custo> / <preco_venda> / <estoque_inicial>
 *
 * Exemplo:
 *   /cadastrar colar dourado / 12.00 / 45.00 / 20
 */
export async function handleCadastrarCommand(ctx: Context): Promise<void> {
  const texto = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  // Remove o prefixo /cadastrar e obtém os argumentos
  const args = texto.replace(/^\/cadastrar\s*/i, '').trim();

  if (!args) {
    await ctx.reply(
      '⚠️ *Uso correto do comando /cadastrar:*\n\n' +
        '`/cadastrar <nome> / <custo> / <preço venda> / <estoque>`\n\n' +
        '*Exemplo:*\n' +
        '`/cadastrar colar dourado / 12.00 / 45.00 / 20`\n\n' +
        '_O estoque inicial é opcional (padrão: 0)._',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const partes = args.split('/').map((p) => p.trim()).filter(Boolean);

  if (partes.length < 3) {
    await ctx.reply(
      '❌ Formato inválido. Informe pelo menos *nome*, *custo* e *preço de venda*.\n\n' +
        'Exemplo: `/cadastrar anel folheado / 8.00 / 25.00`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const [nomeRaw, custoRaw, precoRaw, estoqueRaw] = partes;

  const custo = parseFloat(custoRaw.replace(',', '.'));
  const preco = parseFloat(precoRaw.replace(',', '.'));

  if (isNaN(custo) || custo < 0) {
    await ctx.reply('❌ O *custo unitário* deve ser um número válido e não negativo.', { parse_mode: 'Markdown' });
    return;
  }

  if (isNaN(preco) || preco <= 0) {
    await ctx.reply('❌ O *preço de venda* deve ser um número válido e maior que zero.', { parse_mode: 'Markdown' });
    return;
  }

  const estoqueInicial = estoqueRaw ? parseInt(estoqueRaw, 10) : 0;

  try {
    // Verifica se já existe produto com mesmo nome
    const existente = findProdutoByNome(nomeRaw);
    if (existente) {
      await ctx.reply(
        `⚠️ Já existe um produto com o nome *"${existente.nome}"* no catálogo (ID: ${existente.id}).\n` +
          `Use um nome diferente ou consulte /produtos para ver o catálogo atual.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const produto = createProduto({
      nome: nomeRaw,
      custo_unitario: custo,
      preco_venda_padrao: preco,
      estoque_inicial: isNaN(estoqueInicial) ? 0 : estoqueInicial,
    });

    const margem = preco > 0 ? (((preco - custo) / preco) * 100).toFixed(1) : '0.0';

    await ctx.reply(
      `✅ *Produto cadastrado com sucesso!* 💎\n\n` +
        `📦 *Nome:* ${produto.nome}\n` +
        `💰 *Custo:* R$ ${produto.custo_unitario.toFixed(2)}\n` +
        `🏷️ *Preço de Venda:* R$ ${produto.preco_venda_padrao.toFixed(2)}\n` +
        `📈 *Margem:* ${margem}%\n` +
        `🗃️ *Estoque inicial:* ${produto.estoque_atual} un.\n` +
        `🆔 *ID:* ${produto.id}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    await ctx.reply(`❌ Erro ao cadastrar o produto: ${error.message ?? 'Erro desconhecido.'}`);
  }
}
