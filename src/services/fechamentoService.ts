import { listVendasByDate, listVendasHoje } from '../database/repositories/vendaRepository.js';
import { ISale } from '../types/sale.js';

/**
 * Resultado consolidado do fechamento de um período.
 */
export interface FechamentoResult {
  data: string;
  totalVendas: number;
  faturamentoBruto: number;
  custoTotal: number;
  lucroBruto: number;
  margemPercent: number;
  produtoCampeao: string | null;
  produtoCampeaoQtd: number;
  formasPagamento: Record<string, number>;
  vendas: ISale[];
}

/**
 * Calcula o relatório de fechamento para uma data específica (formato YYYY-MM-DD).
 */
export function calcularFechamento(data: string): FechamentoResult {
  const vendas = listVendasByDate(data);

  if (vendas.length === 0) {
    return {
      data,
      totalVendas: 0,
      faturamentoBruto: 0,
      custoTotal: 0,
      lucroBruto: 0,
      margemPercent: 0,
      produtoCampeao: null,
      produtoCampeaoQtd: 0,
      formasPagamento: {},
      vendas: [],
    };
  }

  // Faturamento bruto = soma dos valores de venda
  const faturamentoBruto = vendas.reduce((acc, v) => acc + v.valor_venda, 0);

  // Custo total = custo unitário × quantidade de cada venda
  const custoTotal = vendas.reduce((acc, v) => acc + (v.custo_unitario ?? 0) * v.quantidade, 0);

  const lucroBruto = faturamentoBruto - custoTotal;
  const margemPercent = faturamentoBruto > 0 ? (lucroBruto / faturamentoBruto) * 100 : 0;

  // Produto campeão: maior quantidade total vendida no dia
  const qtdPorProduto: Record<string, number> = {};
  for (const v of vendas) {
    const nome = v.nome_produto ?? `Produto #${v.produto_id}`;
    qtdPorProduto[nome] = (qtdPorProduto[nome] ?? 0) + v.quantidade;
  }

  const [produtoCampeao, produtoCampeaoQtd] = Object.entries(qtdPorProduto).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ['', 0]
  );

  // Totais por forma de pagamento
  const formasPagamento: Record<string, number> = {};
  for (const v of vendas) {
    const forma = v.forma_pagamento;
    formasPagamento[forma] = (formasPagamento[forma] ?? 0) + v.valor_venda;
  }

  return {
    data,
    totalVendas: vendas.length,
    faturamentoBruto,
    custoTotal,
    lucroBruto,
    margemPercent,
    produtoCampeao: produtoCampeao || null,
    produtoCampeaoQtd,
    formasPagamento,
    vendas,
  };
}

/**
 * Calcula o fechamento do dia atual.
 */
export function calcularFechamentoHoje(): FechamentoResult {
  const hoje = new Date().toISOString().split('T')[0];
  return calcularFechamento(hoje);
}

/**
 * Formata um FechamentoResult em texto rico para exibição no Telegram.
 */
export function formatarFechamento(result: FechamentoResult): string {
  const dataFormatada = new Date(result.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (result.totalVendas === 0) {
    return (
      `📊 *Fechamento do Dia — ${dataFormatada}*\n\n` +
      `😔 Nenhuma venda registrada neste dia.\n\n` +
      `Use o formato abaixo para registrar vendas:\n` +
      `\`venda / colar dourado / 45 / pix\``
    );
  }

  const lucroEmoji = result.lucroBruto >= 0 ? '📈' : '📉';
  const margemEmoji = result.margemPercent >= 40 ? '🟢' : result.margemPercent >= 20 ? '🟡' : '🔴';

  // Detalhamento por forma de pagamento
  const linhasPagamento = Object.entries(result.formasPagamento)
    .sort((a, b) => b[1] - a[1])
    .map(([forma, total]) => `   • ${forma}: R$ ${total.toFixed(2)}`)
    .join('\n');

  return (
    `📊 *Fechamento do Dia — ${dataFormatada}* 💎\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍️ *Vendas realizadas:* ${result.totalVendas}\n` +
    `💵 *Faturamento bruto:* R$ ${result.faturamentoBruto.toFixed(2)}\n` +
    `📦 *Custo das peças:* R$ ${result.custoTotal.toFixed(2)}\n` +
    `${lucroEmoji} *Lucro bruto:* R$ ${result.lucroBruto.toFixed(2)}\n` +
    `${margemEmoji} *Margem:* ${result.margemPercent.toFixed(1)}%\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 *Produto campeão:* ${result.produtoCampeao} (${result.produtoCampeaoQtd} un.)\n\n` +
    `💳 *Recebimentos por forma de pagamento:*\n${linhasPagamento}`
  );
}
