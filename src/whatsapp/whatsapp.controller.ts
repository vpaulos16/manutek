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
    @Body('workOrderId') workOrderId?: string,
  ) {
    if (!to || !message) {
      this.logger.warn('REST Request: POST /whatsapp/send - Missing params');
      throw new HttpException('Receiver (to) and message are required', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`REST Request: POST /whatsapp/send to ${to}${workOrderId ? ` for OS ${workOrderId}` : ''}`);
    const result = await this.whatsappService.sendMessage(to, message, workOrderId);

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to send message', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return { 
      status: 'success', 
      message: 'Message sent successfully',
      to: to,
      workOrderId: workOrderId
    };
  }

  @Post('notify-os')
  async notifyOS(
    @Body('phone') phone: string,
    @Body('message') message: string,
    @Body('osId') osId: string,
  ) {
    if (!phone || !message || !osId) {
      throw new HttpException('Phone, message and osId are required', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`REST Request: POST /whatsapp/notify-os for OS ${osId}`);
    const result = await this.whatsappService.sendMessage(phone, message, osId);

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to send notification', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      status: 'success',
      message: 'OS notification sent',
      osId: osId
    };
  }
}

