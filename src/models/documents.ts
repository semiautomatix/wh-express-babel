// @ts-ignore
import mongoose from 'mongoose';
import { IUser } from './users';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IDocument extends Document {
    filePath: string;
    contentType: string;
    fileName: string;
    createdDate: Date;
    createdBy: IUser;
  }

const schema = new Schema({
    // data: { type: String, unique: true, required: true },
    // contentType: { type: String, unique: true },
    filePath: { type: String, unique: true },
    contentType: { type: String, unique: false },
    fileName: { type: String, unique: false },
    createdBy: { type: ObjectId, ref: 'User', required: false },
    createdDate: { type: Date, required: false },
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model('Document', schema);