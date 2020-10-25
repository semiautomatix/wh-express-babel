import { composeWithMongoose } from 'graphql-compose-mongoose';
import mongoose from 'mongoose';
import * as jwt from 'jsonwebtoken';
import debug from 'debug';

import Products from '../models/products';
import Outbounds, { IOutbound, IOutboundLine } from '../models/Outbounds';
import Users from '../models/users';

const log = debug('graphql:Outbounds:log');

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
const OutboundsTC = composeWithMongoose(Outbounds, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);

OutboundsTC.wrapResolverResolve('createOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = async (doc: IOutbound, resolveParams) => {
    const { token } = rp.context;
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

const updateBeforeRecordMutate = async (doc: IOutbound, resolveParams) => {
  const { token } = resolveParams.context;
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
  const updatedBy = await Users.findOne({ _id: decoded.sub });

  if (updatedBy != undefined) {
    doc.updatedBy = updatedBy;
    doc.updatedDate = new Date();
  } else {
    throw ('Updated by user is null');
  }

  // if (doc.status === 'accepted' && doc) {

  // }

  // TODO: add code to check new state change to prevent invalid state changes
  return doc;
};

OutboundsTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  return next(rp);
});

OutboundsTC.wrapResolverResolve('updateById', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  return next(rp);
});

const OutboundsProductsTC = OutboundsTC.getFieldOTC('lines');

OutboundsProductsTC.addRelation(
  'product',
  {
    resolver: () => ProductsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IOutboundLine) => source.product,
    },
    projection: { product: 1 }, // point fields in source object, which should be fetched from DB
  }
);

OutboundsTC.addRelation(
  'createdBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IOutbound) => source.createdBy,
    },
    projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

OutboundsTC.addRelation(
  'updatedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IOutbound) => source.updatedBy,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

// schemaComposer.Query.addFields({
const queries = {
  outboundById: OutboundsTC.getResolver('findById'),
  outboundByIds: OutboundsTC.getResolver('findByIds'),
  outboundOne: OutboundsTC.getResolver('findOne'),
  outboundMany: OutboundsTC.getResolver('findMany'),
  outboundCount: OutboundsTC.getResolver('count'),
  outboundConnection: OutboundsTC.getResolver('connection'),
  outboundPagination: OutboundsTC.getResolver('pagination'),
};

const mutations = {
  outboundCreateOne: OutboundsTC.getResolver('createOne'),
  outboundCreateMany: OutboundsTC.getResolver('createMany'),
  outboundUpdateById: OutboundsTC.getResolver('updateById'),
  outboundUpdateOne: OutboundsTC.getResolver('updateOne'),
  outboundUpdateMany: OutboundsTC.getResolver('updateMany'),
  outboundRemoveById: OutboundsTC.getResolver('removeById'),
  outboundRemoveOne: OutboundsTC.getResolver('removeOne'),
  outboundRemoveMany: OutboundsTC.getResolver('removeMany'),
};

export { mutations, queries };
