import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import Policies, { IPolicy } from '../models/policies';
import Users from '../models/users';

const customizationOptions = {
    resolvers: {
        createOne: {
            record: {
                removeFields: ['createdDate', 'createdBy']
            }
        },
    }
};

const PoliciesTC = composeWithMongoose(Policies, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

PoliciesTC.wrapResolverResolve('createOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = async (doc: IPolicy, resolveParams) => {
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

const updateBeforeRecordMutate = async (doc: IPolicy, resolveParams) => {
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

PoliciesTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

PoliciesTC.wrapResolverResolve('updateById', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

PoliciesTC.addRelation(
    'createdBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IPolicy) => source.createdBy,
        },
        projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

PoliciesTC.addRelation(
    'updatedBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IPolicy) => source.updatedBy,
        },
        projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

// schemaComposer.Query.addFields({
const queries = {
    policyById: PoliciesTC.getResolver('findById'),
    policyByIds: PoliciesTC.getResolver('findByIds'),
    policyOne: PoliciesTC.getResolver('findOne'),
    policyMany: PoliciesTC.getResolver('findMany'),
    policyCount: PoliciesTC.getResolver('count'),
    policyConnection: PoliciesTC.getResolver('connection'),
    policyPagination: PoliciesTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    policyCreateOne: PoliciesTC.getResolver('createOne'),
    policyCreateMany: PoliciesTC.getResolver('createMany'),
    policyUpdateById: PoliciesTC.getResolver('updateById'),
    policyUpdateOne: PoliciesTC.getResolver('updateOne'),
    policyUpdateMany: PoliciesTC.getResolver('updateMany'),
    policyRemoveById: PoliciesTC.getResolver('removeById'),
    policyRemoveOne: PoliciesTC.getResolver('removeOne'),
    policyRemoveMany: PoliciesTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };