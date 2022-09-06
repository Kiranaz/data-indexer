import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
const fs = require('fs');
import axios from 'axios';
const kolnetABI = require('../abis/kolnetABI.json');
const erc20ABI = require('../abis/randomContractAbi.json');
const linkABI = require('../abis/linkABI.json');
const wethABI = require('../abis/wethABI.json');
const elementABI = require('../abis/elementABI.json');

const ABI = linkABI;
import { AbiCoder } from 'ethers/lib/utils';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = 'UBY73PQ1HIHCY9D5348318DFK92ZIP723E';

const contractAddress = '0x01BE23585060835E02B77ef475b0Cc51aA1e0709'; //LINK Address

// const contractAddress = '0x2fEb01f83f98e3cf455cc64fB1feCFf757375Da5'; //KOLNET Address

// const contractAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab'; //WETH Token Address

// const contractAddress = '0x4dCf5ac4509888714dd43A5cCc46d7ab389D9c23'; //Element Token Address

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
    console.log(eventSig, 'eventSig', `${event?.name}(${types?.toString()})`);
    // getting the topic
    const eventTopic = ethers.utils.id(eventSig);
    // you could also filter by blocks, see above "Getting the Logs You Need"
    const logs = await provider.getLogs({
      fromBlock: 11331775,
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

@Injectable()
export class AppService {
  async getEvents(): Promise<any> {
    console.log('getEvents');

    // const abi = await fetchABI('0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757');
    // let data = (abi);
    // fs.writeFileSync('kolnet-abi.json', data);

    // eventFilter('0x01BE23585060835E02B77ef475b0Cc51aA1e0709', erc20ABI);
    const getPastEventsLog = await eventFilter(contractAddress, ABI);
    // console.log("🚀 ~ file: app.service.ts ~ line 134 ~ AppService ~ getPastEventsLog", getPastEventsLog)
    const events = ABI?.filter((obj: any) => obj.type === 'event');
    console.log(
      'file: app.service.ts ~ line 170 ~ AppService ~ provider.getTransactionReceipt ~ events',
      events,
    );
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
              ////FILTER EVENTS FROM ABI
              const events = ABI?.filter((obj: any) => obj.type === 'event');
              console.log(
                'file: app.service.ts ~ line 170 ~ AppService ~ provider.getTransactionReceipt ~ events',
                events,
              );
              // console.log(events, 'events');
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
                  const txs = tx?.logs.filter((log: any) => {
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

                          const value = decoder?.decode(
                            [input?.type],
                            log.topics[0],
                          );

                          return { [input.name]: value };
                        });
                      }

                      // const uni:any = [{ indexed: false, name: 'value', type: 'uint256' }]
                      console.log('log data: ', log.data, unindexedInputs);
                      const decodedDataRaw = decoder?.decode(
                        unindexedInputs,
                        log.data,
                      );
                      const decodedData = unindexedInputs?.map(
                        (input: any, i: any) => {
                          return { [input.name]: decodedDataRaw[i] };
                        },
                      );
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
                  decodedLogs && allDecodedEvents.push(decodedEvents);
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
      }
    });
  }
}
