import { describe, expect, it, vi } from 'vitest';
import { executePingLogic, handlePingCommand } from '../src/bot/handlers/ping.js';

describe('Bot Command: /ping', () => {
  it('deve retornar mensagem contendo status operacional e conectividade do banco', () => {
    const output = executePingLogic();

    expect(output).toContain('Pong!');
    expect(output).toContain('Bot da Loja de Semijoias');
    expect(output).toContain('Operacional');
  });

  it('deve chamar ctx.replyWithMarkdownV2 ao executar handlePingCommand', async () => {
    // Contexto mockado do Telegraf
    const mockCtx: any = {
      replyWithMarkdownV2: vi.fn().mockResolvedValue(true),
    };

    await handlePingCommand(mockCtx);

    expect(mockCtx.replyWithMarkdownV2).toHaveBeenCalledTimes(1);
    expect(mockCtx.replyWithMarkdownV2).toHaveBeenCalledWith(
      expect.stringContaining('Pong')
    );
  });
});
