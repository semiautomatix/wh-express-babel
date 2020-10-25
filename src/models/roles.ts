// @ts-ignore
import mongoose from 'mongoose';
import { IUser } from './users';
import { IPolicy } from './policies';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IRole extends Document {
    roleName: string;
    roleDescription?: string;
    policies: IPolicy[];
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

const schema = new Schema({
    roleName: { type: String, unique: true, required: true },
    roleDescription: { type: String, unique: true },
    // we could add other details
    policies: [
        { type: ObjectId, ref: 'Policy', required: true },
    ],
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
    // hash: { type: String, required: true },
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model('Role', schema);