import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
const fs = require('fs');
import axios from 'axios';
const kolnetABI = require('../abis/rinkebyKolnetAbi.json');
const erc20ABI = require('../abis/randomContractAbi.json');

import { AbiCoder } from 'ethers/lib/utils';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = 'UBY73PQ1HIHCY9D5348318DFK92ZIP723E';

const contractAddress = '0x01BE23585060835E02B77ef475b0Cc51aA1e0709'; //LINK Address

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
);

const fetchABI = async (address: string) => {
  const response = await axios.get(
    `https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apikey}`,
  );
  return response.data.result;
};

//GET MULTIPLE TRANSACTION OF BLOCKS
const getBlock = async (blockNumber: number) => {
  const response = await provider.getBlockWithTransactions(blockNumber);
  return response;
  // const contract = new ethers.Contract(contractAddress2, abi, provider);
  // console.log('parseLog', contract.interface.parseLog(response));
  console.log(response, 'block details');
};

//FILTERS TRANSACTIONS FROM SELECTED ADDRESS, RIGHT NOW FROM HARDCODDED KOLNET RINKEBY ADDRESS
const getSelectedContractTransaction = (blockTransactions: any) => {
  if (blockTransactions) {
    blockTransactions = blockTransactions.filter((tx: any) => {
      return tx.from == contractAddress || tx.to == contractAddress;
    });
    if (blockTransactions.length) {
      return blockTransactions;
    } else {
      console.log('No tx for your address');
      return blockTransactions;
    }
  }
};

const eventFilter = async (contractAddress: any, erc20abi: any) => {
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
    // console.log(eventSig, "eventSig",`${event?.name}(${types?.toString()})`)
    // getting the topic
    const eventTopic = ethers.utils.id(eventSig);
    // you could also filter by blocks, see above "Getting the Logs You Need"
    const logs = await provider.getLogs({
      fromBlock: 11274256,
      toBlock: 'latest',
      address: contractAddress,
      topics: [eventTopic],
    });
    console.log(
      '🚀 ~ file: app.service.ts ~ line 81 ~ eventFilter ~ logs',
      logs,
    );

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

        return `${input.name}: ${value}`;
      });

      const decodedDataRaw = decoder?.decode(unindexedInputs, log.data);
      console.log(
        '🚀 ~ file: app.service.ts ~ line 100 ~ decodedLogs ~ decodedDataRaw',
        unindexedInputs,
        log.data,
      );
      const decodedData = unindexedInputs?.map((input: any, i: any) => {
        return `${input.name}: ${decodedDataRaw[i]}`;
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
    // let's pull out the to and from addresses and amounts
    const toAddresses = decodedEvents?.map(
      (event: any) => event['values']['to'],
    );
    getBlock;
    const fromAddresses = decodedEvents?.map(
      (event: any) => event['values']['from'],
    );
    const amounts = decodedEvents?.map(
      (event: any) => event['values']['value'],
    );
    // console.log('Final Result: ', [
    //   decodedEvents,
    // ]);
    allDecodedEvents.push(decodedEvents);
  }
  return allDecodedEvents;
};

@Injectable()
export class AppService {
  async getEvents(): Promise<any> {
    console.log('getEvents');

    // const abi = await fetchABI('0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757');
    // let data = (abi);
    // fs.writeFileSync('kolnet-abi.json', data);

    // eventFilter('0x01BE23585060835E02B77ef475b0Cc51aA1e0709', erc20ABI);
    const getPastEventsLog = await eventFilter(contractAddress, erc20ABI);
    // console.log("🚀 ~ file: app.service.ts ~ line 134 ~ AppService ~ getPastEventsLog", getPastEventsLog)

    //GET BLOCK TRANSACTIONS
    provider.on('block', async (block) => {
      const blockTxs = await getBlock(block);
      if (blockTxs.transactions) {
        //GET FILTERED SELECTED TRANSACTIONS
        const selectedTxs = await getSelectedContractTransaction(
          blockTxs.transactions,
        );
        selectedTxs &&
          selectedTxs.map((tx: any) => {
            provider.getTransactionReceipt(tx.hash).then((tx) => {
              console.log('getTransactionReceipt', tx?.logs);
              const events = erc20ABI?.filter(
                (obj: any) => obj.type === 'event',
              );
              console.log(
                'file: app.service.ts ~ line 170 ~ AppService ~ provider.getTransactionReceipt ~ events',
                events,
              );
              // console.log(events, 'events');
              const allDecodedEvents = [];
              for (const event of events) {
                // knowing which types are indexed will be useful later
                let indexedInputs: any = [];
                let unindexedInputs: any = [];
                event?.inputs?.forEach((input: any) => {
                  input.indexed
                    ? indexedInputs.push(input)
                    : unindexedInputs.push(input);
                });
                const decoder = new AbiCoder();
                console.log(
                  'file: app.service.ts ~ line 175 ~ AppService ~ provider.getTransactionReceipt ~ indexedInputs',
                  indexedInputs,
                  unindexedInputs,
                );

                const txs = tx?.logs.filter((log: any) => {
                  return log.address === contractAddress;
                });
                const decodedLogs = txs?.map((log: any) => {
                  // remember how we separated indexed and unindexed events?
                  // it was because we need to sort them differently here
                  let decodedTopics = [];
                  if (!!indexedInputs.length) {
                    decodedTopics = indexedInputs?.map((input: any) => {
                      // we use the position of the type in the array as an index for the
                      // topic, we need to add 1 since the first topic is the event sig

                      const value = decoder?.decode(
                        [input?.type],
                        log.topics[indexedInputs.indexOf(input) + 1],
                      );

                      return `${input.name}: ${value}`;
                    });
                  }

                  // const uni:any = [{ indexed: false, name: 'value', type: 'uint256' }]
                  const decodedDataRaw = decoder?.decode(
                    [unindexedInputs[0]],
                    log.data,
                  );
                  console.log(
                    'file: app.service.ts ~ line 214 ~ AppService ~ decodedLogs ~ decodedDataRaw',
                    decodedDataRaw,
                  );
                  const decodedData = unindexedInputs?.map(
                    (input: any, i: any) => {
                      return `${input.name}: ${decodedDataRaw[i]}`;
                    },
                  );
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
                allDecodedEvents.push(decodedEvents);
                console.log('Final Result: ', [decodedEvents]);
              }
            });
          });
      }
    });
  }
}
