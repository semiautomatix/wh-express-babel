import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import { Bin, IBin } from '../models/locations';
import Users, { IUser } from '../models/users';

const customizationOptions = {
    resolvers: {
        createOne: {
            record: {
                removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy']
            }
        },
    }
};

const BinsTC = composeWithMongoose(Bin, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

BinsTC.wrapResolverResolve('createOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = async (doc: IBin, resolveParams) => {
        const { token } = resolveParams.context;
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
        const createdBy: IUser | null = await Users.findOne({ _id: decoded.sub });

        if (createdBy != undefined) {
            doc.createdBy = createdBy;
        } else {
            throw ('Created by user is null');
        }

        return doc;
    };

    return next(rp);
});

const updateBeforeRecordMutate = async (doc: IBin, resolveParams) => {
    const { token } = resolveParams.context;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
    const updatedBy: IUser | null = await Users.findOne({ _id: decoded.sub });

    if (updatedBy != undefined) {
        doc.updatedBy = updatedBy;
        doc.updatedDate = new Date();
    } else {
        throw ('Updated by user is null');
    }

    return doc;
};

BinsTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

BinsTC.wrapResolverResolve('updateById', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

BinsTC.addRelation(
    'createdBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IBin) => source.createdBy,
        },
        projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

BinsTC.addRelation(
    'updatedBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IBin) => source.updatedBy,
        },
        projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

// schemaComposer.Query.addFields({
const queries = {
    binById: BinsTC.getResolver('findById'),
    binByIds: BinsTC.getResolver('findByIds'),
    binOne: BinsTC.getResolver('findOne'),
    binMany: BinsTC.getResolver('findMany'),
    binCount: BinsTC.getResolver('count'),
    binConnection: BinsTC.getResolver('connection'),
    binPagination: BinsTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    binCreateOne: BinsTC.getResolver('createOne'),
    binCreateMany: BinsTC.getResolver('createMany'),
    binUpdateById: BinsTC.getResolver('updateById'),
    binUpdateOne: BinsTC.getResolver('updateOne'),
    binUpdateMany: BinsTC.getResolver('updateMany'),
    binRemoveById: BinsTC.getResolver('removeById'),
    binRemoveOne: BinsTC.getResolver('removeOne'),
    binRemoveMany: BinsTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };