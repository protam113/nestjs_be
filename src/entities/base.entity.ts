import { Prop } from '@nestjs/mongoose';

export abstract class Base {
  @Prop({ default: () => new Date() })
  readonly createdAt!: Date;

  @Prop({ default: () => new Date() })
  readonly updatedAt!: Date;
}
