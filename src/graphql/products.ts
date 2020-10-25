import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import Products, { IProduct } from '../models/products';
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

const ProductsTC = composeWithMongoose(Products, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

ProductsTC.wrapResolverResolve('createOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = async (doc: IProduct, resolveParams) => {
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

const updateBeforeRecordMutate = async (doc: IProduct, resolveParams) => {
  const { token } = resolveParams.context;
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
  const updatedBy = await Users.findOne({ _id: decoded.sub });

  if (updatedBy != undefined) {
    doc.updatedBy = updatedBy;
    doc.updatedDate = new Date();
  } else {
      throw('Updated by user is null');
  }

  return doc;
};

ProductsTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  return next(rp);
});

ProductsTC.wrapResolverResolve('updateById', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  return next(rp);
});

ProductsTC.addRelation(
  'createdBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IProduct) => source.createdBy,
    },
    projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

ProductsTC.addRelation(
  'updatedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IProduct) => source.updatedBy,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

// schemaComposer.Query.addFields({
const queries = {
  productById: ProductsTC.getResolver('findById'),
  productByIds: ProductsTC.getResolver('findByIds'),
  productOne: ProductsTC.getResolver('findOne'),
  productMany: ProductsTC.getResolver('findMany'),
  productCount: ProductsTC.getResolver('count'),
  productConnection: ProductsTC.getResolver('connection'),
  productPagination: ProductsTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
  productCreateOne: ProductsTC.getResolver('createOne'),
  productCreateMany: ProductsTC.getResolver('createMany'),
  productUpdateById: ProductsTC.getResolver('updateById'),
  productUpdateOne: ProductsTC.getResolver('updateOne'),
  productUpdateMany: ProductsTC.getResolver('updateMany'),
  productRemoveById: ProductsTC.getResolver('removeById'),
  productRemoveOne: ProductsTC.getResolver('removeOne'),
  productRemoveMany: ProductsTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };