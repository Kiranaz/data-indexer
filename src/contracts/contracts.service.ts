import { Injectable } from '@nestjs/common';

import { ethers } from 'ethers';
const fs = require('fs');
import axios from 'axios';
const kolnetABI = require('../../abis/kolnetABI.json');
const erc20ABI = require('../../abis/randomContractAbi.json');
const linkABI = require('../../abis/linkABI.json');
const wethABI = require('../../abis/wethABI.json');
const elementABI = require('../../abis/elementABI.json');

const ABI = linkABI;
import { AbiCoder } from 'ethers/lib/utils';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = 'UBY73PQ1HIHCY9D5348318DFK92ZIP723E';

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
);

const pastEventFilter = async (
  contractAddress: any,
  erc20abi: any,
  startBlock: number,
) => {
  // this will return an array with an object for each event

  const events = erc20abi?.filter((obj: any) => obj.type === 'event');
  // console.log(events, 'events');
  const allDecodedEvents = [];
  for (const event of events) {
    const types = event?.inputs.map((input: any) => input.type);
    // knowing which types are indexed will be useful later
    let indexedInputs: any = [];
    let unindexedInputs: any = [];
    event?.inputs?.forEach((input: any) => {
      input.indexed ? indexedInputs.push(input) : unindexedInputs.push(input);
    });
    // event signature
    const eventSig = `${event?.name}(${types?.toString()})`;
    console.log(eventSig, 'eventSig', `${event?.name}(${types?.toString()})`);
    // getting the topic
    const eventTopic = ethers.utils.id(eventSig);
    // you could also filter by blocks, see above "Getting the Logs You Need"
    const logs = await provider.getLogs({
      fromBlock: startBlock,
      toBlock: 'latest',
      address: contractAddress,
      topics: [eventTopic],
    });
    // console.log(
    //   '🚀 ~ file: app.service.ts ~ line 81 ~ eventFilter ~ logs',
    //   logs,
    // );

    // need to decode the topics and events

    const decoder = new AbiCoder();
    const decodedLogs = logs?.map((log: any) => {
      // remember how we separated indexed and unindexed events?
      // it was because we need to sort them differently here
      const decodedTopics = indexedInputs?.map((input: any) => {
        // we use the position of the type in the array as an index for the
        // topic, we need to add 1 since the first topic is the event sig
        const value = decoder?.decode(
          [input?.type],
          log.topics[indexedInputs.indexOf(input) + 1],
        );

        return { [input.name]: value };
      });

      const decodedDataRaw = decoder?.decode(unindexedInputs, log.data);
      console.log(
        '🚀 ~ file: app.service.ts ~ line 100 ~ decodedLogs ~ decodedDataRaw',
        event?.name,
        unindexedInputs,
        log.data,
      );
      const decodedData = unindexedInputs?.map((input: any, i: any) => {
        return { [input.name]: decodedDataRaw[i] };
      });
      return {
        decodedTopics,
        decodedData,
      };
    });
    // let's put everything in one array
    const eventName = `event: ${event?.name}`;
    const decodedEvents = decodedLogs?.map((log: any) => [
      eventName,
      ...log?.decodedTopics,
      ...log?.decodedData,
    ]);
    console.log(
      'file: app.service.ts ~ line 126 ~ eventFilter ~ decodedEvents',
      JSON.stringify(decodedLogs),
    );
    // let's pull out the to and from addresses and amounts
    // console.log('Final Result: ', [
    //   decodedEvents,
    // ]);
    allDecodedEvents.push(decodedEvents, null, 2);
  }
  return allDecodedEvents;
};

const currentEventFilter = async (contractAddress: any, ABI: any) => {
  const filter = {
    address: contractAddress,
  };
  provider.on(filter, (log, event) => {
    console.log(log); //returns block number, block hash, transaction index, removed, address, data, topics, transaction hash and log index

    provider.getTransactionReceipt(log.transactionHash).then((receipt) => {
      console.log(receipt); //returns transaction receipt
      const events = ABI?.filter((obj: any) => obj.type === 'event');

      const allDecodedEvents = [];
      for (const event of events) {
        // knowing which types are indexed will be useful later
        ////THIS LOOP WAS WRONG BECAUSE WE ARE NOT DECODING EVENTS BY EVENTS NAME INSTEAD WE ARE DECODING IT BY
        ////TRANSACTION WHICH HAVE ONE OR TWO SELECTED EVENTS BUT WE WERE DECODING THE GIVEN LOG DATA BY ALL EVENTS
        //// BELOW THERE IS A CONDITION WHICH COMPARES EVENTSTOPIC BY LOG TOPIC SO ONLY SELECTED TOPIC SHOULD DECODED

        try {
          let indexedInputs: any = [];
          let unindexedInputs: any = [];
          event?.inputs?.forEach((input: any) => {
            input.indexed
              ? indexedInputs.push(input)
              : unindexedInputs.push(input);
          });
          const decoder = new AbiCoder();
          ////FILTER LOGS BY CONTRACT ADDRESS
          const txs = receipt?.logs.filter((log: any) => {
            return log.address === contractAddress;
          });
          const decodedLogs = txs?.map((log: any) => {
            // remember how we separated indexed and unindexed events?
            ////PREVIOUSLY WE WERE NOT USING THIS BELOW 4 LINES, THIS COMPARES
            const types = event?.inputs.map((input: any) => input.type);
            const eventSig = `${event?.name}(${types?.toString()})`;
            const eventTopic = ethers.utils.id(eventSig);
            // it was because we need to sort them differently here
            if (eventTopic == log.topics[0]) {
              console.log(
                'file: app.service.ts ~ line 215 ~ AppService ~ decodedLogs ~ eventTopic == log.topics[0]',
                eventTopic,
                log.topics[0],
                eventTopic == log.topics[0],
              );
              let decodedTopics = [];
              if (indexedInputs.length) {
                decodedTopics = indexedInputs?.map((input: any) => {
                  // we use the position of the type in the array as an index for the
                  // topic, we need to add 1 since the first topic is the event sig

                  const value = decoder?.decode([input?.type], log.topics[0]);

                  return { [input.name]: value };
                });
              }

              // const uni:any = [{ indexed: false, name: 'value', type: 'uint256' }]
              console.log('log data: ', log.data, unindexedInputs);
              const decodedDataRaw = decoder?.decode(unindexedInputs, log.data);
              const decodedData = unindexedInputs?.map((input: any, i: any) => {
                return { [input.name]: decodedDataRaw[i] };
              });
              return {
                decodedTopics,
                decodedData,
              };
            }
          });
          // let's put everything in one array
          const decodedEvents = decodedLogs?.map((log: any) => {
            if (log) {
              log.eventName = event?.name;
              console.log(
                'file: app.service.ts ~ line 259 ~ AppService ~ decodedEvents ~ log',
                log,
              );
              return log;
            }
          });
          console.log(
            'file: app.service.ts ~ line 260 ~ AppService ~ decodedEvents ~ decodedEvents',
            decodedEvents,
          );
          // decodedLogs && allDecodedEvents.push(decodedEvents);
          // console.log(
          //   'Final Result: ',
          //   JSON.stringify(allDecodedEvents, null, 2),
          // );
        } catch (e) {
          console.log(
            'file: app.service.ts ~ line 250 ~ AppService ~ provider.getTransactionReceipt ~ e',
            e,
          );
        }
      }
    });
  });
};

@Injectable()
export class ContractsService {
  async listenContract(
    contractAddress: string,
    startBlock: number,
  ): Promise<any> {
    pastEventFilter(contractAddress, ABI, startBlock); //Will take it from User Input

    currentEventFilter(contractAddress, ABI);

    return "You're listening to the contract";
  }
}
