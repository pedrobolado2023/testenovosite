// Configuração do Mercado Pago
// IMPORTANTE: Substitua pela sua Public Key do Mercado Pago
const MP_PUBLIC_KEY = 'TEST-your-public-key-here'; // Coloque sua chave pública aqui

// Inicialização do Mercado Pago
let mp;
let checkout;

// Configuração dos planos
const planos = {
    basic: {
        name: 'Plano Básico',
        price: 97,
        description: 'Até 1.000 mensagens/mês',
        features: [
            'Até 1.000 mensagens/mês',
            'Respostas automáticas',
            'Suporte via chat',
            '1 usuário'
        ]
    },
    professional: {
        name: 'Plano Profissional',
        price: 197,
        description: 'Mensagens ilimitadas',
        features: [
            'Mensagens ilimitadas',
            'Automação avançada',
            'Suporte prioritário',
            'Até 5 usuários',
            'Relatórios detalhados',
            'Integração com CRM'
        ]
    },
    enterprise: {
        name: 'Plano Enterprise',
        price: 397,
        description: 'Solução completa',
        features: [
            'Tudo do Profissional',
            'Usuários ilimitados',
            'API personalizada',
            'Gerente dedicado',
            'Treinamento incluso',
            'White label'
        ]
    }
};

// Elementos DOM
const modal = document.getElementById('payment-modal');
const closeBtn = document.querySelector('.close');
const planButtons = document.querySelectorAll('[data-plan]');
const assinarBtns = document.querySelectorAll('#assinar-btn, #cta-final-btn');
const saibaMaisBtn = document.getElementById('saiba-mais-btn');
const navMobile = document.querySelector('.nav-mobile');
const navMenu = document.querySelector('.nav-menu');

// Variável global para o plano selecionado
let selectedPlan = 'professional'; // Plano padrão

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeMercadoPago();
    initializeEventListeners();
    initializeAnimations();
});

// Função para inicializar o Mercado Pago
function initializeMercadoPago() {
    try {
        if (typeof MercadoPago !== 'undefined') {
            mp = new MercadoPago(MP_PUBLIC_KEY, {
                locale: 'pt-BR'
            });
            console.log('Mercado Pago inicializado com sucesso');
        } else {
            console.error('SDK do Mercado Pago não carregado');
            showNotification('Erro ao carregar sistema de pagamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao inicializar Mercado Pago:', error);
        showNotification('Erro ao inicializar sistema de pagamento', 'error');
    }
}

// Event Listeners
function initializeEventListeners() {
    // Botões de planos
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            selectPlan(plan);
        });
    });

    // Botões "Assinar Agora"
    assinarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            selectPlan('professional'); // Plano padrão
        });
    });

    // Botão "Saiba Mais"
    if (saibaMaisBtn) {
        saibaMaisBtn.addEventListener('click', function() {
            document.getElementById('beneficios').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    // Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Menu mobile
    if (navMobile) {
        navMobile.addEventListener('click', toggleMobileMenu);
    }

    // Links de navegação suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Tecla ESC para fechar modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// Função para selecionar um plano
function selectPlan(planKey) {
    selectedPlan = planKey;
    const plano = planos[planKey];
    
    if (!plano) {
        console.error('Plano não encontrado:', planKey);
        return;
    }

    // Atualizar informações do modal
    document.getElementById('selected-plan-name').textContent = plano.name;
    document.getElementById('selected-plan-price').textContent = plano.price;

    // Abrir modal e criar checkout
    openModal();
    createCheckout(plano);
}

// Função para abrir o modal
function openModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

// Função para fechar o modal
function closeModal() {
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Limpar checkout anterior
        const checkoutContainer = document.getElementById('mercadopago-checkout');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = '';
        }
    }, 300);
}

// Função para criar checkout do Mercado Pago
async function createCheckout(plano) {
    if (!mp) {
        showNotification('Sistema de pagamento não disponível', 'error');
        return;
    }

    try {
        // Mostrar loading
        const checkoutContainer = document.getElementById('mercadopago-checkout');
        checkoutContainer.innerHTML = '<div class="loading-payment">Carregando sistema de pagamento...</div>';

        // Criar preferência de pagamento
        const preference = await createPaymentPreference(plano);
        
        if (!preference || !preference.id) {
            throw new Error('Erro ao criar preferência de pagamento');
        }

        // Limpar container
        checkoutContainer.innerHTML = '';

        // Criar checkout
        checkout = mp.checkout({
            preference: {
                id: preference.id
            },
            autoOpen: false
        });

        // Renderizar checkout
        checkout.render({
            container: '#mercadopago-checkout',
            label: `Assinar ${plano.name} - R$ ${plano.price}/mês`
        });

    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        showNotification('Erro ao carregar sistema de pagamento. Tente novamente.', 'error');
        
        // Mostrar opção alternativa
        const checkoutContainer = document.getElementById('mercadopago-checkout');
        checkoutContainer.innerHTML = `
            <div class="checkout-error">
                <p>Não foi possível carregar o sistema de pagamento.</p>
                <p>Entre em contato conosco pelo WhatsApp:</p>
                <a href="https://wa.me/5511999999999?text=Quero assinar o ${plano.name}" 
                   class="btn btn-primary" target="_blank">
                    <i class="fab fa-whatsapp"></i>
                    Contatar via WhatsApp
                </a>
            </div>
        `;
    }
}

// Função para criar preferência de pagamento (simulação)
async function createPaymentPreference(plano) {
    // IMPORTANTE: Em produção, esta função deve fazer uma chamada para seu backend
    // que criará a preferência usando a SDK do Mercado Pago no servidor
    
    // Esta é uma simulação - substitua pela sua implementação real
    try {
        const response = await fetch('/api/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: plano.name,
                unit_price: plano.price,
                quantity: 1,
                currency_id: 'BRL',
                description: plano.description
            })
        });

        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        
        // Fallback: retornar estrutura simulada para demonstração
        // REMOVA ISTO EM PRODUÇÃO
        return {
            id: 'demo-preference-id-' + Date.now(),
            init_point: '#',
            sandbox_init_point: '#'
        };
    }
}

// Função para toggle do menu mobile
function toggleMobileMenu() {
    if (navMenu) {
        navMenu.classList.toggle('active');
        navMobile.classList.toggle('active');
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Event listener para fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Inicializar animações
function initializeAnimations() {
    // Observador de interseção para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    document.querySelectorAll('.beneficio-card, .preco-card, .depoimento').forEach(el => {
        observer.observe(el);
    });
}

// Função para scroll suave para elementos
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para formatar telefone brasileiro
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

// Função para analytics (Google Analytics, Facebook Pixel, etc.)
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
    }
    
    console.log('Event tracked:', eventName, parameters);
}

// Eventos de tracking
document.addEventListener('DOMContentLoaded', function() {
    // Track page view
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });

    // Track plan selection
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            trackEvent('select_plan', {
                plan_name: planos[plan]?.name,
                plan_price: planos[plan]?.price
            });
        });
    });
});

// Função para otimização de performance
function optimizePerformance() {
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Inicializar otimizações
document.addEventListener('DOMContentLoaded', optimizePerformance);

// Função para detectar dispositivo mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Função para scroll spy (highlight menu ativo)
function initializeScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Inicializar scroll spy
document.addEventListener('DOMContentLoaded', initializeScrollSpy);

// Função para compartilhamento social
function shareOnSocial(platform, url = window.location.href, text = 'Confira este sistema incrível para WhatsApp!') {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    
    const platforms = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`
    };

    if (platforms[platform]) {
        window.open(platforms[platform], '_blank', 'width=600,height=400');
        
        trackEvent('social_share', {
            platform: platform,
            url: url
        });
    }
}

// Função para salvar lead (sem pagamento)
function saveLeadInfo(email, phone = null) {
    const leadData = {
        email: email,
        phone: phone,
        timestamp: new Date().toISOString(),
        page: window.location.href,
        userAgent: navigator.userAgent
    };

    // Aqui você salvaria no seu backend
    console.log('Lead capturado:', leadData);
    
    trackEvent('lead_capture', leadData);
}

// Adicionar estilos CSS para notificações e outros elementos
const additionalStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    padding: 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
    animation: slideInRight 0.3s ease-out;
}

.notification-info { background: #3498db; }
.notification-success { background: #2ecc71; }
.notification-warning { background: #f39c12; }
.notification-error { background: #e74c3c; }

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.loading-payment {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.checkout-error {
    text-align: center;
    padding: 20px;
}

.checkout-error p {
    margin-bottom: 16px;
    color: #666;
}

.nav-link.active {
    color: var(--primary-color);
    font-weight: 600;
}

.animate-in {
    animation: fadeInUp 0.6s ease-out;
}

@media (max-width: 768px) {
    .nav-menu.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 20px;
        gap: 16px;
    }
    
    .nav-mobile.active {
        color: var(--primary-color);
    }
}
</style>
`;

// Adicionar estilos ao head
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Exportar funções principais para uso global
window.WhatsAppPremium = {
    selectPlan,
    openModal,
    closeModal,
    shareOnSocial,
    trackEvent,
    showNotification
};