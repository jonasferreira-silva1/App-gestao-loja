import { createBot, stopBot } from './bot/bot.js';
import { env } from './config/env.js';
import { closeDatabase, initDatabase } from './database/connection.js';

/**
 * Função principal de inicialização da aplicação (Bootstrap).
 */
async function bootstrap(): Promise<void> {
  console.log('🚀 Inicializando o App de Gestão da Loja de Semijoias...');
  console.log(`📌 Ambiente: ${env.NODE_ENV}`);
  console.log(`🗄️  Caminho do Banco SQLite: ${env.DB_PATH}`);

  // 1. Inicializa o Banco de Dados e verifica a integridade das tabelas
  try {
    initDatabase();
    console.log('✅ Banco de Dados SQLite inicializado e tabelas migradas com sucesso.');
  } catch (error) {
    console.error('❌ Erro fatal ao conectar ou inicializar o banco de dados:', error);
    process.exit(1);
  }

  // 2. Cria e lança o Bot do Telegram
  const bot = createBot();

  // Em modo de testes automatizados ou desenvolvimento sem token real, apenas logamos
  if (env.NODE_ENV === 'test') {
    console.log('🧪 Modo de testes detectado. Bot não iniciará escuta no Telegram.');
    return;
  }

  try {
    await bot.launch();
    console.log('🤖 Telegram Bot iniciado e aguardando comandos! (Envie /ping no Telegram)');
  } catch (error) {
    console.error('⚠️ Não foi possível conectar ao Telegram Bot. Verifique seu TELEGRAM_BOT_TOKEN.');
    console.error('ℹ️ Dica: Em ambiente de desenvolvimento local sem token real, configure um token válido via BotFather no arquivo .env');
  }

  /**
   * Configuração de Graceful Shutdown (Desligamento Gracioso).
   * Garante que conexões com banco e bot sejam encerradas com segurança ao parar o container ou processo.
   */
  const shutdown = (signal: string) => {
    console.log(`\n🛑 Sinal ${signal} recebido. Encerrando serviços com segurança...`);
    stopBot();
    closeDatabase();
    console.log('✅ Conexão com SQLite e Telegram Bot encerradas. Até logo!');
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

// Executa a inicialização do sistema
bootstrap().catch((err) => {
  console.error('💥 Erro não tratado durante o boot da aplicação:', err);
  process.exit(1);
});
