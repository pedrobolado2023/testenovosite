# 🚀 Deploy no EasyPanel - Guia Completo

## 📋 Configurações Atuais do Projeto

### Mercado Pago
- **Public Key**: `APP_USR-1ce19553-fcdd-469b-9e00-2bdf113f1035`
- **Access Token**: `APP_USR-778407631893036-092213-cc300b09f44f7942b7eb772a9ad40c6e-142018015`
- **Domínio**: `estude.q-aura.com.br`
- **WhatsApp**: `5562993473656`

## 🔧 Passos para Deploy no EasyPanel

### 1. Configurar Aplicação no EasyPanel

1. **Acesse seu painel EasyPanel**
2. **Crie uma nova aplicação**:
   - Tipo: `Node.js App` (não Static Site)
   - Nome: `whatsapp-premium-site`
   - Domínio: `estude.q-aura.com.br`
   - Build Command: `npm run build`
   - Start Command: `npm start` (ou `node server.js`)

### 2. Configurar Deploy via GitHub

1. **No EasyPanel, configure o repositório**:
   ```
   Repository: https://github.com/pedrobolado2023/testenovosite.git
   Branch: main
   Build Command: npm run build
   Output Directory: ./
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   NODE_ENV=production
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-778407631893036-092213-cc300b09f44f7942b7eb772a9ad40c6e-142018015
   MERCADOPAGO_PUBLIC_KEY=APP_USR-1ce19553-fcdd-469b-9e00-2bdf113f1035
   FRONTEND_URL=https://estude.q-aura.com.br
   BACKEND_URL=https://estude.q-aura.com.br/api
   ```

### 3. Configurar SSL/HTTPS

⚠️ **OBRIGATÓRIO**: Mercado Pago exige HTTPS em produção

1. **No EasyPanel**:
   - Ative SSL/TLS
   - Configure certificado Let's Encrypt
   - Force HTTPS redirect

### 4. Configurar Backend (Opção 1 - Mesma aplicação)

Se quiser hospedar tudo junto:

1. **Instalar dependências**:
   ```bash
   npm install express cors mercadopago dotenv
   ```

2. **Criar arquivo `server.js` na raiz**:
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   
   // Servir arquivos estáticos
   app.use(express.static('.'));
   
   // Incluir API do Mercado Pago
   require('./api/server.js');
   
   // Rota principal
   app.get('/', (req, res) => {
       res.sendFile(path.join(__dirname, 'index.html'));
   });
   
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
       console.log(`Servidor rodando na porta ${PORT}`);
   });
   ```

3. **Atualizar package.json**:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "echo 'Build completed'"
     }
   }
   ```

### 5. Configurar Backend (Opção 2 - Separado)

Se preferir separar frontend e backend:

1. **Frontend**: Deploy atual no EasyPanel
2. **Backend**: Deploy separado em subdomínio ou serviço

### 6. Testar Funcionamento

1. **Acesse o site**: `https://estude.q-aura.com.br`
2. **Teste health check**: `https://estude.q-aura.com.br/health`
3. **Teste páginas de retorno**:
   - `https://estude.q-aura.com.br/sucesso`
   - `https://estude.q-aura.com.br/pendente` 
   - `https://estude.q-aura.com.br/falha`

### 7. Testar Pagamentos

1. **Teste com cartão de teste**:
   ```
   Cartão: 4509 9535 6623 3704
   CVV: 123
   Vencimento: 11/25
   Nome: APRO (aprovado) ou CONT (rejeitado)
   ```

2. **URLs de teste**:
   - Sucesso: `https://estude.q-aura.com.br/sucesso`
   - Falha: `https://estude.q-aura.com.br/falha`
   - Pendente: `https://estude.q-aura.com.br/pendente`

### 7. Configurar Webhooks no Mercado Pago

1. **Acesse**: [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
2. **Configure webhook**: `https://estude.q-aura.com.br/api/webhook`
3. **Eventos**: `payment`, `plan`, `subscription`

### 8. Configurar GitHub Actions (Já configurado)

O deploy automático já está configurado. Para ativar:

1. **No GitHub, vá em Settings > Secrets**
2. **Adicione estas secrets**:
   ```
   EASYPANEL_FTP_SERVER=ftp.estude.q-aura.com.br
   EASYPANEL_FTP_USERNAME=seu-usuario-ftp
   EASYPANEL_FTP_PASSWORD=sua-senha-ftp
   ```

## 📊 Monitoramento

### Logs importantes para acompanhar:
- Pagamentos aprovados/rejeitados
- Webhooks recebidos
- Erros de API
- Performance do site

### Analytics recomendados:
- Google Analytics 4
- Facebook Pixel
- Hotjar/Clarity para heatmaps

## 🔒 Segurança

### Checklist de segurança:
- ✅ HTTPS habilitado
- ✅ Chaves de produção configuradas
- ✅ Webhooks com validação
- ✅ Variáveis sensíveis em environment
- ⚠️ Implementar rate limiting
- ⚠️ Configurar CORS adequadamente
- ⚠️ Validar todos os inputs

## 🚨 Troubleshooting

### Problemas comuns:

1. **Erro "Public Key inválida"**:
   - Verifique se a chave está correta
   - Confirme se está usando ambiente correto (TEST vs PROD)

2. **Checkout não carrega**:
   - Verifique HTTPS
   - Confirme se o domínio está correto
   - Verifique console do navegador

3. **Webhook não recebe**:
   - Confirme URL do webhook
   - Verifique se o endpoint está acessível
   - Confirme se retorna status 200

4. **Deploy falha**:
   - Verifique secrets do GitHub
   - Confirme credenciais FTP
   - Verifique logs do GitHub Actions

## 📞 Suporte

Em caso de problemas:
1. Verifique logs do EasyPanel
2. Consulte documentação do Mercado Pago
3. Teste em ambiente local primeiro
4. Contate suporte técnico se necessário

---

**Status**: ✅ Configurado e pronto para produção!
**Último update**: Outubro 2025