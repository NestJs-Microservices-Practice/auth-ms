import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NatsModule } from 'src/transports';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [NatsModule]
})
export class AuthModule {}
