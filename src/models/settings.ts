// @ts-ignore
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    name: String!,
    value: String,
    type: String,
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: ObjectId, ref: 'User' },
    // hash: { type: String, required: true },
});

schema.set('toJSON', { virtuals: true });

export default mongoose.model('Settings', schema);