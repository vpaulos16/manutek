import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    this.logger.log('REST Request: GET /whatsapp/status');
    return this.whatsappService.getStatus();
  }

  @Post('send')
  async sendMessage(
    @Body('to') to: string,
    @Body('message') message: string,
  ) {
    if (!to || !message) {
      this.logger.warn('REST Request: POST /whatsapp/send - Missing params');
      throw new HttpException('Receiver (to) and message are required', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`REST Request: POST /whatsapp/send to ${to}`);
    const result = await this.whatsappService.sendMessage(to, message);

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to send message', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return { 
      status: 'success', 
      message: 'Message sent successfully',
      to: to
    };
  }
}

