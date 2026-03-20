import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private supabase?: SupabaseClient;
  private qrCode: string | null = null;
  private readonly logger = new Logger(WhatsappService.name);
  private isReady = false;

  constructor() {
    // Initialize Supabase Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized for WhatsApp logging.');
    } else {
      this.logger.warn('Supabase credentials missing. Logging will be disabled.');
    }

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
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
      this.qrCode = qr;
      qrcode.generate(qr, { small: true });
    });

    this.client.on('authenticated', () => {
      this.logger.log('AUTHENTICATED: Session is now persisted locally.');
      this.qrCode = null;
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
      
      // Log to Supabase
      await this.logCommunication({
        customer_phone: message.from,
        message: message.body,
        status: 'received',
        direction: 'inbound',
        type: 'text',
      });

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

  private async logCommunication(data: {
    customer_phone: string;
    message: string;
    status: string;
    direction: string;
    type: string;
    work_order_id?: string;
  }) {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('communication_logs')
        .insert([{
          ...data,
          timestamp: new Date().toISOString(),
        }]);

      if (error) {
        this.logger.error('Failed to log communication to Supabase', error);
      } else {
        this.logger.log(`Communication logged to Supabase (${data.direction})`);
      }
    } catch (err) {
      this.logger.error('Unexpected error logging communication', err);
    }
  }

  private async handleGreeting(message: Message) {
    const delay = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
    this.logger.log(`Greeting detected. Preparing auto-reply in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        const replyText = 'Olá! Eu sou o seu bot NestJS desenvolvido com whatsapp-web.js. Como posso ser útil hoje?';
        await message.reply(replyText);
        this.logger.log(`Auto-reply sent to ${message.from}`);
        
        // Log the auto-reply
        await this.logCommunication({
          customer_phone: message.from,
          message: replyText,
          status: 'sent',
          direction: 'outbound',
          type: 'text',
        });
      } catch (err: any) {
        this.logger.error(`Failed to send auto-reply to ${message.from}:`, err);
      }
    }, delay);
  }

  async sendMessage(to: string, text: string, workOrderId?: string) {
    if (!this.isReady) {
      this.logger.warn('SendMessage aborted: Client is not ready.');
      return { success: false, error: 'WhatsApp client is not connected' };
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await this.client.sendMessage(chatId, text);
      this.logger.log(`Manual message sent to ${chatId}: "${text}"`);
      
      // Log to Supabase
      await this.logCommunication({
        customer_phone: chatId,
        message: text,
        status: 'sent',
        direction: 'outbound',
        type: 'text',
        work_order_id: workOrderId,
      });

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
      qr: this.qrCode,
      timestamp: new Date().toISOString(),
      has_supabase: !!this.supabase,
    };
  }
}


