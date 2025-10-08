// server.js - Exemplo de servidor Node.js para integração com Mercado Pago
// IMPORTANTE: Este é um exemplo. Implemente de acordo com sua infraestrutura.

const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para criar preferência de pagamento
app.post('/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity = 1, description, plan_type } = req.body;

        // Validação básica
        if (!title || !unit_price) {
            return res.status(400).json({ 
                error: 'Título e preço são obrigatórios' 
            });
        }

        // Configuração da preferência
        const preference = {
            items: [
                {
                    title: title,
                    unit_price: parseFloat(unit_price),
                    quantity: quantity,
                    currency_id: 'BRL',
                    description: description || `Assinatura ${title}`
                }
            ],
            payer: {
                email: req.body.payer_email || 'test@test.com'
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/sucesso`,
                failure: `${process.env.FRONTEND_URL}/falha`,
                pending: `${process.env.FRONTEND_URL}/pendente`
            },
            auto_return: 'approved',
            notification_url: `${process.env.BACKEND_URL}/api/webhook`,
            external_reference: `plan_${plan_type}_${Date.now()}`,
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
            payment_methods: {
                excluded_payment_types: [
                    // Descomente para excluir métodos específicos
                    // { id: 'ticket' } // Boleto
                ],
                installments: 12 // Máximo de parcelas
            }
        };

        // Criar preferência no Mercado Pago
        const response = await mercadopago.preferences.create(preference);
        
        // Log para debug (remover em produção)
        console.log('Preferência criada:', {
            id: response.body.id,
            title: title,
            price: unit_price,
            timestamp: new Date().toISOString()
        });

        res.json({
            id: response.body.id,
            init_point: response.body.init_point,
            sandbox_init_point: response.body.sandbox_init_point
        });

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Tente novamente'
        });
    }
});

// Webhook para receber notificações do Mercado Pago
app.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log('Webhook recebido:', { type, data });

        if (type === 'payment') {
            const paymentId = data.id;
            
            // Buscar detalhes do pagamento
            const payment = await mercadopago.payment.findById(paymentId);
            const paymentData = payment.body;

            console.log('Dados do pagamento:', {
                id: paymentData.id,
                status: paymentData.status,
                status_detail: paymentData.status_detail,
                external_reference: paymentData.external_reference,
                transaction_amount: paymentData.transaction_amount,
                payment_method_id: paymentData.payment_method_id
            });

            // Processar pagamento baseado no status
            switch (paymentData.status) {
                case 'approved':
                    await processApprovedPayment(paymentData);
                    break;
                case 'pending':
                    await processPendingPayment(paymentData);
                    break;
                case 'rejected':
                    await processRejectedPayment(paymentData);
                    break;
                case 'cancelled':
                    await processCancelledPayment(paymentData);
                    break;
                default:
                    console.log('Status não reconhecido:', paymentData.status);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
});

// Funções para processar diferentes status de pagamento
async function processApprovedPayment(paymentData) {
    console.log('✅ Pagamento aprovado:', paymentData.id);
    
    // Aqui você implementaria:
    // 1. Ativar assinatura do cliente
    // 2. Enviar email de confirmação
    // 3. Atualizar banco de dados
    // 4. Notificar WhatsApp
    
    const customerData = {
        payment_id: paymentData.id,
        email: paymentData.payer.email,
        plan: extractPlanFromReference(paymentData.external_reference),
        amount: paymentData.transaction_amount,
        status: 'active',
        activation_date: new Date().toISOString()
    };

    // Salvar no banco de dados
    await saveCustomerSubscription(customerData);
    
    // Enviar notificação de ativação
    await sendActivationNotification(customerData);
}

async function processPendingPayment(paymentData) {
    console.log('⏳ Pagamento pendente:', paymentData.id);
    
    // Implementar lógica para pagamentos pendentes (ex: boleto)
    await sendPendingPaymentNotification(paymentData);
}

async function processRejectedPayment(paymentData) {
    console.log('❌ Pagamento rejeitado:', paymentData.id);
    
    // Implementar lógica para pagamentos rejeitados
    await sendRejectionNotification(paymentData);
}

async function processCancelledPayment(paymentData) {
    console.log('🚫 Pagamento cancelado:', paymentData.id);
    
    // Implementar lógica para pagamentos cancelados
}

// Funções auxiliares (implementar conforme sua necessidade)
function extractPlanFromReference(externalReference) {
    // Extrair tipo de plano da referência externa
    // Exemplo: "plan_professional_1234567890" -> "professional"
    const match = externalReference?.match(/plan_([^_]+)_/);
    return match ? match[1] : 'unknown';
}

async function saveCustomerSubscription(customerData) {
    // Implementar salvamento no banco de dados
    console.log('Salvando assinatura:', customerData);
    
    // Exemplo com banco de dados:
    /*
    const db = getDatabase();
    await db.collection('subscriptions').insertOne({
        ...customerData,
        created_at: new Date(),
        updated_at: new Date()
    });
    */
}

async function sendActivationNotification(customerData) {
    // Enviar email/WhatsApp de ativação
    console.log('Enviando notificação de ativação para:', customerData.email);
    
    // Implementar envio de email
    // Implementar envio de WhatsApp
}

async function sendPendingPaymentNotification(paymentData) {
    console.log('Enviando notificação de pagamento pendente');
    // Implementar notificação de pagamento pendente
}

async function sendRejectionNotification(paymentData) {
    console.log('Enviando notificação de pagamento rejeitado');
    // Implementar notificação de rejeição
}

// Rota de status da API
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rota para consultar pagamento
app.get('/payment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await mercadopago.payment.findById(id);
        
        res.json({
            id: payment.body.id,
            status: payment.body.status,
            status_detail: payment.body.status_detail,
            transaction_amount: payment.body.transaction_amount,
            date_created: payment.body.date_created
        });
    } catch (error) {
        console.error('Erro ao consultar pagamento:', error);
        res.status(404).json({ error: 'Pagamento não encontrado' });
    }
});

// Middleware de erro global
app.use((error, req, res, next) => {
    console.error('Erro global:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Tente novamente'
    });
});

// Nota: este arquivo exporta o `app` sem chamar `listen()` para permitir
// que ele seja montado por um servidor principal (ex: ../server.js).
module.exports = app;