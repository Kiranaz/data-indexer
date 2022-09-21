# Data Indexer

### Syncing Solution of On-chain and Off-chain Data

While working on Dapps, most of the times we need synchronized on-chain and off-chain, so to perform further operations on the data. For example, if we want to show the list of all the users who have staked their tokens, we need to fetch the list of all the stakers from the smart contract and then fetch the details of each staker from the off-chain database. This is a very common use case and we need to solve this problem in a scalable way.
So, initially we come with the idea of using a centralized database, and create our own data indexer which will listen to the events emitted by the smart contract and update the database accordingly as well as store extra/ off-chain data.

![DataIndexer-Usecase](https://user-images.githubusercontent.com/41319684/191402755-da386dd7-3aa1-4ef7-9aee-f041efc2c427.png)

# Breakdown of Idea into simpler chunks
We can break down the idea into simpler chunks and then we can implement them one by one.

1. Since, Our concern is about synchronization of on-chain and off-chain data both, we opted to first extract on-chain data.
2. Listen to the events emitted by the smart contract.
3. Decode the events.
4. Create a database which will listen to the events emitted by the smart contract and update the database accordingly.
5. Create a data fetcher which will fetch the data from the database and return it to the user.

## First Strategy
Just to get the logs of the transaction of a single contract. (real-time/current).
It used to require contract initialization, which require heavy computation and time and we can’t expect this to execute when we have multiple contracts to listen.

## Second Strategy
We shifted our strategy to read block by block.
Filter all the transactions of the block, whether it has our contract’s transaction or not.
Again, filtration requires a lot of processing.
Would be useful when we have many contracts to listen, probability of getting transactions in each block would be more.
What if, processing block could take up time more than 15 seconds.. A con.

# How are we doing now?
Getting logs of each contract without the need of contract initialization as we fetch required information from contract ABI on our own.
Just logs are not enough to identify which function was executed under the hood.
We need to decode the logs to get the function name and its arguments.
While decoding process, we got to know about event topics, indexed inputs, non-indexed inputs, and how to decode them.\
Indexed → Will be stored as separate topic (First one is always event topic)\
Non-Indexed → You’ll have to decode data field
```
  const decoder = new AbiCoder();
    const decodedLogs = logs?.map((log: any) => {
      let decodedTopics: any[] = event.indexedInputs?.map((input: any) => {
        const value = decoder?.decode(
          [input?.type],
          log.topics[event.indexedInputs.indexOf(input) + 1],
        );
        return { [input.name]: value };
      });

      const decodedDataRaw = decoder?.decode(event.unindexedInputs, log.data);
      const decodedData = event.unindexedInputs?.map((input: any, i: any) => {
        return { [input.name]: decodedDataRaw[i] };
      });
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
