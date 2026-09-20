const express = require('express');
const { getLatest, getHistory } = require('./db');
const { runCollection, buildBriefing, startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    service: 'nitrogen-desk-mvp',
    rota: 'Nigeria -> Brasil (ureia)',
    endpoints: [
      'GET /briefing        -> ultimo briefing em texto',
      'GET /snapshot/latest -> ultimo snapshot em JSON',
      'GET /snapshot/history -> ultimos snapshots',
      'POST /collect/run    -> forca uma coleta agora (util para testar)'
    ]
  });
});

app.get('/briefing', (req, res) => {
  const { text } = buildBriefing();
  res.type('text/plain').send(text);
});

app.get('/snapshot/latest', (req, res) => {
  res.json(getLatest() || { message: 'nenhum snapshot ainda' });
});

app.get('/snapshot/history', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json(getHistory(limit));
});

app.post('/collect/run', async (req, res) => {
  try {
    await runCollection();
    res.json({ ok: true, message: 'Coleta executada. Veja /briefing ou /snapshot/latest.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Nitrogen Desk MVP rodando na porta ${PORT}`);
  startScheduler();
});
