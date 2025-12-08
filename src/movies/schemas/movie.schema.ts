import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MovieDocument = Movie & Document;

@Schema({ timestamps: true })
export class Movie {
  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  publishYear: number;

  @Prop({ required: true })
  imageURL: string;

  @Prop({ required: true })
  createdBy: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
