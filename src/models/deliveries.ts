// @ts-ignore
import mongoose, { Document } from 'mongoose';
import { IUser } from './users';
import { ISupplier } from './suppliers';
import { IProduct } from './products';
import { ICarton } from './cartons';
import { IDocument } from './documents';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IDelivery extends Document {
    orderNumber?: string;
    supplier: ISupplier;
    expectedDate: Date;
    deliveredDate?: Date;
    receivedBy?: IUser;
    courier?: string;
    driver?: string;
    licenseNumber?: string;
    registrationNumber?: string;
    shortDescription?: string;
    waybill?: {
        number: string,
        document?: IDocument
    };
    invoice?: {
        number: string,
        document?: IDocument
    };
    lines: [{
        product: IProduct,
        expectedQuantity: { type: Number, required: true },
    }];
    expectedNoOfCartons: number;
    cartons: ICarton[];
    notes?: string;
    status?: string;
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

export interface IDeliveryLine {
    product: IProduct;
    expectedQuantity: number;
}

const schema = new Schema({
    orderNumber: {
        type: String,
        unique: true,
        index: true
    },
    supplier: { type: ObjectId, ref: 'Supplier', required: true, index: true },
    expectedDate: { type: Date, required: true, index: true },
    deliveredDate: { type: Date },
    receivedBy: { type: ObjectId, ref: 'User' },
    courier: { type: String },
    driver: { type: String },
    licenseNumber: { type: String },
    registrationNumber: { type: String },
    shortDescription: { type: String },
    waybill: {
        number: { type: String },
        document: { type: ObjectId, ref: 'Document', required: false },
    },
    invoice: {
        number: { type: String },
        document: { type: ObjectId, ref: 'Document', required: false },
    },
    // TG change products to delivery lines
    lines: [{
        product: { type: ObjectId, ref: 'Product', required: true },
        expectedQuantity: { type: Number, required: true },
    }],
    // products: [{
    //    product: { type: ObjectId, ref: 'Product', required: true },
    //    expectedQuantity: { type: Number, required: true },
        // TG
        // inventory: [{
        //    inventoryClerk: { type: ObjectId, ref: 'User', required: true },
        //    inventoryCountDate: { type: Date, default: Date.now, required: true },
        //    count: { type: Number }
        //    carton: { type: ObjectId, ref: 'Carton', required: true, unique: true },
        // }]
    // }],
    // TG remove inventory count and add directly to lines
    // inventoryCount: [{
    //    inventoryClerk: { type: ObjectId, ref: 'User', required: true },
    //    inventoryCountDate: { type: Date, default: Date.now, required: true },
    //    carton: { type: ObjectId, ref: 'Carton', required: true },
    //    counted: [{
    //        product: { type: ObjectId, ref: 'Product', required: true },
    //        count: { type: Number }
    //    }]
    // }],
    expectedNoOfCartons: { type: Number },
    // TG remove exctraneous outer carton
    cartons: [
        { type: ObjectId, ref: 'Carton', required: true },
    ],
    // cartons: [
    //    {
    //        cartonNumber: {
    //            type: Number,
    //            required: true,
    //            unique: true,
    //            index: true
    //        },
    //        carton: { type: ObjectId, ref: 'Carton', required: true, unique: true },
    //        notes: { type: String }
    //    }
    // ],
    notes: { type: String },
    // documents: [Document],
    status: {
        type: String,
        enum: ['cancelled', 'expected', 'received', 'accepted', 'counted'],
        required: true,
        default: 'expected',
        index: true
    },
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
    // hash: { type: String, required: true }
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model<IDelivery>('Delivery', schema);