export class InitializeContractDto {
  contractAddress: string;
  startBlock: number;
  contractABI: string;
  userName: string;
  indexerName: string;
  description: string;
}

export class QueryEventsDto {
  query: any[];
}
