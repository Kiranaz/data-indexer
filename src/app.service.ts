import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import axios from 'axios';

const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';
const apikey = "UBY73PQ1HIHCY9D5348318DFK92ZIP723E";

const contractAddress1 =
  "0x7578E632092D262D78Ebe3a24A6361702CE31EAE" //KOLNET RINKEBY
 

const contractAddress2 = "0x3C71cB925E5F4227D2793360a1149cc4fd450a91" //RANDOM CONTRACT ON RINKEBY

const contractAddresses = [contractAddress1, contractAddress2];

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`
);

const fetchABI = async (address: string) => { 
  const response = await axios.get(`https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apikey}`);
  return response.data.result;
}

const getBlock = async (blockNumber: number) => {
  const response = await provider.getBlockWithTransactions(blockNumber);
  console.log(response, "block details");
}

@Injectable()
export class AppService {
  async getEvents(): Promise<any> {
    console.log('getEvents');

const abi = await fetchABI(contractAddress2);

    const contract = new ethers.Contract(contractAddress2, abi, provider);
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
    // const filter = {
    //   address: contractAddress2,
    // }
    // provider.on(filter, (log, event) => {
    //   console.log("listener",log); //returns block number, block hash, transaction index, removed, address, data, topics, transaction hash and log index
    //   // let txhash = log.transactionHash;
    //   // provider.getTransactionReceipt
    //   //   (txhash).then(tx => {
    //   //   console.log("getTransactionReceipt",tx); //returns transaction object
    //   // }
    //   // )
    //     console.log("parseLog",contract.interface.parseLog(log)); //Fetching function name and arguments from log
    // })
    provider.on("block", (block) => { 
      console.log("block", block); 
      getBlock(block);
    })
  }
}

// await erc20.queryFilter(filterFrom, -10, "latest");