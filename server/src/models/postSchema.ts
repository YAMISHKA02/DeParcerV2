import { Schema, model, Document, Mongoose } from 'mongoose';

interface Post {
  _cache_seconds: number;
  _seconds: number;
  _use_cache: boolean;
  data: any,
  error_code: number;
}

interface ResponseDataDocument extends Post, Document {}


const responseDataSchema = new Schema<ResponseDataDocument>({
  _cache_seconds: { type: Number, required: true },
  _seconds: { type: Number, required: true },
  _use_cache: { type: Boolean, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  error_code: { type: Number, required: true },
});

const ResponseDataModel = model<ResponseDataDocument>('ResponseData', responseDataSchema, 'Post');

export { Post, ResponseDataModel };
