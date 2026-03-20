import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { HealthController } from './health.controller';

@Module({
  imports: [WhatsappModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
