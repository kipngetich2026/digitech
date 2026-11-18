import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RevokedTokenDocument = HydratedDocument<RevokedToken>;

@Schema({
  timestamps: true,
  collection: 'revoked_tokens',
})
export class RevokedToken {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  jti: string;

  @Prop({
    type: Date,
    required: true,
    expires: 0,
  })
  expiresAt: Date;
}

export const RevokedTokenSchema =
  SchemaFactory.createForClass(RevokedToken);
