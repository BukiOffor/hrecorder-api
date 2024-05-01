import {
  Controller,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthObject, User, WalletObject } from 'dto/user.dto';
import { AppService } from './app.service';
import { WitnessEvent } from 'dto/events.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Device } from 'dto/wallet.dto';

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

  @Post('morpheus/sign_statement')
  signWitnessStatement(@Body() body: WitnessEvent): Promise<string> {
    return this.appService.signWitnessStatement(body);
  }

  @Post('event/upload')
  @UseInterceptors(FileInterceptor('file'))
  createBcProof(
    @Body() body: Device,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    return this.appService.createBcProof(body.id, file);
  }
  @Post('morpheus/witness_request')
  createWitnessRequest(@Body() body: object): Promise<any> {
    return this.appService.createWitnessRequest(body);
  }
}
