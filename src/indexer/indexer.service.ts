import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contract } from 'src/contracts/schema/contract.schema';

@Injectable()
export class IndexerService {
  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<Contract>,
  ) {}

  async AllIndexers(): Promise<any> {
    try {
      const contract = await this.contractModel.find(
        {},
        { pastEvents: 0, events: 0 },
      );
      // console.log(
      //   'file: indexer.service.ts ~ line 19 ~ IndexerService ~ contract',
      //   contract,
      // );
      return contract;
    } catch (e) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  async Indexer(userName: string, contractAddress: string): Promise<any> {
    try {
      const contract = await this.contractModel.findOne({
        userName,
        contractAddress,
      });
      // console.log(
      //   'file: indexer.service.ts ~ line 19 ~ IndexerService ~ contract',
      //   contract,
      // );
      return contract;
    } catch (e) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
