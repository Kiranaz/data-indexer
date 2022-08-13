import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
const abi = require('../abis/rinkebyKolnetAbi.json');
const ALCHEMY_KEY = '770cmARGW-xp54sXx0NW0PfPew34lh3K';

const contractAddress =
  "0x7578E632092D262D78Ebe3a24A6361702CE31EAE" //KOLNET RINKEBY

const provider = new ethers.providers.WebSocketProvider(
  `wss://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`
);

@Injectable()
export class AppService {
  async getEvents(): Promise<any> {
    const contract = new ethers.Contract(contractAddress, abi, provider);
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
      address: contractAddress,
    }
    provider.on(filter, (log, event) => {
      console.log(log); //returns block number, block hash, transaction index, removed, address, data, topics, transaction hash and log index
  })
  }
}