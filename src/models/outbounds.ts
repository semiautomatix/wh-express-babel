// @ts-ignore
import mongoose, { Document } from 'mongoose';
import { IUser } from './users';
import { IProduct } from './products';
import { IBasket } from './locations';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IOutbound extends Document {
    outboundNumber?: string;
    courier?: string;
    driver?: string;
    licenseNumber?: string;
    registrationNumber?: string;
    waybill?: {
        number: string,
    };
    // documents
    lines: IOutboundLine[];
    picks: IOutboundPick[];
    packs: IOutboundPack[];
    notes?: string;
    status?: ['created', 'picking', 'picked', 'packing', 'packed', 'cancelled'];
    createdDate: Date;
    createdBy: IUser;
    updatedDate?: Date;
    updatedBy?: IUser;
}

export interface IOutboundPick {
    picker: IUser;
    pickDate: Date;
    lines: IOutboundLine[];
    basket?: IBasket;
    status: ['assigned_to_picker', 'with_picker', 'assigned_to_packer', 'with_packer'];
}

export interface IOutboundPack {
    packer: IUser;
    packDate: Date;
    lines: IOutboundLine[];
    status: ['with_packer', 'packed'];
}

export interface IOutboundLine {
    product: IProduct;
    quantity: number;
}

const schema = new Schema({
    outboundNumber: {
        type: String,
        unique: true,
        index: true
    },
    courier: { type: String },
    driver: { type: String },
    licenseNumber: { type: String },
    registrationNumber: { type: String },
    waybill: {
        number: { type: String },
        // document: { type: File }, // Document type
    },
    lines: [{
        product: { type: ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
    }],
    picks: [{
        picker: { type: ObjectId, ref: 'User', required: true },
        pickDate: { type: Date, default: Date.now, required: true },
        lines: [{
            product: { type: ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
        }],
        basket: { type: ObjectId, ref: 'Basket' },
        status: {
            type: String,
            enum: ['assigned_to_picker', 'with_picker', 'assigned_to_packer', 'with_packer'],
            required: true,
            default: 'expected',
            index: true
        },
    }],
    packs: [{
        packer: { type: ObjectId, ref: 'User', required: true },
        packDate: { type: Date, default: Date.now, required: true },
        lines: [{
            product: { type: ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
        }],
        status: {
            type: String,
            enum: ['with_picker', 'assigned_to_packer', 'with_packer'],
            required: true,
            default: 'expected',
            index: true
        },
    }],
    notes: { type: String },
    // documents: [Document],
    status: {
        type: String,
        enum: ['created', 'picking', 'picked', 'packing', 'packed', 'cancelled'],
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

export default mongoose.model('Outbound', schema);