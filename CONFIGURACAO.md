# 🚀 CONFIGURAÇÃO RÁPIDA - MERCADO PAGO

## 📋 Passos Obrigatórios para Produção

### 1. Configurar Chaves do Mercado Pago

1. **Acesse**: https://www.mercadopago.com.br/developers/panel/app
2. **Crie uma aplicação** ou use uma existente
3. **Copie suas chaves**:
   - **Public Key**: Vai no arquivo `script.js` (linha 4)
   - **Access Token**: Vai no arquivo `.env` do backend

### 2. Editar script.js

```javascript
// Linha 4 do script.js
const MP_PUBLIC_KEY = 'APP_USR-sua-chave-publica-aqui';
```

### 3. Configurar Backend (OBRIGATÓRIO)

O frontend sozinho NÃO funciona. Você precisa de um servidor para:

#### Opção A: Usar o servidor Node.js incluído
```bash
cd api
npm install express cors mercadopago dotenv
cp ../.env.example .env
# Edite o .env com suas chaves reais
node server.js
```

#### Opção B: Integrar com seu sistema existente
Crie estas rotas no seu backend:

**POST /api/create-preference**
```php
// Exemplo em PHP
<?php
require_once 'vendor/autoload.php';

MercadoPago\SDK::setAccessToken('SEU_ACCESS_TOKEN');

$preference = new MercadoPago\Preference();
$item = new MercadoPago\Item();
$item->title = $_POST['title'];
$item->quantity = 1;
$item->unit_price = (float)$_POST['unit_price'];

$preference->items = array($item);
$preference->save();

echo json_encode(['id' => $preference->id]);
?>
```

**POST /api/webhook**
```php
// Processar pagamentos aprovados
<?php
$input = json_decode(file_get_contents('php://input'), true);

if ($input['type'] === 'payment') {
    $payment_id = $input['data']['id'];
    
    // Buscar detalhes do pagamento
    $payment = MercadoPago\Payment::find_by_id($payment_id);
    
    if ($payment->status === 'approved') {
        // Ativar assinatura do cliente
        // Enviar email de confirmação
        // Etc...
    }
}

http_response_code(200);
echo 'OK';
?>
```

### 4. Configurar EasyPanel

#### No GitHub (Secrets):
1. Vá em **Settings** > **Secrets and variables** > **Actions**
2. Adicione:
   - `EASYPANEL_FTP_SERVER`: ftp.seudominio.com
   - `EASYPANEL_FTP_USERNAME`: seu-usuario
   - `EASYPANEL_FTP_PASSWORD`: sua-senha

#### No EasyPanel:
1. Crie um novo **Static Site**
2. Configure o domínio
3. Anote as credenciais FTP

### 5. URLs Para Configurar

Substitua no código:

```javascript
// Em script.js - função createPaymentPreference
const response = await fetch('https://SEU-BACKEND.com/api/create-preference', {
    // ...
});
```

```javascript
// URLs de retorno no backend
back_urls: {
    success: 'https://SEU-SITE.com/sucesso',
    failure: 'https://SEU-SITE.com/falha',
    pending: 'https://SEU-SITE.com/pendente'
}
```

### 6. Testar Integração

1. **Modo Teste**: Use chaves TEST_
2. **Cartões de teste**:
   - Aprovado: 4509 9535 6623 3704
   - Rejeitado: 4000 0000 0000 0002

### 7. Páginas de Retorno (Criar)

Crie estas páginas no seu site:

**sucesso.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Pagamento Aprovado!</title>
</head>
<body>
    <h1>✅ Pagamento Aprovado!</h1>
    <p>Sua assinatura foi ativada com sucesso!</p>
</body>
</html>
```

**falha.html** e **pendente.html** similares.

## ⚡ DEPLOY AUTOMÁTICO

Após configurar tudo:

```bash
git add .
git commit -m "Configuração do Mercado Pago"
git push origin main
```

O GitHub Actions fará o deploy automaticamente!

## 🔧 CUSTOMIZAÇÃO RÁPIDA

### Alterar Preços:
Edite o objeto `planos` no `script.js` (linha 9).

### Alterar Cores:
Edite as variáveis CSS no `styles.css` (linha 17).

### Alterar Textos:
Edite diretamente no `index.html`.

## 🆘 PROBLEMAS COMUNS

### "Erro ao carregar sistema de pagamento"
- ✅ Verifique se a chave pública está correta
- ✅ Confirme se o backend está rodando
- ✅ Teste em HTTPS (obrigatório para produção)

### Deploy não funciona
- ✅ Verifique as secrets do GitHub
- ✅ Confirme credenciais FTP do EasyPanel
- ✅ Veja os logs do GitHub Actions

### Pagamentos não processam
- ✅ Webhook configurado no Mercado Pago
- ✅ Backend recebendo POST em /api/webhook
- ✅ Logs do servidor para debug

## 📞 SUPORTE

- **Mercado Pago**: https://www.mercadopago.com.br/developers/pt/support
- **EasyPanel**: Documentação do seu provedor
- **GitHub Actions**: https://docs.github.com/pt/actions

---

**🎉 Pronto! Seu site está configurado para receber pagamentos!**