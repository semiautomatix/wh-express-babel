// @ts-ignore
import mongoose, { Document } from 'mongoose';
import debug from 'debug';

import { IUser } from './users';
import { IBin } from './locations';
import { IProduct } from './products';
import { IDelivery } from './deliveries';
import { Timestamp } from 'bson';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const log = debug('models:cartons:log');

export interface ICarton extends Document {
    bin?: IBin;
    cartonNumber: number;
    // contents: [{
    //  product: IProduct,
    //  counted: number
    // }];
    notes?: string;
    status: string;
    inventoryCount?: [ICartonInventoryCount];
    delivery: IDelivery;
    assignedUser?: IUser;
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

export interface ICartonInventoryCount {
    inventoryClerk: IUser;
    inventoryCountDate: Timestamp;
    counted: [ICartonInventoryCountCounted];
}

export interface ICartonInventoryCountCounted {
    product: IProduct;
    count: number;
}

const schema = new Schema({
    bin: {
        type: ObjectId,
        ref: 'Bin',
        index: true
    }, // if located in a bin
    // TG contents to be recorded on order line
    // contents: [{
    //    product: { type: ObjectId, ref: 'Product' },
    //    counted: { type: Number },
    // }],
    // TG add number and notes here
    cartonNumber: {
        type: Number,
        required: true,
        index: true
    },
    notes: { type: String },
    status: {
        type: String,
        enum: ['unassigned', 'created', 'assigned_to_shelver', 'with_shelver', 'assigned_to_inventory_clerk', 'with_inventory_clerk', 'counted'],
        required: true,
        default: 'created',
        index: true
    },
    inventoryCount: [{
        inventoryClerk: { type: ObjectId, ref: 'User', required: true },
        inventoryCountDate: { type: Date, default: Date.now, required: true },
        counted: [{
            product: { type: ObjectId, ref: 'Product', required: true },
            count: { type: Number }
        }]
    }],
    delivery: { type: ObjectId, ref: 'Delivery', required: true },
    assignedUser: { type: ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
});

// schema.virtual('delivery').get(function (this: { _id: string }) {
//    return deliveries.findOne({ 'cartons.carton': mongoose.Types.ObjectId(this._id) });
// });

/*schema.virtual('cartonNumber').get(async function (this: { _id: string }) {
    const result = (await deliveries.findOne({ 'cartons.carton': mongoose.Types.ObjectId(this._id) })) as any;
    if (result) {
        const carton = result.cartons.find(
            (carton: any) => carton.carton.equals(this._id)
        );
        if (carton) return carton.cartonNumber;
    }
    return undefined;
});*/


schema.set('toJSON', { virtuals: true });

export default mongoose.model<ICarton>('Carton', schema);