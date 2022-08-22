import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
const fs = require('fs');
import axios from 'axios';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = 'UBY73PQ1HIHCY9D5348318DFK92ZIP723E';

const contractAddress1 = '0x7578E632092D262D78Ebe3a24A6361702CE31EAE'; //KOLNET RINKEBY

const contractAddress2 = '0x3C71cB925E5F4227D2793360a1149cc4fd450a91'; //RANDOM CONTRACT ON RINKEBY

const contractAddresses = [contractAddress1, contractAddress2];

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
  //   const abi = await fetchABI(contractAddress2);
  return response;
  // const contract = new ethers.Contract(contractAddress2, abi, provider);
  // console.log('parseLog', contract.interface.parseLog(response));
  console.log(response, 'block details');
};

//FILTERS TRANSACTIONS FROM SELECTED ADDRESS, RIGHT NOW FROM HARDCODDED KOLNET RINKEBY ADDRESS
const getSelectedContractTransaction = (blockTransactions: any) => {
  if (blockTransactions) {
    blockTransactions = blockTransactions.filter((tx: any) => {
      return (
        tx.from == '0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757' ||
        tx.to == '0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757'
      );
    });
    if (blockTransactions.length) {
      console.log(
        'file: app.service.ts ~ line 41 ~ getSelectedContractTransaction ~ blockTransactions',
        blockTransactions,
      );
      let data = JSON.stringify(blockTransactions);
      fs.writeFileSync('student-3.json', data);
      return blockTransactions;
    } else {
      console.log('No tx for your address');
      return blockTransactions;
    }
  }
};
@Injectable()
export class AppService {
  async getEvents(): Promise<any> {
    console.log('getEvents');

    const abi = await fetchABI('0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757');

    const contract = await new ethers.Contract(
      '0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757',
      abi,
      provider,
    );
    // LISTENING SPECIFIC EVENT OF CONTRACT
    // contract.on("DepositPreSaleTokens", (from, to, value, event) => {
    //   console.log(event);
    //   let info = {
    //     from: from,
    //     to: to,
    //     amount: ethers.utils.formatUnits(value, 6),
    //     event: event
    //   }
    //   console.log(info);
    // })
    // LISTENING ALL EVENTS OF CONTRACT
    const filter = {
      address: '0x5bFb3dCE8dAB556BfeB12932Dc96F937C544f757',
    };
    // provider.on(filter, (log, event) => {
    //   //   console.log('listener', log); //returns block number, block hash, transaction index, removed, address, data, topics, transaction hash and log index
    //   // let txhash = log.transactionHash;
    //   // provider.getTransactionReceipt
    //   //   (txhash).then(tx => {
    //   //   console.log("getTransactionReceipt",tx); //returns transaction object
    //   // }
    //   // )
    //   console.log(
    //     'eventLogged',
    //     event,
    //     'parseLog',
    //     contract.interface.parseLog(log),
    //   ); //Fetching function name and arguments from log
    //   let data = JSON.stringify(contract.interface.parseLog(log));
    //   fs.writeFileSync('student-2.json', data);
    // });
    provider.on('block', async (block) => {
      console.log('block', block);
      const blockTxs = await getBlock(block);
      // console.log(
      //   'file: app.service.ts ~ line 99 ~ AppService ~ provider.on ~ blockTxs',
      //   blockTxs,
      // );
      // let data = JSON.stringify(blockTxs);
      // fs.writeFileSync('student-2.json', data);

      //GET BLOCK TRANSACTIONS
      if (blockTxs.transactions) {
        //GET FILTERED SELECTED TRANSACTIONS
        const selectedTxs = await getSelectedContractTransaction(
          blockTxs.transactions,
        );
        selectedTxs &&
          selectedTxs.map((tx: any) => {
            provider.getTransactionReceipt(tx.hash).then(async (tx) => {
              console.log('getTransactionReceipt', tx);
              //returns transaction object
              // let data = JSON.stringify(contract.interface.parseLog({data:tx.data,topics:[tx.]}));
              // tx.logs&&tx.logs.map((log)=>{
              //   eventLog.push(contract.interface.parseLog({data:log.data, topics: log.topics}))
              // })
              try {
                let eventLog = [];
                // for (let i = 0; i < tx.logs.length; i++) {
                //   console.log(
                //     'file: app.service.ts ~ line 130 ~ AppService ~ provider.getTransactionReceipt ~ topics',
                //     {
                //       data: tx.logs[i].data,
                //       topics: tx.logs[i].topics,
                //     },
                //   );
                //   eventLog.push(
                //     await contract.interface.parseLog({
                //       data: tx.logs[i].data,
                //       topics: tx.logs[i].topics,
                //     }),
                //   );
                // }

                //TRYING TO PARSE LOGS
                const result = contract.interface.parseLog({
                  data: tx.logs[1].data,
                  topics: tx.logs[1].topics,
                });
                console.log(
                  'file: app.service.ts ~ line 144 ~ AppService ~ provider.getTransactionReceipt ~ result',
                  result,
                );
                let eventData = JSON.stringify(result.args);

                fs.writeFileSync('student-event.json', eventData);
              } catch (e) {
                console.log(e);
              }

              let data = JSON.stringify(tx);
              fs.writeFileSync('student-2.json', data);
            });
          });
      }
    });
    // return 'check your consoles';
  }
}

// await erc20.queryFilter(filterFrom, -10, "latest");
