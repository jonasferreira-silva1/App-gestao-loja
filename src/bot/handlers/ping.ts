import { Context } from 'telegraf';
import { getDatabase } from '../../database/connection.js';

/**
 * Lógica pura de processamento do comando /ping.
 * Retorna o texto formatado para facilitar testes unitários sem acoplamento a rede.
 */
export function executePingLogic(): string {
  let dbStatus = 'Desconectado';

  try {
    const db = getDatabase();
    if (db && db.open) {
      dbStatus = 'Conectado (SQLite)';
    }
  } catch (error) {
    dbStatus = 'Erro na Conexão';
  }

  return (
    `🏓 *Pong!*\n\n` +
    `🤖 *Bot da Loja de Semijoias:* Operacional\n` +
    `🗄️ *Banco de Dados:* ${dbStatus}\n` +
    `⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR')}`
  );
}

/**
 * Handler do Telegram Bot para o comando /ping.
 */
export async function handlePingCommand(ctx: Context): Promise<void> {
  const message = executePingLogic();
  await ctx.replyWithMarkdownV2(
    message.replace(/([._\-!#()+=])/g, '\\$1') // Escapa caracteres reservados para MarkdownV2
  );
}
