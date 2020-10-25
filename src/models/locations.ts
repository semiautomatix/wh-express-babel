// @ts-ignore
import mongoose from 'mongoose';
import { IUser } from './users';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const options = {discriminatorKey: 'kind'};

export interface ILocation extends Document {
  name: string;
  createdDate: Date;
  createdBy: IUser;
  updatedDate?: Date;
  updatedBy?: IUser;
}

const locationSchema = new Schema({
    name: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    // ibc: { type: String, unique: true, required: true },
    active: { type: Boolean, default: true, required: true },
    createdDate: { type: Date, default: Date.now, required: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedDate: { type: Date },
    updatedBy: { type: ObjectId, ref: 'User' },
}, options);

locationSchema.set('toJSON', { virtuals: true });

const Location = mongoose.model('Location', locationSchema);

export interface IBin extends ILocation {
  coordinates: string;
}

const Bin = Location.discriminator('Bin',
  new mongoose.Schema({ coordinates: String }, options));

export interface IBasket extends ILocation {
  status: string;
  assignedUser: IUser;
}

const Basket = Location.discriminator('Basket',
  new mongoose.Schema({
    status: { type: String, enum: ['unassigned', 'assigned_to_shelver', 'with_shelver', 'assigned_to_inventory_clerk', 'with_inventory_clerk'], required: true }, // assigned-to-picker/packer, with-picker/packer
    assignedUser: { type: ObjectId, ref: 'User' }
  }, options)
);

export {
  Bin,
  Basket
};

export default Location;