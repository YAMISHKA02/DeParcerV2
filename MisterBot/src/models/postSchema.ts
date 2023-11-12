import { Schema, model, Document, Mongoose } from 'mongoose';

interface IPost {
  _cache_seconds: number;
  _seconds: number;
  _use_cache: boolean;
  data: any,
  error_code: number;
}

interface ResponseDataDocument extends IPost, Document {}


const responseDataSchema = new Schema<ResponseDataDocument>({
  _cache_seconds: { type: Number, required: true },
  _seconds: { type: Number, required: true },
  _use_cache: { type: Boolean, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  error_code: { type: Number, required: true },
});

const Post = model<ResponseDataDocument>('ResponseData', responseDataSchema, 'Post');

export { IPost, Post };
