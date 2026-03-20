import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private readonly logger = new Logger(WhatsappService.name);
  private isReady = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth',
      }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-extensions',
        ],
        handleSIGINT: false,
      },
    });
  }

  async onModuleInit() {
    this.logger.log('Starting WhatsappModule...');
    this.initializeClient();
  }

  async onModuleDestroy() {
    this.logger.log('Destroying WhatsApp client...');
    try {
      await this.client.destroy();
      this.logger.log('WhatsApp client destroyed.');
    } catch (error) {
      this.logger.error('Error destroying WhatsApp client', error);
    }
  }

  private initializeClient() {
    this.logger.log('Initializing WhatsApp client...');

    this.client.on('qr', (qr: string) => {
      this.logger.log('QR CODE RECEIVED. Scan the code below with your WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('authenticated', () => {
      this.logger.log('AUTHENTICATED: Session is now persisted locally.');
    });

    this.client.on('auth_failure', (msg: string) => {
      this.logger.error('AUTHENTICATION FAILURE:', msg);
    });

    this.client.on('ready', () => {
      this.logger.log('WhatsApp client is READY and listening for messages!');
      this.isReady = true;
    });

    this.client.on('message', async (message: Message) => {
      this.logger.log(`Incoming message from ${message.from}: "${message.body}"`);
      
      const body = message.body.toLowerCase().trim();
      if (body === 'oi' || body === 'olá') {
        await this.handleGreeting(message);
      }
    });

    this.client.on('disconnected', async (reason: string) => {
      this.logger.warn('WhatsApp client DISCONNECTED:', reason);
      this.isReady = false;
      
      this.logger.log('Attempting to re-initialize client...');
      try {
        await this.client.initialize();
      } catch (error: any) {
        this.logger.error('Failed to re-initialize client', error);
      }
    });

    this.client.initialize().catch((err: Error) => {
      this.logger.error('Error during client initialization:', err);
    });
  }

  private async handleGreeting(message: Message) {
    const delay = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
    this.logger.log(`Greeting detected. Preparing auto-reply in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        await message.reply('Olá! Eu sou o seu bot NestJS desenvolvido com whatsapp-web.js. Como posso ser útil hoje?');
        this.logger.log(`Auto-reply sent to ${message.from}`);
      } catch (err: any) {
        this.logger.error(`Failed to send auto-reply to ${message.from}:`, err);
      }
    }, delay);
  }

  async sendMessage(to: string, text: string) {
    if (!this.isReady) {
      this.logger.warn('SendMessage aborted: Client is not ready.');
      return { success: false, error: 'WhatsApp client is not connected' };
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await this.client.sendMessage(chatId, text);
      this.logger.log(`Manual message sent to ${chatId}: "${text}"`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send manual message to ${to}:`, err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  getStatus() {
    return {
      connected: this.isReady,
      session_type: 'LocalAuth',
      timestamp: new Date().toISOString(),
    };
  }
}

