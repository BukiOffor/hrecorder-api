import { Controller, Body, Get, Post } from '@nestjs/common';
import { User, WalletObject } from 'dto/user.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('create/user')
  createUser(@Body() body: User): Promise<WalletObject> {
    return this.appService.createUser(body);
  }

  @Get('/')
  getHello(): string {
    console.log(this.appService.getHello());
    return this.appService.getHello();
  }
}
