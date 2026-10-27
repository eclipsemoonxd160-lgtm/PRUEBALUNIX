const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ENV_FILE = path.join(__dirname, '.env');
if (!fs.existsSync(ENV_FILE)) {
    try { fs.copyFileSync(path.join(__dirname, '.env.example'), ENV_FILE); } catch {}
}
loadEnv(ENV_FILE);

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

function loadEnv(file) {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const i = trimmed.indexOf('=');
        if (i === -1) continue;
        const key = trimmed.slice(0, i).trim();
        let value = trimmed.slice(i + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
    }
}

function json(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
}

function cleanText(value, max = 300) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function classifyQuery(q) {
    const text = q.toLowerCase();
    const video = /\b(video|videos|youtube|tutorial|tutoriales|cómo hacer|como hacer|paso a paso|documental)\b/.test(text);
    const news = /\b(hoy|actualidad|noticias|noticia|últimas|ultimas|2026|reciente|recientes)\b/.test(text);
    const academic = /\b(qué es|que es|definición|definicion|explica|explicación|explicacion|investigación|investigacion|tarea|colegio|universidad|historia|biología|biologia|química|quimica|física|fisica|matemáticas|matematicas)\b/.test(text);
    return { video, news, academic };
}

async function braveSearch(q, offset = 0) {
    if (!process.env.BRAVE_API_KEY) return { items: [], more: false, configured: false };
    const params = new URLSearchParams({
        q,
        country: 'CO',
        search_lang: 'es',
        ui_lang: 'es-CO',
        count: '20',
        offset: String(Math.max(0, Math.min(Number(offset) || 0, 9))),
        safesearch: 'strict',
        extra_snippets: 'true'
    });
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: {
            Accept: 'application/json',
            'X-Subscription-Token': process.env.BRAVE_API_KEY
        }
    });
    if (!response.ok) throw new Error(`Brave Search ${response.status}`);
    const data = await response.json();
    const items = (data.web?.results || []).map(item => ({
        title: cleanText(item.title, 180),
        url: item.url,
        description: cleanText(item.description, 360),
        extraSnippets: Array.isArray(item.extra_snippets) ? item.extra_snippets.map(x => cleanText(x, 300)).slice(0, 3) : [],
        source: (() => { try { return new URL(item.url).hostname.replace(/^www\./, ''); } catch { return 'internet'; } })()
    }));
    return {
        items,
        more: Boolean(data.query?.more_results_available),
        configured: true,
        engine: 'Brave Search'
    };
}

async function youtubeSearch(q, pageToken = '') {
    if (!process.env.YOUTUBE_API_KEY) return { videos: [], nextPageToken: '', configured: false };
    const params = new URLSearchParams({
        part: 'snippet', q, type: 'video', maxResults: '12', order: 'relevance',
        regionCode: 'CO', relevanceLanguage: 'es', videoEmbeddable: 'true', safeSearch: 'strict',
        key: process.env.YOUTUBE_API_KEY
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`YouTube ${response.status}`);
    const data = await response.json();
    return { videos: data.items || [], nextPageToken: data.nextPageToken || '', configured: true };
}

async function wikipediaSearch(q, offset = 0) {
    const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: q, srlimit: '5', sroffset: String(Math.max(0, Number(offset) || 0)), format: 'json', origin: '*' });
    const response = await fetch(`https://es.wikipedia.org/w/api.php?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const data = await response.json();
    return { items: data?.query?.search || [], configured: true };
}

async function googleSearch(q, start = 1) {
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX) return { items: [], nextStart: null, configured: false };
    const params = new URLSearchParams({ key: process.env.GOOGLE_API_KEY, cx: process.env.GOOGLE_CX, q, start: String(start), num: '10', safe: 'active', hl: 'es', gl: 'co' });
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Google ${response.status}`);
    const data = await response.json();
    return { items: data.items || [], nextStart: data.queries?.nextPage?.[0]?.startIndex || null, configured: true };
}

async function apiSearch(url, res) {
    const q = cleanText(url.searchParams.get('q'), 600);
    if (!q) return json(res, 400, { error: 'Falta la consulta.' });
    const offset = Number(url.searchParams.get('offset') || 0);
    const googleStart = Number(url.searchParams.get('googleStart') || 1);
    const mode = classifyQuery(q);

    const [webResp, wikiResp, youtubeResp, googleResp] = await Promise.allSettled([
        braveSearch(q, offset),
        wikipediaSearch(q, Number(url.searchParams.get('wikiOffset') || 0)),
        youtubeSearch(q),
        googleSearch(q, googleStart)
    ]);

    const web = webResp.status === 'fulfilled' ? webResp.value : { items: [], more: false, configured: Boolean(process.env.BRAVE_API_KEY) };
    const wiki = wikiResp.status === 'fulfilled' ? wikiResp.value : { items: [] };
    const youtube = youtubeResp.status === 'fulfilled' ? youtubeResp.value : { videos: [], nextPageToken: '', configured: false };
    const google = googleResp.status === 'fulfilled' ? googleResp.value : { items: [], nextStart: null, configured: false };

    // Brave is the main web source. Google CSE is an optional second web index.
    const webItems = web.items.length ? web.items : google.items.map(item => ({
        title: item.title,
        url: item.link,
        description: item.snippet,
        extraSnippets: [],
        source: item.displayLink || 'internet'
    }));

    json(res, 200, {
        query: q,
        intent: mode,
        sources: {
            web: webItems,
            webMore: web.more,
            webConfigured: web.configured || google.configured,
            wikipedia: wiki.items,
            youtube: youtube.videos,
            youtubeNextPageToken: youtube.nextPageToken,
            youtubeConfigured: youtube.configured,
            googleConfigured: google.configured,
            googleNextStart: google.nextStart
        }
    });
}

async function apiYoutube(url, res) {
    const q = cleanText(url.searchParams.get('q'), 600);
    if (!q) return json(res, 400, { error: 'Falta la consulta.' });
    try {
        json(res, 200, await youtubeSearch(q, url.searchParams.get('pageToken') || ''));
    } catch (error) {
        json(res, 502, { error: 'No se pudo consultar YouTube.' });
    }
}

function safePath(requestPath) {
    let pathname;
    try { pathname = decodeURIComponent(requestPath); } catch { return null; }
    if (pathname === '/') pathname = '/index.html';
    const full = path.normalize(path.join(ROOT, pathname));
    if (!full.startsWith(ROOT + path.sep) && full !== ROOT) return null;
    return full;
}

function serveStatic(req, res) {
    const file = safePath(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
    if (!file) return json(res, 403, { error: 'Acceso denegado.' });
    fs.stat(file, (err, stat) => {
        if (err || !stat.isFile()) return json(res, 404, { error: 'Archivo no encontrado.' });
        const ext = path.extname(file).toLowerCase();
        const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (req.method === 'GET' && url.pathname === '/api/health') {
            return json(res, 200, { ok: true, brave: Boolean(process.env.BRAVE_API_KEY), youtube: Boolean(process.env.YOUTUBE_API_KEY), google: Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX) });
        }
        if (req.method === 'GET' && url.pathname === '/api/search') return await apiSearch(url, res);
        if (req.method === 'GET' && url.pathname === '/api/youtube') return await apiYoutube(url, res);
        if (req.method === 'GET') return serveStatic(req, res);
        return json(res, 405, { error: 'Método no permitido.' });
    } catch (error) {
        console.error(error);
        json(res, 500, { error: 'Error interno del servidor.' });
    }
});

server.listen(PORT, () => {
    console.log(`\nLiterary Universe ejecutándose en http://localhost:${PORT}`);
    console.log(`Brave Search: ${process.env.BRAVE_API_KEY ? 'configurado' : 'sin clave'}`);
    console.log(`YouTube: ${process.env.YOUTUBE_API_KEY ? 'configurado' : 'sin clave'}`);
    console.log(`Google CSE opcional: ${process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX ? 'configurado' : 'sin clave'}`);
    console.log('Presiona Ctrl+C para detener.\n');
});
