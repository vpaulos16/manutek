# NestJS WhatsApp Bot

Este é um projeto profissional de bot para WhatsApp utilizando **NestJS** e **whatsapp-web.js** com persistência de sessão local (`LocalAuth`).

## Requisitos

- Node.js v18+
- npm ou yarn

## Instalação

```bash
npm install
```

## Como Executar

1. Inicie o projeto em modo de desenvolvimento:
   ```bash
   npm run start:dev
   ```
2. Observe o terminal. Um **QR Code** será exibido.
3. Abra o WhatsApp no seu celular, vá em **Aparelhos Conectados** > **Conectar um aparelho** e escaneie o código.
4. Após o login, a sessão será salva na pasta `.wwebjs_auth/`.

## Endpoints REST

O projeto inclui uma API básica para interação:

### 1. Verificar Status
**GET** `http://localhost:3000/whatsapp/status`
- Retorna se o bot está conectado e pronto.

### 2. Enviar Mensagem
**POST** `http://localhost:3000/whatsapp/send`
- **Body:**
  ```json
  {
    "to": "5511999999999",
    "message": "Olá via API NestJS!"
  }
  ```

## Funcionalidades Implementadas

- **LocalAuth:** Sessão persistente (não precisa scanear toda vez).
- **Auto-resposta:** Responde automaticamente a "oi" ou "olá" com um delay humano (2-5s).
- **Modular:** Estrutura limpa seguindo os padrões do NestJS.
- **Segurança:** Puppeteer configurado com `--no-sandbox` para rodar em diversos ambientes.
- **Logs:** Utiliza o Logger interno do NestJS para monitoramento.

## Dicas Anti-Ban

- O bot inclui um delay randômico nas respostas automáticas.
- Evite enviar mensagens em massa (spam) para números que não têm você nos contatos.

## Docker (Opcional)

Para rodar via Docker:

```bash
docker build -t whatsapp-bot-nest .
docker run -p 3000:3000 whatsapp-bot-nest
```
