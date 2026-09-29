import { Context } from 'telegraf';
import { calcularFechamento, calcularFechamentoHoje, formatarFechamento } from '../../services/fechamentoService.js';

/**
 * Handler do comando /fechamento.
 *
 * Uso:
 *   /fechamento          → relatório de hoje
 *   /fechamento DD/MM/AAAA → relatório de uma data específica
 *
 * Exemplo:
 *   /fechamento 25/12/2024
 */
export async function handleFechamentoCommand(ctx: Context): Promise<void> {
  const texto = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const args = texto.replace(/^\/fechamento\s*/i, '').trim();

  let result;

  if (!args) {
    // Sem argumento: fechamento de hoje
    result = calcularFechamentoHoje();
  } else {
    // Com argumento: tenta parsear a data no formato DD/MM/AAAA ou YYYY-MM-DD
    const dataISO = parsearData(args);

    if (!dataISO) {
      await ctx.reply(
        '⚠️ Data inválida. Use o formato *DD/MM/AAAA*.\n\nExemplo: `/fechamento 25/12/2024`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    result = calcularFechamento(dataISO);
  }

  const mensagem = formatarFechamento(result);
  await ctx.reply(mensagem, { parse_mode: 'Markdown' });
}

/**
 * Converte uma data em formato DD/MM/AAAA ou YYYY-MM-DD para YYYY-MM-DD.
 * Retorna null se o formato for inválido.
 */
function parsearData(input: string): string | null {
  // Formato ISO já pronto
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return isValidDate(input) ? input : null;
  }

  // Formato brasileiro DD/MM/AAAA
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dia, mes, ano] = match;
  const iso = `${ano}-${mes}-${dia}`;
  return isValidDate(iso) ? iso : null;
}

/**
 * Verifica se uma string YYYY-MM-DD representa uma data real válida.
 */
function isValidDate(iso: string): boolean {
  const d = new Date(iso + 'T12:00:00');
  return !isNaN(d.getTime());
}
