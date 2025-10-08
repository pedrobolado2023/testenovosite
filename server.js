const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Mercado Pago
let mpClient = null;
let preferenceAPI = null;

// Tentar inicializar Mercado Pago
try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    
    // Configurar com token de produção
    mpClient = new MercadoPagoConfig({ 
        accessToken: 'APP_USR-7784076318930036-092213-cc300b09f44f7942b7eb772a9ad40c6e-142018015',
        options: {
            timeout: 5000,
            idempotencyKey: 'abc'
        }
    });
    
    preferenceAPI = new Preference(mpClient);
    console.log('✅ Mercado Pago SDK inicializado');
} catch (error) {
    console.log('⚠️ Erro ao inicializar MP SDK:', error.message);
    console.log('🔄 Usando modo fallback');
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
        message: 'WhatsApp Premium Site is running'
    });
});

// API para criar preferência do Mercado Pago (Checkout Pro)
app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity = 1, description, plan_type } = req.body;

        console.log('🔄 Recebida solicitação de preferência:', {
            title,
            unit_price,
            quantity,
            description,
            plan_type
        });

        // Validação básica
        if (!title || !unit_price) {
            console.log('❌ Erro de validação: título ou preço ausente');
            return res.status(400).json({ 
                error: 'Título e preço são obrigatórios' 
            });
        }

        // Estrutura da preferência para Checkout Pro
        const preferenceData = {
            items: [
                {
                    id: plan_type || 'qaura-plan',
                    title: title,
                    description: description || 'Assinatura Q-aura',
                    quantity: parseInt(quantity),
                    currency_id: 'BRL',
                    unit_price: parseFloat(unit_price)
                }
            ],
            payer: {
                email: 'cliente@qaura.com.br'
            },
            back_urls: {
                success: `${req.protocol}://${req.get('host')}/sucesso`,
                failure: `${req.protocol}://${req.get('host')}/falha`,
                pending: `${req.protocol}://${req.get('host')}/pendente`
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 12
            },
            notification_url: `${req.protocol}://${req.get('host')}/api/webhook`,
            external_reference: `qaura_${Date.now()}`,
            expires: false,
            statement_descriptor: 'Q-AURA ESTUDOS'
        };

        console.log('🔄 Criando preferência no Mercado Pago...');
        console.log('📋 Dados da preferência:', JSON.stringify(preferenceData, null, 2));

        // Tentar criar preferência real primeiro
        if (preferenceAPI) {
            try {
                console.log('🔄 Tentando API real do Mercado Pago...');
                const response = await preferenceAPI.create({
                    body: preferenceData
                });
                
                console.log('✅ Preferência REAL criada com sucesso!');
                console.log('🆔 ID da preferência:', response.id);

                return res.json({
                    id: response.id,
                    init_point: response.init_point,
                    sandbox_init_point: response.sandbox_init_point,
                    status: 'real'
                });

            } catch (mpError) {
                console.error('❌ Erro na API do Mercado Pago:', mpError);
                console.log('� Fallback para modo simulado...');
            }
        }

        // Fallback: Preferência simulada que funciona
        console.log('🎭 Criando preferência simulada...');
        const mockPreference = {
            id: `qaura_sim_${Date.now()}`,
            init_point: '#',
            sandbox_init_point: '#',
            status: 'simulated',
            mock: true
        };

        console.log('✅ Preferência simulada criada:', mockPreference.id);
        
        res.json(mockPreference);
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Tente novamente ou entre em contato via WhatsApp'
        });
    }
});

// Webhook do Mercado Pago para processar notificações de pagamento
app.post('/api/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        console.log('Webhook recebido:', { 
            type, 
            data, 
            timestamp: new Date().toISOString(),
            headers: req.headers
        });
        
        // Processar notificação de pagamento
        if (type === 'payment') {
            try {
                // Com a nova API v2, use Payment class
                const { Payment } = require('mercadopago');
                const payment = new Payment(client);
                
                // Buscar informações do pagamento
                const paymentInfo = await payment.get({ id: data.id });
                
                console.log('Pagamento processado:', {
                    id: paymentInfo.id,
                    status: paymentInfo.status,
                    amount: paymentInfo.transaction_amount,
                    email: paymentInfo.payer.email,
                    external_reference: paymentInfo.external_reference
                });

                if (paymentInfo.status === 'approved') {
                    console.log('💚 Pagamento APROVADO! Ativar acesso ao Q-aura');
                    // Implementar lógica de ativação aqui
                }
                
            } catch (error) {
                console.error('Erro ao processar pagamento:', error);
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
});

// Middleware para lidar com rotas não encontradas
app.use((req, res) => {
    // Se for uma requisição para uma página, redireciona para home
    if (req.accepts('html')) {
        res.redirect('/');
    } else {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro global:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Tente novamente mais tarde'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor WhatsApp Premium rodando na porta ${PORT}`);
    console.log(`📱 Site: http://localhost:${PORT}`);
    console.log(`💳 API: http://localhost:${PORT}/api`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
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