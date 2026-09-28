import { normalizeString } from './stringNormalizer.js';

/**
 * Resultado do parsing de uma mensagem de venda em texto livre.
 */
export interface VendaParseResult {
  nomeProduto: string;
  valorVenda: number;
  formaPagamento: string;
  quantidade: number;
}

/**
 * Formas de pagamento aceitas pelo sistema e seus aliases reconhecidos.
 */
const FORMAS_PAGAMENTO: Record<string, string> = {
  pix: 'pix',
  dinheiro: 'dinheiro',
  especie: 'dinheiro',
  espécie: 'dinheiro',
  debito: 'débito',
  débito: 'débito',
  cartao: 'crédito',
  cartão: 'crédito',
  credito: 'crédito',
  crédito: 'crédito',
  'cartao de credito': 'crédito',
  'cartão de crédito': 'crédito',
  'cartao de debito': 'débito',
  'cartão de débito': 'débito',
};

/**
 * Realiza o parse de uma mensagem de venda no formato:
 * `venda / <produto> / <valor> / <pagamento>`
 * ou com quantidade: `venda / <produto> / <valor> / <pagamento> / <qtd>`
 *
 * @param mensagem Texto bruto enviado pelo usuário
 * @returns VendaParseResult com os dados extraídos ou null se o formato for inválido
 */
export function parseVendaMessage(mensagem: string): VendaParseResult | null {
  // Normaliza e divide por '/'
  const partes = mensagem
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  // Formato mínimo: ["venda", "produto", "valor", "pagamento"]
  if (partes.length < 4) return null;

  const [prefixo, nomeProduto, valorRaw, pagamentoRaw, quantidadeRaw] = partes;

  // Verifica se começa com "venda"
  if (normalizeString(prefixo) !== 'venda') return null;

  // Valida e parseia o valor (rejeita explicitamente valores negativos antes de limpar)
  const valorNormalizado = valorRaw.trim().replace(',', '.');
  if (valorNormalizado.startsWith('-')) return null;
  const valorStr = valorNormalizado.replace(/[^\d.]/g, '');
  const valorVenda = parseFloat(valorStr);
  if (isNaN(valorVenda) || valorVenda <= 0) return null;

  // Normaliza a forma de pagamento
  const pagamentoNorm = normalizeString(pagamentoRaw);
  const formaPagamento = FORMAS_PAGAMENTO[pagamentoNorm] ?? pagamentoNorm;

  // Quantidade opcional (padrão: 1)
  let quantidade = 1;
  if (quantidadeRaw) {
    const qtdNum = parseInt(quantidadeRaw, 10);
    if (!isNaN(qtdNum) && qtdNum > 0) {
      quantidade = qtdNum;
    }
  }

  return {
    nomeProduto: nomeProduto.trim(),
    valorVenda,
    formaPagamento,
    quantidade,
  };
}
