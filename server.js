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
    
    // Configurar com token de produção (suas credenciais reais)
    const accessToken = 'APP_USR-7784076318930036-092213-cc300b09f44f7942b7eb772a9ad40c6e-142018015';
    console.log('🔧 Usando credenciais de PRODUÇÃO');
    
    mpClient = new MercadoPagoConfig({ 
        accessToken: accessToken,
        options: {
            timeout: 10000
        }
    });
    
    preferenceAPI = new Preference(mpClient);
    console.log('✅ Mercado Pago SDK v2 inicializado em PRODUÇÃO');
    console.log('🔑 Token configurado:', accessToken.substring(0, 20) + '...');
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

// Rota de teste do Mercado Pago
app.get('/api/test-mp', async (req, res) => {
    try {
        if (!preferenceAPI) {
            return res.status(500).json({
                error: 'Mercado Pago não inicializado',
                connected: false
            });
        }

        // Teste simples - criar preferência básica
        const testPreference = {
            items: [{
                id: 'test',
                title: 'Teste Q-aura',
                description: 'Teste de conectividade',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 0.01
            }],
            back_urls: {
                success: `${req.protocol}://${req.get('host')}/sucesso`,
                failure: `${req.protocol}://${req.get('host')}/falha`,
                pending: `${req.protocol}://${req.get('host')}/pendente`
            }
        };

        const response = await preferenceAPI.create({
            body: testPreference
        });

        res.json({
            message: 'Mercado Pago conectado com sucesso!',
            connected: true,
            test_preference_id: response.id,
            sdk_version: 'v2'
        });

    } catch (error) {
        console.error('Erro no teste MP:', error);
        res.status(500).json({
            error: 'Erro ao testar Mercado Pago',
            message: error.message,
            connected: false
        });
    }
});

// API para criar preferência do Mercado Pago (Checkout Pro) - 100% REAL
app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity = 1, description, plan_type } = req.body;

        console.log('🔄 Recebida solicitação de preferência REAL:', {
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

        // Verificar se MP está disponível
        if (!preferenceAPI) {
            console.log('❌ SDK do Mercado Pago não disponível');
            return res.status(500).json({ 
                error: 'Serviço de pagamento indisponível',
                message: 'SDK do Mercado Pago não foi inicializado corretamente',
                details: 'Verifique as credenciais de acesso'
            });
        }

        // Estrutura da preferência para Checkout Pro REAL
        const preferenceData = {
            items: [
                {
                    id: plan_type || 'qaura-plan',
                    title: title,
                    description: description || 'Assinatura Q-aura - Sistema de Estudos para Concursos',
                    quantity: parseInt(quantity),
                    currency_id: 'BRL',
                    unit_price: parseFloat(unit_price)
                }
            ],
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
            statement_descriptor: 'Q-AURA ESTUDOS'
        };

        console.log('🔄 Criando preferência REAL no Mercado Pago...');
        console.log('📋 Dados da preferência:', JSON.stringify(preferenceData, null, 2));

        // Criar preferência REAL no Mercado Pago
        try {
            const response = await preferenceAPI.create({
                body: preferenceData
            });
            
            console.log('✅ Preferência REAL criada com sucesso!');
            console.log('🆔 ID da preferência:', response.id);
            console.log('🔗 Link de pagamento:', response.init_point);

            return res.json({
                id: response.id,
                init_point: response.init_point,
                sandbox_init_point: response.sandbox_init_point,
                status: 'production'
            });
        } catch (mpError) {
            console.error('❌ Erro detalhado ao criar preferência:', {
                message: mpError.message,
                status: mpError.status,
                cause: mpError.cause,
                response: mpError.response?.data
            });
            
            throw new Error(`Erro do Mercado Pago: ${mpError.message}`);
        }

    } catch (error) {
        console.error('❌ Erro ao criar preferência REAL:', error);
        res.status(500).json({ 
            error: 'Erro ao processar pagamento',
            message: 'Tente novamente ou entre em contato via WhatsApp',
            details: error.message
        });
    }
});

// Webhook do Mercado Pago para processar notificações de pagamento
app.post('/api/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        console.log('📬 Webhook recebido:', { 
            type, 
            data, 
            timestamp: new Date().toISOString(),
            headers: req.headers
        });
        
        // Processar notificação de pagamento
        if (type === 'payment') {
            try {
                const { Payment } = require('mercadopago');
                const payment = new Payment(mpClient);
                
                // Buscar informações do pagamento
                const paymentInfo = await payment.get({ id: data.id });
                
                console.log('💰 Pagamento processado:', {
                    id: paymentInfo.id,
                    status: paymentInfo.status,
                    amount: paymentInfo.transaction_amount,
                    email: paymentInfo.payer.email,
                    external_reference: paymentInfo.external_reference
                });

                if (paymentInfo.status === 'approved') {
                    console.log('💚 Pagamento APROVADO! Ativar acesso ao Q-aura');
                    // TODO: Implementar lógica de ativação aqui
                    // Enviar email, criar acesso, notificar via WhatsApp, etc.
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar pagamento:', error);
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
});

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