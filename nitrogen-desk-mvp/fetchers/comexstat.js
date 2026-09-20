// Busca dados de importacao de ureia (NCM 31021010) da Nigeria no Comex Stat (API publica do MDIC).
//
// AVISO IMPORTANTE: a API do Comex Stat nao tem documentacao publica estavel em ingles/portugues
// e o formato de filtros pode mudar. Este fetcher é "best effort": ele tenta a chamada, e se o
// formato de resposta mudou ou o request falha, retorna comex_ok=false em vez de quebrar o processo.
// Antes de confiar nos numeros, confira manualmente em https://comexstat.mdic.gov.br/
//
// Codigo NCM da ureia: 3102.10.10 (Ureia, mesmo em solucao aquosa)
// Codigo de pais da Nigeria no Comex Stat: 449 (confirmar na tabela oficial de paises)

const COMEXSTAT_URL = 'https://api-comexstat.mdic.gov.br/general';
const NCM_UREIA = '31021010';
const PAIS_NIGERIA = '528';

async function fetchComexUreiaNigeria() {
  const monthsBack = 3; // tenta os ultimos meses, pega o mais recente disponivel
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

  const body = {
    flow: 'import',
    monthDetail: true,
    period: { from: start, to: end },
    filters: [
      { filter: 'ncm', values: [NCM_UREIA] },
      { filter: 'country', values: [PAIS_NIGERIA] }
    ],
    details: ['country', 'ncm'],
    metrics: ['metricFOB', 'metricKG']
  };

  try {
    const res = await fetch(COMEXSTAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      return { comex_ok: false, error: `HTTP ${res.status}`, raw: null };
    }

    const json = await res.json();
    const rows = json?.data?.list || json?.data || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return { comex_ok: false, error: 'Resposta sem linhas de dados (verificar filtros/codigos)', raw: json };
    }

    // Pega a linha mais recente (assume ordenacao por periodo na resposta; senao, precisa ajustar)
    const latest = rows[rows.length - 1];

    return {
      comex_ok: true,
      period: latest.year && latest.monthNumber ? `${latest.year}-${String(latest.monthNumber).padStart(2, '0')}` : (latest.period || 'desconhecido'),
      kg: Number(latest.metricKG || latest.kg || 0),
      usd: Number(latest.metricFOB || latest.usd || 0),
      raw: json
    };
  } catch (err) {
    return { comex_ok: false, error: err.message, raw: null };
  }
}

module.exports = { fetchComexUreiaNigeria };
