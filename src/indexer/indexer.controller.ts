import { Controller, Get, Param } from '@nestjs/common';
import { IndexerService } from './indexer.service';

@Controller('indexer')
export class IndexerController {
  constructor(private readonly indexerServices: IndexerService) {}
  @Get()
  async getAllIndexers(): Promise<any> {
    return this.indexerServices.AllIndexers();
  }

  @Get('/:user/:address')
  async getSingleIndexer(
    @Param('user') userName: string,
    @Param('address') contractAddress: string,
  ): Promise<any> {
    return this.indexerServices.Indexer(userName, contractAddress);
  }
}
