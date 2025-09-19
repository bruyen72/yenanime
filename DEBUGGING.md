# 🔍 DEBUGGING - KNIGHT BOT WHATSAPP BUSINESS

## Logs Estruturados para Troubleshooting

### 📊 **Como Verificar Status Completo:**
```bash
curl https://seu-dominio.vercel.app/status
```

### 🐛 **Tipos de Erro e Soluções:**

#### **1. MISSING_PHONE_NUMBER**
```json
{
  "error": "MISSING_PHONE_NUMBER",
  "message": "Parâmetro 'number' é obrigatório"
}
```
**Solução:** Adicione `?number=5565984660212` na URL

#### **2. INVALID_PHONE_NUMBER**
```json
{
  "error": "INVALID_PHONE_NUMBER",
  "message": "Número deve estar no formato brasileiro"
}
```
**Solução:** Use formato: `5565984660212` ou `+5565984660212`

#### **3. RATE_LIMIT_EXCEEDED**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit excedido. Tente novamente em X minutos"
}
```
**Solução:** Aguarde o tempo indicado (máximo 3 tentativas/hora)

#### **4. SERVICE_NOT_CONFIGURED**
```json
{
  "error": "SERVICE_NOT_CONFIGURED",
  "message": "Configuração incompleta: ACCESS_TOKEN e PHONE_NUMBER_ID são obrigatórios"
}
```
**Solução:** Configure as variáveis de ambiente no Vercel

### 🔧 **Verificação de Configuração:**

#### **Ambiente de Desenvolvimento:**
- Códigos funcionam como demo
- Logs detalhados no console
- Sem necessidade de credenciais reais

#### **Ambiente de Produção:**
- Requer configuração completa
- Integração com Meta Business API
- Webhook configurado

### 📱 **Teste do Número 5565984660212:**

#### **Formato Validado:**
```javascript
{
  "valid": true,
  "formatted": "+5565984660212",
  "country": "BR",
  "area_code": "65",
  "number": "984660212"
}
```

#### **Código Gerado Exemplo:**
```
Entrada: 5565984660212
Saída: ABC4-XY89
Formato: XXXX-XXXX (8 caracteres alfanuméricos)
```

### 🌐 **URLs de Teste:**

#### **Desenvolvimento:**
```
/pair?number=5565984660212
/qr
/status
```

#### **Produção:**
```
/webhook (configurar no Meta)
/test?to=5565984660212&message=Teste
```

### 🎯 **Checklist de Problemas Comuns:**

- [ ] Número no formato correto (+5565984660212)
- [ ] Rate limit não excedido (< 3 tentativas/hora)
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook URL válida no Meta Console
- [ ] Token de verificação correto
- [ ] Permissões do WhatsApp Business ativas

### 🚀 **Migração Demo → Produção:**

#### **1. Configure no Vercel:**
```
WHATSAPP_ACCESS_TOKEN=EAAY...
PHONE_NUMBER_ID=123456789
VERIFY_TOKEN=knight_bot_verify_2025
```

#### **2. Configure no Meta Developer:**
```
Webhook URL: https://seu-app.vercel.app/webhook
Verify Token: knight_bot_verify_2025
```

#### **3. Teste a Configuração:**
```
GET /status → Verifica environment_check
POST /webhook → Testa recebimento
GET /pair?number=5565984660212 → Código real
```

### 📈 **Monitoramento em Tempo Real:**

#### **Logs Detalhados:**
- [INFO] Solicitação de pareamento
- [ERROR] Erro na API do WhatsApp
- [WARN] Rate limit detectado
- [DEBUG] Webhook recebido

#### **Métricas Disponíveis:**
- Sessões ativas
- Total de tentativas de pareamento
- Mensagens processadas
- Status da API configurada

Este sistema elimina os problemas de "código não funcional" e implementa um bot real com troubleshooting completo.