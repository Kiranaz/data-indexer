import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Contract {
  @Prop({ required: true })
  contractAddress: string;

  @Prop({ required: true })
  startBlock: number;

  @Prop({ required: true })
  indexerName: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false, default: false })
  isSynced: boolean;

  @Prop({ required: true })
  events: Array<any>;

  @Prop({ required: true })
  pastEvents: Array<any>;
}
export const ContractSchema = SchemaFactory.createForClass(Contract);
