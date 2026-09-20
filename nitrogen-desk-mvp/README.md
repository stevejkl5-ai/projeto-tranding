# Nitrogen Desk MVP — teste Nigéria → Brasil (ureia)

Teste inicial simples: um backend que coleta automaticamente, toda semana:
1. **Comex Stat** (API pública do MDIC) — volume/valor de ureia importada da Nigéria.
2. **Notícias** (Google News RSS, sem chave de API) — sobre a planta Dangote, o porto de Onne, congestionamento e Baltic Dry Index.

E gera um **briefing simples em texto** comparando a semana atual com a anterior.

## O que este MVP NÃO faz (de propósito, pra ficar simples)
- Não lê o valor numérico do Baltic Dry Index (não existe fonte gratuita confiável e estável) — em vez disso, conta **manchetes de notícia** que mencionam disrupção (greve, parada, congestionamento etc.) como um proxy simples.
- Não rastreia navios via AIS.
- Não envia alerta automático (WhatsApp/e-mail) — você acessa o briefing manualmente pela URL. Dá pra automatizar depois se o teste validar.

## Rodando local
```bash
npm install
npm start
```
Acesse `http://localhost:3000` para ver os endpoints.

## Endpoints
- `GET /` — lista de endpoints
- `GET /briefing` — último briefing em texto puro
- `GET /snapshot/latest` — último snapshot em JSON
- `GET /snapshot/history?limit=20` — histórico de snapshots
- `POST /collect/run` — força uma coleta agora (não precisa esperar a segunda-feira)

## Deploy no Railway
1. Suba esta pasta para um repositório no GitHub.
2. No Railway: **New Project → Deploy from GitHub repo**.
3. Railway detecta o `package.json` automaticamente e roda `npm start`. Não precisa configurar mais nada pra funcionar.
4. **Importante — persistência de dados:** por padrão, o SQLite (`data.sqlite`) some a cada novo deploy, porque o filesystem do Railway é efêmero. Se quiser manter o histórico entre deploys, adicione um **Volume** no serviço (Railway → seu serviço → Settings → Volumes), monte em `/data`, e defina a variável de ambiente `DB_PATH=/data/data.sqlite`.
5. Depois do deploy, acesse a URL pública que o Railway gera + `/briefing`.

## Avisos honestos sobre as fontes de dado
- O endpoint da API do Comex Stat usado aqui (`api-comexstat.mdic.gov.br/general`) é **best effort** — o formato de filtros dessa API não é bem documentado publicamente. Se `comex_ok` vier `false` no snapshot, o código não vai quebrar, mas você deve conferir manualmente em https://comexstat.mdic.gov.br/ e ajustar os códigos de NCM/país em `fetchers/comexstat.js` se necessário.
- Os códigos usados: NCM `31021010` (ureia), país `449` (Nigéria) — confirme esses códigos na tabela oficial do Comex Stat antes de confiar nos números.
- As notícias vêm do Google News RSS, que é público e gratuito, mas pode incluir ruído (notícia irrelevante que só cita a palavra-chave por acaso). É um teste, não um sistema à prova de falhas.

## Como validar o teste (o que realmente importa)
Depois de rodar por 2-3 semanas, a pergunta não é "o código funciona" (isso já testamos) — é: **algum contato seu que compra fertilizante mudaria de decisão ao ler esse `/briefing`?** Se sim, o próximo passo é automatizar o envio (WhatsApp/e-mail) e considerar cobrar. Se não, ajuste as fontes ou o formato antes de investir mais tempo.
