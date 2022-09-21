import { Injectable } from '@nestjs/common';
import { Contract } from './schema/contract.schema';
import { ethers } from 'ethers';
import axios from 'axios';
import { AbiCoder } from 'ethers/lib/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
);

const pastEventFilter = async (
  contractAddress: any,
  startBlock: number,
  events: any,
) => {
  let allDecodedEvents: any[] = [];
  for (const event of events) {
    const logs = await provider.getLogs({
      fromBlock: startBlock,
      toBlock: 'latest',
      address: contractAddress,
      topics: [event.eventTopic],
    });

    const decoder = new AbiCoder();
    const decodedLogs = logs?.map((log: any) => {
      let decodedTopics: any[] = event.indexedInputs?.map((input: any) => {
        const value = decoder?.decode(
          [input?.type],
          log.topics[event.indexedInputs.indexOf(input) + 1],
        );
        // console.log(
        //   '🚀 ~ file: contracts.service.ts ~ line 38 ~ letdecodedTopics:any[]=event.indexedInputs?.map ~ decodedTopics',
        //   value,
        // );
        return { [input.name]: value[0] };
      });

      const decodedDataRaw = decoder?.decode(event.unindexedInputs, log.data);
      // console.log(
      //   '🚀 ~ file: contracts.service.ts ~ line 40 ~ decodedLogs ~ decodedDataRaw',
      //   decodedDataRaw,
      // );
      const decodedData = event.unindexedInputs?.map((input: any, i: any) => {
        return { [input.name]: decodedDataRaw[i] };
      });
      decodedTopics = decodedTopics.concat(decodedData, {
        eventName: event.eventName,
      });

      console.log(arrayToObject(decodedTopics), 'decodedTopics');
      // allDecodedEvents = {
      //   ...allDecodedEvents,
      //   ...arrayToObject(decodedTopics),
      // };
      allDecodedEvents.push(arrayToObject(decodedTopics));
      // allDecodedEvents.push(decodedTopics);
      return decodedTopics;
    });
  }
  return allDecodedEvents;
};

const arrayToObject = (arr: any[]) => {
  const obj: any = {};
  for (let i = 0; i < arr.length; i++) {
    obj[Object.keys(arr[i])[0]] = Object.values(arr[i])[0];
  }
  return obj;
};

const getEventsFromABI = async (erc20abi: any) => {
  const events = erc20abi?.filter((obj: any) => obj.type === 'event');
  let detailedEvents: any = [];
  for (const event of events) {
    let indexedInputs: any = [];
    let unindexedInputs: any = [];
    let eventTopic: any = [];
    const types = event?.inputs.map((input: any) => input.type);
    event?.inputs?.forEach((input: any) => {
      input.indexed ? indexedInputs.push(input) : unindexedInputs.push(input);
    });
    const eventSig = `${event?.name}(${types?.toString()})`;
    eventTopic.push(ethers.utils.id(eventSig));
    detailedEvents.push({
      eventName: event?.name,
      eventTopic: eventTopic,
      indexedInputs: indexedInputs,
      unindexedInputs: unindexedInputs,
    });
  }
  return detailedEvents;
};

const readFirestorageURL = async (contractABI: string) => {
  const res = await axios.get(contractABI);
  return res.data;
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<Contract>,
  ) {}
  async listenContract(
    contractAddress: string,
    startBlock: number,
    contractABI: string,
    userName: string,
    indexerName: string,
    description: string,
  ): Promise<any> {
    const abi = await readFirestorageURL(contractABI);
    const events = await getEventsFromABI(abi);
    const pastEvents = await pastEventFilter(
      contractAddress,
      startBlock,
      events,
    );
    const contract = new this.contractModel({
      contractAddress,
      startBlock,
      events,
      pastEvents,
      userName,
      indexerName,
      description,
      isSynced: true,
    });
    contract.save();
    axios.post('http://localhost:8080/', {
      contractAddress: contract.contractAddress,
    });
    return "You're listening to the contract";
  }

  async queryEvents(contractAddress: string, query: any[]): Promise<any> {
    console.log('query', query);
    const contract: any = await this.contractModel.aggregate([
      {
        $match: {
          contractAddress,
        },
      },
      {
        $project: {
          pastEvents: {
            $filter: {
              input: '$pastEvents',
              as: 'item',
              cond: {
                $and: query,
              },
            },
          },
          contractAddress: 1,
        },
      },
    ]);
    console.log('events after query', contract);
    return contract;
  }
}
