// Busca noticias publicas via Google News RSS (sem necessidade de API key/paga).
// Cobre os "pontos de corte" da rota Nigeria -> Brasil: planta (Dangote), porto (Onne),
// frete (Baltic Dry Index) e rota geral.

const { XMLParser } = require('fast-xml-parser');

const QUERIES = [
  'Dangote urea plant',
  'Onne port Nigeria congestion',
  'Baltic Dry Index',
  'ureia Nigeria Brasil importacao'
];

// Palavras que sinalizam possivel impacto no preco/oferta (heuristica simples, nao definitiva)
const SIGNAL_KEYWORDS = [
  'strike', 'greve', 'shutdown', 'parada', 'maintenance', 'manutenção', 'manutencao',
  'outage', 'delay', 'atraso', 'congestion', 'congestionamento', 'sanction', 'sanção',
  'sancao', 'attack', 'ataque', 'blockade', 'bloqueio', 'surge', 'disparou', 'spike'
];

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchNewsForQuery(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 5).map(it => ({
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      query
    }));
  } catch (err) {
    return [];
  }
}

async function fetchAllNews() {
  const results = await Promise.all(QUERIES.map(fetchNewsForQuery));
  const flat = results.flat();

  const withSignal = flat.map(item => ({
    ...item,
    signal: SIGNAL_KEYWORDS.some(kw => (item.title || '').toLowerCase().includes(kw))
  }));

  return {
    items: withSignal,
    count: withSignal.length,
    signalCount: withSignal.filter(i => i.signal).length
  };
}

module.exports = { fetchAllNews };
