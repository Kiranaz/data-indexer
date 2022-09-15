import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContractsModule } from './contracts/contracts.module';
import { MongooseModule } from '@nestjs/mongoose';
import config from './config/keys';
import { ContractSchema } from './contracts/schema/contract.schema';

@Module({
  imports: [
    ContractsModule,
    MongooseModule.forRoot(config.mongoURI),
    MongooseModule.forFeature([{ name: 'Contract', schema: ContractSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
