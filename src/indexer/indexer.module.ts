import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractSchema } from 'src/contracts/schema/contract.schema';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Contract', schema: ContractSchema }]),
  ],
  controllers: [IndexerController],
  providers: [IndexerService],
})
export class IndexerModule {}
