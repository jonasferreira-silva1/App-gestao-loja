import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';
import { handleAjudaCommand } from './handlers/ajuda.js';
import { handleCadastrarCommand } from './handlers/cadastrar.js';
import { handlePingCommand } from './handlers/ping.js';
import { handleProdutosCommand } from './handlers/produtos.js';
import { handleStartCommand } from './handlers/start.js';
import { handleVendaMessage } from './handlers/venda.js';

let botInstance: Telegraf | null = null;

/**
 * Cria e configura a instância do Bot do Telegram com seus handlers de comando.
 */
export function createBot(): Telegraf {
  if (botInstance) {
    return botInstance;
  }

  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  // Registro dos comandos do Bot
  bot.command('start', handleStartCommand);
  bot.command('ping', handlePingCommand);
  bot.command('ajuda', handleAjudaCommand);
  bot.command('cadastrar', handleCadastrarCommand);
  bot.command('produtos', handleProdutosCommand);

  // Handler de mensagens de texto livre (registros de venda)
  bot.on('text', handleVendaMessage);

  // Captura erros globais no Bot
  bot.catch((err, ctx) => {
    console.error(`❌ Erro no processamento da mensagem do usuário ${ctx.from?.id}:`, err);
    ctx.reply('⚠️ Ocorreu um erro interno ao processar seu comando. Tente novamente em instantes.');
  });

  botInstance = bot;
  return bot;
}

/**
 * Interrompe a execução do Bot graciosamente.
 */
export function stopBot(): void {
  if (botInstance) {
    botInstance.stop('SIGTERM');
    botInstance = null;
  }
}
