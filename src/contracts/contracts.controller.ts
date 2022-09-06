import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { InitializeContractDto } from './initialize-contract.dto';

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
    );
    return printContractAddress;
  }
}
