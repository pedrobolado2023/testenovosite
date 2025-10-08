# Sistema WhatsApp Premium - Site de Vendas

Site moderno e responsivo para venda de assinatura do sistema WhatsApp Premium, com integração completa do Mercado Pago e deploy automático no EasyPanel.

## 🚀 Características

- **Design Moderno**: Interface responsiva e otimizada para conversão
- **Integração Mercado Pago**: Sistema completo de pagamentos
- **Deploy Automático**: Integração contínua via GitHub Actions
- **SEO Otimizado**: Meta tags e estrutura otimizada para buscadores
- **Performance**: Carregamento rápido e otimizado

## 📋 Funcionalidades

### Frontend
- ✅ Landing page responsiva
- ✅ Seções: Hero, Benefícios, Preços, Depoimentos, Contato
- ✅ Modal de pagamento integrado
- ✅ Animações e transições suaves
- ✅ Menu mobile otimizado

### Integração de Pagamentos
- ✅ SDK Mercado Pago implementado
- ✅ Checkout transparente
- ✅ Suporte a PIX, cartão e boleto
- ✅ Planos de assinatura configuráveis

### Deploy e CI/CD
- ✅ GitHub Actions configurado
- ✅ Deploy automático para EasyPanel
- ✅ Validação de código automatizada
- ✅ Notificações de deploy

## 🛠️ Configuração

### 1. Configuração do Mercado Pago

1. Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Copie suas chaves de teste e produção
4. Substitua a chave pública no arquivo `script.js`:

```javascript
const MP_PUBLIC_KEY = 'SUA_CHAVE_PUBLICA_AQUI';
```

### 2. Configuração do Backend (API)

Para funcionamento completo, você precisa criar uma API backend que:

1. **Crie preferências de pagamento**:
```javascript
// Endpoint: POST /api/create-preference
app.post('/api/create-preference', async (req, res) => {
  const preference = {
    items: [{
      title: req.body.title,
      unit_price: req.body.unit_price,
      quantity: 1,
      currency_id: 'BRL'
    }],
    back_urls: {
      success: 'https://seusite.com/sucesso',
      failure: 'https://seusite.com/falha',
      pending: 'https://seusite.com/pendente'
    },
    auto_return: 'approved'
  };
  
  const response = await mercadopago.preferences.create(preference);
  res.json({ id: response.body.id });
});
```

2. **Processe webhooks**:
```javascript
// Endpoint: POST /api/webhook
app.post('/api/webhook', (req, res) => {
  const payment = req.body;
  // Processar pagamento e ativar assinatura
  res.status(200).send('OK');
});
```

### 3. Configuração do EasyPanel

1. **Configure as variáveis no GitHub**:
   - `EASYPANEL_FTP_SERVER`: Servidor FTP do EasyPanel
   - `EASYPANEL_FTP_USERNAME`: Usuário FTP
   - `EASYPANEL_FTP_PASSWORD`: Senha FTP

2. **No painel do EasyPanel**:
   - Crie um novo site/aplicação
   - Configure o domínio personalizado
   - Anote as credenciais FTP

### 4. Configuração do Repositório GitHub

1. **Adicione as secrets no GitHub**:
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

2. **Secrets necessários**:
   - `EASYPANEL_FTP_SERVER`
   - `EASYPANEL_FTP_USERNAME`
   - `EASYPANEL_FTP_PASSWORD`

## 📁 Estrutura do Projeto

```
/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── script.js               # JavaScript e integração MP
├── .github/
│   └── workflows/
│       └── deploy.yml       # Configuração CI/CD
├── api/                     # Pasta para backend (opcional)
│   ├── create-preference.js
│   └── webhook.js
└── README.md               # Este arquivo
```

## 🔧 Personalização

### Planos e Preços
Edite o objeto `planos` no arquivo `script.js`:

```javascript
const planos = {
    basic: {
        name: 'Plano Básico',
        price: 97,
        description: 'Até 1.000 mensagens/mês',
        features: [...]
    },
    // ... outros planos
};
```

### Cores e Styling
Edite as variáveis CSS no arquivo `styles.css`:

```css
:root {
    --primary-color: #25D366;    /* Verde WhatsApp */
    --primary-dark: #128C7E;     /* Verde escuro */
    --accent-color: #f39c12;     /* Cor de destaque */
    /* ... outras variáveis */
}
```

### Conteúdo
- Substitua textos e imagens no `index.html`
- Atualize depoimentos e benefícios
- Configure links de redes sociais

## 🚀 Deploy

### Deploy Manual
```bash
# 1. Clone o repositório
git clone https://github.com/pedrobolado2023/testenovosite.git

# 2. Faça suas alterações
# 3. Commit e push
git add .
git commit -m "Suas alterações"
git push origin main
```

### Deploy Automático
O deploy é automático via GitHub Actions. Toda alteração na branch `main` dispara o deploy.

## 🧰 Como rodar localmente (API + Frontend)

Instale dependências e rode o servidor API e o servidor de arquivos estáticos.

No Powershell (Windows):

```powershell
# Instalar dependências
npm install

# Rodar apenas o servidor principal (serve arquivos estáticos e endpoints em server.js)
npm start

# Rodar apenas a API (arquivo api/server.js)
npm run start:api

# Rodar ambos simultaneamente (modo de desenvolvimento)
npm run dev:full
```

Observação: o endpoint da API que o checkout chama é `/api/create-preference`. Se você usa o servidor principal (`npm start`) ele já expõe esse endpoint (quando o Mercado Pago SDK estiver configurado). Caso prefira separar, a API em `api/server.js` expõe o mesmo endpoint na porta `3001` por padrão.

## 📊 Analytics e Tracking

O site inclui funções para:
- Google Analytics 4
- Facebook Pixel
- Tracking de eventos customizados

Configure adicionando os scripts no `<head>` do `index.html`.

## 🔒 Segurança

### Recomendações:
1. **HTTPS obrigatório** para Mercado Pago
2. **Validação server-side** de todos os pagamentos
3. **Webhooks seguros** com validação de assinatura
4. **Chaves de produção** apenas em produção

## 📞 Suporte

Para dúvidas sobre:
- **Mercado Pago**: [Documentação oficial](https://www.mercadopago.com.br/developers/pt/docs)
- **EasyPanel**: Documentação do seu provedor
- **GitHub Actions**: [Documentação GitHub](https://docs.github.com/pt/actions)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 🔄 Changelog

### v1.0.0 (2025-01-07)
- ✅ Estrutura inicial do site
- ✅ Integração Mercado Pago
- ✅ Design responsivo
- ✅ GitHub Actions configurado
- ✅ Deploy automático EasyPanel

---

**Desenvolvido para maximizar conversões e facilitar vendas de assinatura! 🚀**