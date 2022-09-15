import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppService } from 'src/app.service';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schema/contract.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Contract', schema: ContractSchema }]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService, AppService],
})
export class ContractsModule {}
