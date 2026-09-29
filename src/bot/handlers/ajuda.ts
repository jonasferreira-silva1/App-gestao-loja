import { Context } from 'telegraf';

/**
 * Handler do comando /ajuda.
 * Lista todos os comandos disponíveis no sistema.
 */
export async function handleAjudaCommand(ctx: Context): Promise<void> {
  const mensagem =
    `📖 *Central de Ajuda - Loja de Semijoias* 💎\n\n` +
    `Aqui estão os comandos disponíveis:\n\n` +
    `⚙️ *Gerais:*\n` +
    `• /start - Inicia o bot e exibe mensagem de boas-vindas\n` +
    `• /ping - Verifica conectividade e saúde do sistema\n` +
    `• /ajuda - Exibe este menu de auxílio\n\n` +
    `📦 *Catálogo & Estoque:*\n` +
    `• /produtos - Lista todos os produtos, custos e estoque\n` +
    `• /cadastrar - Cadastra novo item no catálogo\n` +
    `  _Exemplo: /cadastrar colar dourado / 12.00 / 45.00 / 20_\n\n` +
    `💸 *Registro de Vendas:*\n` +
    `• Envie mensagem no formato:\n` +
    `  _venda / colar dourado / 45 / pix_\n` +
    `  _venda / anel / 35 / cartão / 2_ (com quantidade)\n\n` +
    `📊 *Relatórios:*\n` +
    `• /fechamento - Relatório financeiro do dia (lucro, margem, campeão)\n` +
    `  _/fechamento 25/12/2024_ (data específica)\n\n` +
    `🚀 *Em breve (Sprint 4 — OCR):*\n` +
    `• Envie foto de Nota Fiscal para extração automática de custos`;

  await ctx.replyWithMarkdownV2(
    mensagem.replace(/([._\-!#()+=])/g, '\\$1')
  );
}
