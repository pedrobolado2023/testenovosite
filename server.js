const express = require('express');
const path = require('path');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Mercado Pago com sua credencial de produção
mercadopago.configure({
    access_token: 'APP_USR-7784076318930036-092213-cc300b09f44f7942b7eb772a9ad40c6e-142018015'
});

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

        // Validação básica
        if (!title || !unit_price) {
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
                    description: description,
                    quantity: quantity,
                    currency_id: 'BRL',
                    unit_price: parseFloat(unit_price)
                }
            ],
            payer: {
                email: 'cliente@email.com' // Em produção, capture do formulário
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

        console.log('Criando preferência real do Mercado Pago:', {
            title,
            price: unit_price,
            plan: plan_type
        });

        // Criar preferência real usando o SDK
        const preference = await mercadopago.preferences.create(preferenceData);
        
        console.log('Preferência criada com sucesso:', preference.body.id);

        res.json({
            id: preference.body.id,
            init_point: preference.body.init_point,
            sandbox_init_point: preference.body.sandbox_init_point
        });
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
                // Buscar informações do pagamento
                const payment = await mercadopago.payment.findById(data.id);
                
                console.log('Pagamento processado:', {
                    id: payment.body.id,
                    status: payment.body.status,
                    amount: payment.body.transaction_amount,
                    email: payment.body.payer.email,
                    external_reference: payment.body.external_reference
                });

                // Aqui você pode:
                // 1. Atualizar banco de dados
                // 2. Enviar email de confirmação
                // 3. Ativar acesso no sistema
                // 4. Enviar mensagem via WhatsApp API
                
                if (payment.body.status === 'approved') {
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