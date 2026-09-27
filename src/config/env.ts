import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Esquema de validação rigoroso para as variáveis de ambiente usando Zod.
 * Garante que a aplicação falhe imediatamente (Fail-Fast) no arranque caso
 * alguma configuração essencial esteja ausente ou malformatada.
 */
const envSchema = z.object({
  /** Token de acesso do Bot do Telegram gerado pelo BotFather */
  TELEGRAM_BOT_TOKEN: z
    .string({
      required_error: 'A variável TELEGRAM_BOT_TOKEN é obrigatória.',
    })
    .min(1, 'A variável TELEGRAM_BOT_TOKEN não pode estar vazia.'),

  /** Caminho do arquivo do banco de dados SQLite */
  DB_PATH: z
    .string()
    .default('./data/database.sqlite')
    .transform((val) => path.resolve(process.cwd(), val)),

  /** Ambiente de execução do sistema */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Tenta validar as variáveis de ambiente ativas no sistema
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Erro crítico: Variáveis de ambiente inválidas ou ausentes!');
  console.error(_env.error.format());
  throw new Error('Falha ao carregar as configurações de ambiente.');
}

/**
 * Objeto de configurações de ambiente validado e tipado.
 */
export const env = _env.data;
