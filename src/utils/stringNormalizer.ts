/**
 * Normaliza um texto removendo acentos, caracteres especiais extras,
 * espaços duplicados e convertendo para minúsculas.
 * 
 * Exemplo: "Colar Ouro 18k!" -> "colar ouro 18k"
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentuação
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Substitui múltiplos espaços por um único espaço
}
