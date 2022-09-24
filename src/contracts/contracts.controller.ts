import { Body, Controller, Logger, Param, Post, Get } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { InitializeContractDto, QueryEventsDto } from './contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async listenContract(
    @Body() initializeContractDto: InitializeContractDto,
  ): Promise<any> {
    Logger.log(
      'ContractsController.addContract()',
      JSON.stringify(initializeContractDto.contractAddress),
    );
    const printContractAddress = this.contractsService.listenContract(
      initializeContractDto.contractAddress,
      initializeContractDto.startBlock,
      initializeContractDto.contractABI,
      initializeContractDto.userName,
      initializeContractDto.indexerName,
      initializeContractDto.description,
    );
    return printContractAddress;
  }

  @Post('/:contractAddress')
  async queryEvents(
    @Param('contractAddress') contractAddress: string,
    @Body() queryEventsDto: QueryEventsDto,
  ): Promise<any> {
    console.log('contractAddress', contractAddress);
    const queryEvents = this.contractsService.queryEvents(
      contractAddress,
      queryEventsDto.query,
    );
    return queryEvents;
  }
}
