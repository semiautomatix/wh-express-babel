import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import Documents, { IDocument } from '../models/documents';
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

const DocumentsTC = composeWithMongoose(Documents, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

DocumentsTC.wrapResolverResolve('createOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = async (doc: IDocument, resolveParams) => {
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

const updateBeforeRecordMutate = async (doc: IDocument, resolveParams) => {
    const { token } = resolveParams.context;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
    const updatedBy = await Users.findOne({ _id: decoded.sub });

    /*if (updatedBy != undefined) {
        doc.updatedBy = updatedBy;
        doc.updatedDate = new Date();
    } else {
        throw ('Updated by user is null');
    }*/

    return doc;
};

DocumentsTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

DocumentsTC.wrapResolverResolve('updateById', (next) => async (rp) => {
    // extend resolve params with hook
    rp.beforeRecordMutate = updateBeforeRecordMutate;

    return next(rp);
});

DocumentsTC.addRelation(
    'createdBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IDocument) => source.createdBy,
        },
        projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);

/*DocumentsTC.addRelation(
    'updatedBy',
    {
        resolver: () => UsersTC.getResolver('findById'),
        prepareArgs: {
            _id: (source: IDocument) => source.updatedBy,
        },
        projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
    }
);*/

// schemaComposer.Query.addFields({
const queries = {
    documentById: DocumentsTC.getResolver('findById'),
    documentByIds: DocumentsTC.getResolver('findByIds'),
    documentOne: DocumentsTC.getResolver('findOne'),
    documentMany: DocumentsTC.getResolver('findMany'),
    documentCount: DocumentsTC.getResolver('count'),
    documentConnection: DocumentsTC.getResolver('connection'),
    documentPagination: DocumentsTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    documentCreateOne: DocumentsTC.getResolver('createOne'),
    documentCreateMany: DocumentsTC.getResolver('createMany'),
    documentUpdateById: DocumentsTC.getResolver('updateById'),
    documentUpdateOne: DocumentsTC.getResolver('updateOne'),
    documentUpdateMany: DocumentsTC.getResolver('updateMany'),
    documentRemoveById: DocumentsTC.getResolver('removeById'),
    documentRemoveOne: DocumentsTC.getResolver('removeOne'),
    documentRemoveMany: DocumentsTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };