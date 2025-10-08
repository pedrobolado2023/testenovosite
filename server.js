const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Mercado Pago
let mpClient = null;
let preferenceAPI = null;

// Tentar inicializar Mercado Pago
try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    
    // Configurar com token vindo de variáveis de ambiente
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN não definido. Defina a variável de ambiente com sua chave do Mercado Pago');
    }

    console.log('🔧 Usando credenciais do Mercado Pago a partir de variáveis de ambiente');

    mpClient = new MercadoPagoConfig({ 
        accessToken: accessToken,
        options: {
            timeout: 10000
        }
    });

    preferenceAPI = new Preference(mpClient);
    console.log('✅ Mercado Pago SDK v2 inicializado');
} catch (error) {
    console.log('❌ Erro ao inicializar MP SDK:', error.message);
    console.log('⚠️ Checkout não funcionará sem MP SDK');
    console.log('🔍 Detalhes do erro:', error);
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para página de checkout
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Rotas para páginas de retorno do pagamento
app.get('/sucesso', (req, res) => {
    res.sendFile(path.join(__dirname, 'sucesso.html'));
});

app.get('/pendente', (req, res) => {
    res.sendFile(path.join(__dirname, 'pendente.html'));
});

app.get('/falha', (req, res) => {
    res.sendFile(path.join(__dirname, 'falha.html'));
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Q-aura Site is running',
        mercadopago: preferenceAPI ? 'Connected' : 'Disconnected'
    });
});

// Mount API from api/server.js to centralize API routes
try {
    const apiApp = require('./api/server');
    // If api/server exported an express app, mount it under /api
    if (apiApp && typeof apiApp === 'function') {
        app.use('/api', apiApp);
        console.log('✅ API montada em /api');
    }
} catch (err) {
    console.error('⚠️ Não foi possível montar a API em /api:', err.message);
}

// Middleware para lidar com rotas não encontradas
app.use((req, res) => {
    if (req.accepts('html')) {
        res.redirect('/');
    } else {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('❌ Erro global:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Tente novamente mais tarde'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Q-aura rodando na porta ${PORT}`);
    console.log(`📱 Site: http://localhost:${PORT}`);
    console.log(`💳 API: http://localhost:${PORT}/api`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`💰 Mercado Pago: ${preferenceAPI ? 'CONECTADO' : 'DESCONECTADO'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, encerrando servidor...');
    process.exit(0);
});

module.exports = app;