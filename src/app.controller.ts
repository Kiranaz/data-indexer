import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DecodedContractDto } from './decoded-contract.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async getEvents(
    @Body() decodedContractDto: DecodedContractDto,
  ): Promise<any> {
    return this.appService.getEvents(decodedContractDto.contractAddress);
  }
}
