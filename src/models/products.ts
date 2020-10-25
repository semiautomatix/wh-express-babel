// @ts-ignore
import mongoose from 'mongoose';
import { ILocation } from './locations';
import { IUser } from './users';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IProduct extends Document {
    name: string;
    sku: string;
    ibc: string;
    costPrice?: number;
    attribute1?: string;
    attribute2?: string;
    attribute3?: string;
    attribute4?: string;
    attribute5?: string;
    attribute6?: string;
    attribute7?: string;
    attribute8?: string;
    attribute9?: string;
    attribute10?: string;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    locations: [{
        location?: ILocation,
        quantity: number,
        createdDate: Date,
        createdBy: IUser,
        updatedDate?: Date,
        updatedBy?: IUser,
    }];
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

const schema = new Schema({
    name: { type: String, required: true },
    sku: { type: String, unique: true, required: true },
    ibc: { type: String, unique: true, required: true },
    costPrice: { type: Number },
    attribute1: { type: String },
    attribute2: { type: String },
    attribute3: { type: String },
    attribute4: { type: String },
    attribute5: { type: String },
    attribute6: { type: String },
    attribute7: { type: String },
    attribute8: { type: String },
    attribute9: { type: String },
    attribute10: { type: String },
    weight: { type: Number },
    length: { type: Number },
    height: { type: Number },
    width: { type: Number },
    locations: [{
        location: { type: ObjectId, ref: 'Location', required: true }, // can this be location, i.e. bin or basket?
        quantity: { type: Number, default: 0, required: true },
        createdDate: { type: Date, default: Date.now, required: true },
        createdBy: { type: ObjectId, ref: 'User', required: true },
        updatedDate: { type: Date },
        updatedBy: { type: ObjectId, ref: 'User' },
    }],
    // events: [],
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
    // hash: { type: String, required: true }
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', schema);