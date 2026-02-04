const axios = require('axios');
const http = require('http'); // Novo módulo para criar o servidor

// --- CONFIGURAÇÕES ---
const TELEGRAM_TOKEN = '8061555247:AAGxC0Sw9JyfPEshW_dPapICXdxQRAr4Jrw'; 
const CHAT_ID = '@drakito_alert'; 
const API_KEY = 'e8bd20dfd3749763cb63a31740b735d2'; 
const API_HOST = 'v3.football.api-sports.io';

const INTERVALO = 600000; // 10 minutos
const jogosAvisados = new Set();

// --- SISTEMA ANTI-SONO (SERVIDOR WEB) ---
// Isso cria uma página falsa para o servidor não desligar o robô
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Drakito Bot is Running! 🚀');
});
server.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Servidor Web ativo para manter o bot acordado!');
});

// --- LÓGICA DO BOT ---
async function enviarTelegram(mensagem) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, { chat_id: CHAT_ID, text: mensagem, parse_mode: 'Markdown' });
        console.log('✅ Sinal enviado!');
    } catch (error) {
        console.error('❌ Erro Telegram:', error.message);
    }
}

async function buscarJogos() {
    const hora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`[${hora}] 🔍 Escaneando...`);
    
    try {
        const response = await axios.get(`https://${API_HOST}/fixtures?live=all`, {
            headers: { "x-rapidapi-host": API_HOST, "x-rapidapi-key": API_KEY }
        });

        const jogos = response.data.response;
        if (!jogos) return;

        const candidatos = jogos.filter(j => Math.abs(j.goals.home - j.goals.away) === 1);

        for (const jogo of candidatos) {
            if (jogosAvisados.has(jogo.fixture.id)) continue;

            const home = jogo.teams.home.name;
            const away = jogo.teams.away.name;
            const scoreH = jogo.goals.home;
            const scoreA = jogo.goals.away;
            const tempo = jogo.fixture.status.elapsed;
            const liga = jogo.league.name;
            const losingTeam = scoreH < scoreA ? home : away;

            const msg = `🏆 *${liga}*\n` +
                        `⚽ ${home} *${scoreH} x ${scoreA}* ${away}\n` +
                        `⏱ Tempo: *${tempo}'*\n\n` +
                        `📉 *ENTRADA:* LAY ${losingTeam.toUpperCase()}`;

            await enviarTelegram(msg);
            jogosAvisados.add(jogo.fixture.id);
        }
    } catch (e) { console.error('❌ Erro API:', e.message); }
}

console.log('🤖 Bot Iniciado na Nuvem!');
buscarJogos();
setInterval(buscarJogos, INTERVALO);