import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import Roles, { IRole } from '../models/roles';
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

const RolesTC = composeWithMongoose(Roles, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);
const PoliciesTC = composeWithMongoose(Policies, customizationOptions);

RolesTC.wrapResolverResolve('createOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = async (doc: IRole, resolveParams) => {
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

const updateBeforeRecordMutate = async (doc: IRole, resolveParams) => {
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

RolesTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

RolesTC.wrapResolverResolve('updateById', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

RolesTC.addRelation(
    'policies',
    {
      resolver: () => PoliciesTC.getResolver('findByIds'),
      prepareArgs: {
        _ids: (source: IRole) => source.policies || [],
      },
      projection: { policy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

RolesTC.addRelation(
    'createdBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IRole) => source.createdBy,
        },
        projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

RolesTC.addRelation(
    'updatedBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IRole) => source.updatedBy,
        },
        projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

// schemaComposer.Query.addFields({
const queries = {
    roleById: RolesTC.getResolver('findById'),
    roleByIds: RolesTC.getResolver('findByIds'),
    roleOne: RolesTC.getResolver('findOne'),
    roleMany: RolesTC.getResolver('findMany'),
    roleCount: RolesTC.getResolver('count'),
    roleConnection: RolesTC.getResolver('connection'),
    rolePagination: RolesTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    roleCreateOne: RolesTC.getResolver('createOne'),
    roleCreateMany: RolesTC.getResolver('createMany'),
    roleUpdateById: RolesTC.getResolver('updateById'),
    roleUpdateOne: RolesTC.getResolver('updateOne'),
    roleUpdateMany: RolesTC.getResolver('updateMany'),
    roleRemoveById: RolesTC.getResolver('removeById'),
    roleRemoveOne: RolesTC.getResolver('removeOne'),
    roleRemoveMany: RolesTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };