import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Contract {
  @Prop({ required: true })
  contractAddress: string;

  @Prop({ required: true })
  startBlock: number;

  @Prop({ required: true })
  events: any[];
}
export const ContractSchema = SchemaFactory.createForClass(Contract);
