import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import Suppliers, { ISupplier } from '../models/suppliers';
import Users from '../models/users';

const customizationOptions = {
    resolvers: {
        createOne: {
            record: {
                removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy']
            }
        },
    }
};

const SuppliersTC = composeWithMongoose(Suppliers, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

SuppliersTC.wrapResolverResolve('createOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = async (doc: ISupplier, resolveParams) => {
        const { token } = resolveParams.context;
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
        const createdBy = await Users.findOne({ _id: decoded.sub });

        if (createdBy != undefined) {
            doc.createdBy = createdBy;
        } else {
            throw ('Created by user is null');
        }

        return doc;
    };

    return next(rp);
});

const updateBeforeRecordMutate = async (doc: ISupplier, resolveParams) => {
    const { token } = resolveParams.context;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
    const updatedBy = await Users.findOne({ _id: decoded.sub });

    if (updatedBy != undefined) {
        doc.updatedBy = updatedBy;
        doc.updatedDate = new Date();
    } else {
        throw ('Updated by user is null');
    }

    return doc;
};

SuppliersTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

SuppliersTC.wrapResolverResolve('updateById', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

SuppliersTC.addRelation(
    'createdBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: ISupplier) => source.createdBy,
        },
        projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

SuppliersTC.addRelation(
    'updatedBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: ISupplier) => source.updatedBy,
        },
        projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

// schemaComposer.Query.addFields({
const queries = {
    supplierById: SuppliersTC.getResolver('findById'),
    supplierByIds: SuppliersTC.getResolver('findByIds'),
    supplierOne: SuppliersTC.getResolver('findOne'),
    supplierMany: SuppliersTC.getResolver('findMany'),
    supplierCount: SuppliersTC.getResolver('count'),
    supplierConnection: SuppliersTC.getResolver('connection'),
    supplierPagination: SuppliersTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    supplierCreateOne: SuppliersTC.getResolver('createOne'),
    supplierCreateMany: SuppliersTC.getResolver('createMany'),
    supplierUpdateById: SuppliersTC.getResolver('updateById'),
    supplierUpdateOne: SuppliersTC.getResolver('updateOne'),
    supplierUpdateMany: SuppliersTC.getResolver('updateMany'),
    supplierRemoveById: SuppliersTC.getResolver('removeById'),
    supplierRemoveOne: SuppliersTC.getResolver('removeOne'),
    supplierRemoveMany: SuppliersTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };