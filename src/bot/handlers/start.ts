import { Context } from 'telegraf';

/**
 * Handler do comando /start.
 * Apresenta o assistente e explica como interagir com o bot.
 */
export async function handleStartCommand(ctx: Context): Promise<void> {
  const nomeUsuario = ctx.from?.first_name || 'Gestor(a)';

  const mensagem =
    `✨ *Olá, ${nomeUsuario}! Bem-vindo(a) ao Gestor da Loja de Semijoias!* 💎\n\n` +
    `Eu sou seu assistente financeiro e de estoque. Comigo você registra vendas rapidamente e consulta lucros sem complicações.\n\n` +
    `📌 *Comandos Rápidos:*\n` +
    `• /ping - Verifica o status do bot e do banco de dados\n` +
    `• /ajuda - Exibe a lista de comandos e instruções\n\n` +
    `Nas próximas atualizações você poderá registrar vendas enviando mensagens como:\n` +
    `\`venda / colar dourado / 45 / pix\``;

  await ctx.replyWithMarkdownV2(
    mensagem.replace(/([._\-!#()+=])/g, '\\$1')
  );
}
