const cron = require('node-cron');
const { fetchComexUreiaNigeria } = require('./fetchers/comexstat');
const { fetchAllNews } = require('./fetchers/news');
const { saveSnapshot, getLatest, getPrevious } = require('./db');

async function runCollection() {
  console.log(`[${new Date().toISOString()}] Coletando snapshot...`);

  const comex = await fetchComexUreiaNigeria();
  const news = await fetchAllNews();

  saveSnapshot({
    created_at: new Date().toISOString(),
    comex_ok: comex.comex_ok ? 1 : 0,
    comex_period: comex.period || null,
    comex_kg: comex.kg || null,
    comex_usd: comex.usd || null,
    comex_raw: JSON.stringify(comex.raw || comex.error || null),
    news_count: news.count,
    news_signal_count: news.signalCount,
    news_json: JSON.stringify(news.items)
  });

  console.log(`[${new Date().toISOString()}] Snapshot salvo. Comex ok=${comex.comex_ok}, noticias=${news.count}, sinais=${news.signalCount}`);
}

function buildBriefing() {
  const latest = getLatest();
  if (!latest) {
    return { text: 'Ainda nao ha nenhum snapshot coletado. Rode /collect/run ou aguarde o cron semanal.', latest: null };
  }

  const previous = getPrevious();
  const newsItems = JSON.parse(latest.news_json || '[]');
  const signalItems = newsItems.filter(i => i.signal);

  let variação = 'sem comparativo ainda (primeiro snapshot)';
  let confianca = 'Baixo';

  if (previous) {
    const delta = latest.news_signal_count - previous.news_signal_count;
    if (delta > 0) {
      variação = `sinais de disrupcao subiram (${previous.news_signal_count} -> ${latest.news_signal_count})`;
      confianca = latest.comex_ok ? 'Medio' : 'Baixo';
    } else if (delta < 0) {
      variação = `sinais de disrupcao cairam (${previous.news_signal_count} -> ${latest.news_signal_count})`;
      confianca = 'Baixo';
    } else {
      variação = 'sem mudanca nos sinais de disrupcao desde o ultimo snapshot';
      confianca = 'Baixo';
    }
  }

  const linhas = [
    `Nitrogen Desk (teste) — Ureia Nigeria -> Brasil`,
    `Snapshot de ${latest.created_at}`,
    ``,
    `Comex Stat: ${latest.comex_ok ? `periodo ${latest.comex_period}, ${latest.comex_kg} kg, US$ ${latest.comex_usd}` : 'falhou (checar comexstat.mdic.gov.br manualmente)'}`,
    `Noticias monitoradas: ${latest.news_count} (sinais de possivel disrupcao: ${latest.news_signal_count})`,
    `Variacao: ${variação}`,
    ``,
    `Manchetes com sinal de disrupcao:`,
    ...(signalItems.length ? signalItems.map(i => `- ${i.title}`) : ['- nenhuma esta semana']),
    ``,
    `Confianca: ${confianca} (MVP de teste — cruzar manualmente com AIS/frete antes de qualquer decisao real)`
  ];

  return { text: linhas.join('\n'), latest, previous };
}

function startScheduler() {
  // Toda segunda-feira as 08:00 (horario do servidor Railway, geralmente UTC)
  cron.schedule('0 8 * * 1', runCollection);
  console.log('Scheduler semanal configurado (segundas 08:00).');
}

module.exports = { runCollection, buildBriefing, startScheduler };
