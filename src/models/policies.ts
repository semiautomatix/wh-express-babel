// @ts-ignore
import mongoose from 'mongoose';
import { IUser } from './users';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IPolicy extends Document {
    policyName: string;
    policyDescription?: string;
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

const schema = new Schema({
    policyName: { type: String, unique: true, required: true },
    policyDescription: { type: String, unique: true },
    // we could add other details
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
    // hash: { type: String, required: true },
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model('Policy', schema);