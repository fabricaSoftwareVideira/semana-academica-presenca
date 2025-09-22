# Autenticação Biométrica - Semana Acadêmica

Este documento explica como configurar e usar a autenticação biométrica no sistema da Semana Acadêmica.

## 🔒 O que é a Autenticação Biométrica?

A autenticação biométrica permite que os usuários façam login usando:
- **Impressão digital** (leitor de impressão digital)
- **Reconhecimento facial** (câmera do dispositivo)
- **PIN/Padrão do dispositivo** (como backup)

## 🛠️ Como Configurar

### 1. Requisitos do Sistema

- **Navegador moderno** com suporte a WebAuthn:
  - Chrome 67+
  - Firefox 60+
  - Safari 14+
  - Edge 18+

- **Dispositivo com autenticador**:
  - Leitor de impressão digital
  - Câmera para reconhecimento facial
  - PIN/padrão/senha do dispositivo configurado

### 2. Configuração no Sistema

1. **Faça login** com usuário e senha normalmente
2. Acesse o **Dashboard**
3. Clique em **"Configurar Biometria"**
4. Siga as instruções na tela

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Configurações WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Semana Acadêmica
WEBAUTHN_ORIGIN=http://localhost:3000
```

Para produção, altere:
```env
WEBAUTHN_RP_ID=seudominio.com
WEBAUTHN_ORIGIN=https://seudominio.com
```

## 🚀 Como Usar

### Login com Biometria

1. **Na tela de login**:
   - Digite seu nome de usuário
   - Clique em **"Login com Biometria"**
   - Siga as instruções do navegador/dispositivo

2. **Atalho de teclado**:
   - Digite o usuário e pressione **Alt + Enter**

### Gerenciar Credenciais

1. **Adicionar nova biometria**:
   - Acesse "Configurar Biometria"
   - Clique em "Configurar Biometria"
   - Autorize no dispositivo

2. **Remover credencial**:
   - Acesse "Configurar Biometria" 
   - Clique no botão de lixeira ao lado da credencial

## 🔧 Estrutura Técnica

### Arquivos Criados

```
src/
├── services/
│   └── webauthn.service.js      # Lógica WebAuthn
├── controllers/
│   └── biometria.controller.js  # Endpoints da API
├── routes/
│   ├── biometria.routes.js      # Rotas da API
│   └── configurar-biometria.routes.js
├── models/
│   └── user.model.js           # Atualizado com suporte a credenciais
└── views/
    ├── configurar-biometria.ejs # Página de configuração
    └── login.ejs               # Atualizada com login biométrico

public/js/
└── biometria-client.js         # Cliente JavaScript WebAuthn
```

### Endpoints da API

```
POST /biometria/registrar/iniciar     # Inicia registro (protegido)
POST /biometria/registrar/finalizar   # Finaliza registro (protegido)
POST /biometria/autenticar/iniciar    # Inicia autenticação (público)
POST /biometria/autenticar/finalizar  # Finaliza autenticação (público)
GET  /biometria/credenciais           # Lista credenciais (protegido)
DELETE /biometria/credenciais/:id     # Remove credencial (protegido)
```

## 🔐 Segurança

### Recursos de Segurança

- **Criptografia assimétrica**: Chaves públicas/privadas
- **Challenge único**: Evita ataques de replay
- **Verificação de origem**: Valida domínio da aplicação
- **Timeout de sessão**: Challenges expiram em 5 minutos
- **Armazenamento seguro**: Credenciais criptografadas

### Boas Práticas

1. **HTTPS obrigatório em produção**
2. **Backup de autenticação**: Sempre manter senha como alternativa
3. **Limpeza de challenges**: Remove dados temporários automaticamente
4. **Validação de origem**: Verifica se a requisição vem do domínio correto

## 🐛 Solução de Problemas

### Problemas Comuns

**"Navegador não suporta biometria"**
- Atualize o navegador para versão mais recente
- Verifique se está em HTTPS (em produção)

**"Nenhum autenticador encontrado"**
- Ative o leitor de impressão digital nas configurações do sistema
- Configure PIN/padrão no dispositivo
- Verifique se a câmera está funcionando

**"Erro ao registrar credencial"**
- Limpe cache e cookies do navegador
- Tente em uma aba privada/incógnita
- Reinicie o navegador

**"Challenge expirado"**
- Tente novamente (o processo expira em 5 minutos)
- Recarregue a página

### Logs de Debug

Para debug, verifique:
- Console do navegador (F12)
- Logs do servidor Node.js
- Network tab para requisições HTTP

## 📱 Compatibilidade

### Navegadores Suportados

| Navegador | Versão Mínima | Suporte |
|-----------|---------------|---------|
| Chrome    | 67+          | ✅ Completo |
| Firefox   | 60+          | ✅ Completo |
| Safari    | 14+          | ✅ Completo |
| Edge      | 18+          | ✅ Completo |

### Dispositivos Testados

- **Windows 10/11**: Windows Hello
- **macOS**: Touch ID
- **Android 7+**: Impressão digital
- **iOS 14+**: Face ID / Touch ID

## 🔄 Migração e Backup

### Backup de Credenciais

As credenciais biométricas são armazenadas em `src/data/users.json`:

```json
{
  "username": "usuario",
  "webauthnCredentials": [
    {
      "credentialID": "...",
      "credentialPublicKey": "...",
      "counter": 0,
      "transports": ["internal"],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Reset de Credenciais

Para remover todas as credenciais de um usuário:
1. Edite `src/data/users.json`
2. Remova o array `webauthnCredentials`
3. Reinicie o servidor

## 📞 Suporte

Para dúvidas técnicas:
- Consulte os logs do servidor
- Verifique a documentação da [WebAuthn](https://webauthn.guide/)
- Teste em diferentes navegadores/dispositivos

---

**Desenvolvido para a 10° Semana Acadêmica do IFC Videira**