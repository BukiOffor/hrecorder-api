import { Controller, Body, Post } from '@nestjs/common';
import { AuthObject, User, WalletObject } from 'dto/user.dto';
import { AppService } from './app.service';
import { WitnessEvent } from 'dto/events.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('create/user')
  createUser(@Body() body: User): Promise<WalletObject> {
    return this.appService.createUser(body);
  }

  @Post('auth')
  getHello(@Body() body: AuthObject): Promise<boolean> {
    return this.appService.basicAuth(body);
  }

  @Post('sign/witness_statement')
  signWitnessStatement(@Body() body: WitnessEvent): Promise<string> {
    return this.appService.signWitnessStatement(body);
  }
}
