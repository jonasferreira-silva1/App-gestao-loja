import { Context } from 'telegraf';

/**
 * Handler do comando /ajuda.
 * Lista todos os comandos disponíveis no sistema.
 */
export async function handleAjudaCommand(ctx: Context): Promise<void> {
  const mensagem =
    `📖 *Central de Ajuda - Loja de Semijoias* 💎\n\n` +
    `Aqui estão os comandos atualmente configurados:\n\n` +
    `⚙️ *Gerais:*\n` +
    `• /start - Inicia o bot e exibe mensagem de boas-vindas\n` +
    `• /ping - Verifica conectividade e saúde do sistema\n` +
    `• /ajuda - Exibe este menu de auxílio\n\n` +
    `🚀 *Em breve (Sprints 2 e 3):*\n` +
    `• /produtos - Lista produtos e custos cadastrados\n` +
    `• /cadastrar - Cadastra novo item no catálogo\n` +
    `• /fechamento - Relatório financeiro e margem de lucro do dia`;

  await ctx.replyWithMarkdownV2(
    mensagem.replace(/([._\-!#()+=])/g, '\\$1')
  );
}
