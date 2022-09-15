import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import axios from 'axios';

import { AbiCoder, getContractAddress } from 'ethers/lib/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Contract } from '././contracts/schema/contract.schema';
import { Model } from 'mongoose';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = 'UBY73PQ1HIHCY9D5348318DFK92ZIP723E';

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
);

const currentEventFilter = async (
  contractModel: Model<Contract>,
  contractAddress: string,
  events: any,
) => {
  const filter = {
    address: contractAddress,
  };
  provider.on(filter, (log) => {
    provider.getTransactionReceipt(log.transactionHash).then((receipt) => {
      for (const event of events) {
        try {
          let indexedInputs = event.indexedInputs;
          let unindexedInputs = event.unindexedInputs;
          const decoder = new AbiCoder();
          const txs = receipt?.logs.filter((log: any) => {
            return log.address === contractAddress;
          });
          const decodedLogs = txs?.map((log: any) => {
            if (event.eventTopic == log.topics[0]) {
              let decodedTopics = [];
              if (indexedInputs.length) {
                decodedTopics = indexedInputs?.map((input: any) => {
                  const value = decoder?.decode(
                    [input?.type],
                    log.topics[event.indexedInputs.indexOf(input) + 1],
                  );
                  return { [input.name]: value };
                });
              }
              let decodedData = [];
              if (unindexedInputs.length) {
                const decodedDataRaw = decoder?.decode(
                  unindexedInputs,
                  log.data,
                );

                decodedData = unindexedInputs?.map((input: any, i: any) => {
                  return { [input.name]: decodedDataRaw[i] };
                });
              }
              decodedTopics = decodedTopics.concat(decodedData, {
                eventName: event.eventName,
              });
              return decodedTopics;
            }
          });
          decodedLogs?.map((log: any) => {
            if (log) {
              saveNewEvent(contractAddress, contractModel, log);
              return log;
            }
          });
        } catch (e) {
          console.log(
            '🚀 ~ Not getting runtime log error file: app.service.ts ~ line 72 ~ provider.getTransactionReceipt ~ e',
            e,
          );
        }
      }
    });
  });
};

const saveNewEvent = async (
  contractAddress: string,
  contractModel: Model<Contract>,
  event: any,
) => {
  console.log(
    '🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀 ~ file: app.service.ts ~ line 84 ~ saveNewEvent ~ event',
    event,
  );
  await contractModel
    .findOneAndUpdate(
      {
        contractAddress: contractAddress,
      },
      {
        $push: {
          pastEvents: event,
        },
      },
    )
    .exec();
};

@Injectable()
export class AppService {
  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<Contract>,
  ) {}
  async getEvents(contractAddress: string): Promise<any> {
    console.log(contractAddress, 'here you go');
    const contract = await this.contractModel.findOne({
      contractAddress,
    });
    if (contract) {
      currentEventFilter(this.contractModel, contractAddress, contract?.events);
      return contract;
    }
  }
}
