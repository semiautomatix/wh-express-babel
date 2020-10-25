// @ts-ignore
import mongoose, { Document } from 'mongoose';
import { IRole } from './roles';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IUser extends Document {
    emailAddress: string;
    hash: string;
    firstName: string;
    lastName: string;
    active: boolean;
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
    token?: string;
    roles?: IRole[];
}

const schema = new Schema({
    emailAddress: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    active: { type: Boolean, required: true, default: true },
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
    token: { type: String },
    roles: [
        { type: ObjectId, ref: 'Role', index: true },
    ],
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model<IUser>('User', schema);