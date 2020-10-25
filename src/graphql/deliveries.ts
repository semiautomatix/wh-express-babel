import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { PubSub } from 'apollo-server-express';
import mongoose, { Document } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import debug from 'debug';

import Cartons, { ICarton } from '../models/cartons';
import Products from '../models/products';
import Deliveries, { IDelivery, IDeliveryLine } from '../models/deliveries';
import Suppliers from '../models/suppliers';
import Documents from '../models/documents';
import Users from '../models/users';
import Bins from '../models/locations';

const log = debug('graphql:deliveries:log');

const customizationOptions = {
  resolvers: {
    createOne: {
      record: {
        removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy']
      }
    },
  }
};

const CartonsTC = composeWithMongoose(Cartons, customizationOptions);
const ProductsTC = composeWithMongoose(Products, customizationOptions);
const DeliveriesTC = composeWithMongoose(Deliveries, {
  resolvers: {
    createOne: {
      record: {
        removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy']
      }
    },
    findMany: {
      filter: {
        filterTypeName: 'FilterFindManyDeliveryInput',
        operators: {
          'expectedDate': ['gt', 'gte', 'lt', 'lte', 'ne', 'in[]', 'nin[]']
        }
      },
    },
  }
});
const SuppliersTC = composeWithMongoose(Suppliers, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);
const DocumentsTC = composeWithMongoose(Documents, customizationOptions);

DeliveriesTC.wrapResolverResolve('createOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = async (doc: IDelivery, resolveParams) => {
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

  const payload = await next(rp);

  return payload;
});

const updateBeforeRecordMutate = async (doc: IDelivery, resolveParams) => {
  const { token } = resolveParams.context;
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
  const updatedBy = await Users.findOne({ _id: decoded.sub });

  if (updatedBy != undefined) {
    doc.updatedBy = updatedBy;
    doc.updatedDate = new Date();

    if (doc.waybill && doc.waybill.document) {
      doc.waybill.document.createdBy = updatedBy;
      doc.waybill.document.createdDate = new Date();
    }

    if (doc.invoice && doc.invoice.document) {
      doc.invoice.document.createdBy = updatedBy;
      doc.invoice.document.createdDate = new Date();
    }
  } else {
    throw ('Updated by user is null');
  }

  // if (doc.status === 'accepted' && doc) {

  // }

  // TODO: add code to check new state change to prevent invalid state changes
  return doc;
};

DeliveriesTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  const payload = await next(rp);

  // after mutation logic change `payload`
  // eg. payload.record will contain mongoose document
  // pubsub.publish(DELIVERY_UPDATED, { deliveryUpdated: payload });
  // sendMessage(payload);

  return payload;
});

DeliveriesTC.wrapResolverResolve('updateById', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;


  const payload = next(rp);

  // after mutation logic change `payload`
  // eg. payload.record will contain mongoose document
  // pubsub.publish(DELIVERY_UPDATED, { deliveryUpdated: payload });
  // sendMessage(payload);

  return payload;
});

DeliveriesTC.wrapResolverResolve('updateById', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;


  const payload = next(rp);

  // after mutation logic change `payload`
  // eg. payload.record will contain mongoose document
  // pubsub.publish(DELIVERY_UPDATED, { deliveryUpdated: payload });
  // sendMessage(payload);

  return payload;
});

DeliveriesTC.addRelation(
  'createdBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IDelivery) => source.createdBy,
    },
    projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

DeliveriesTC.addRelation(
  'updatedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IDelivery) => source.updatedBy,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

DeliveriesTC.addRelation(
  'receivedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IDelivery) => source.receivedBy,
    },
    projection: { receivedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

DeliveriesTC.addRelation(
  'supplier',
  {
    resolver: () => SuppliersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IDelivery) => source.supplier,
    },
    projection: { supplier: 1 }, // point fields in source object, which should be fetched from DB
    sort: 'supplierName'
  }
);


DeliveriesTC.addRelation(
  'cartons',
  {
    resolver: () => CartonsTC.getResolver('findByIds'),
    prepareArgs: {
      _ids: (source: IDelivery) => source.cartons || [],
    },
    projection: { product: true }, // point fields in source object, which should be fetched from DB
  }
);

const DeliveriesWaybillTC = DeliveriesTC.getFieldOTC('waybill');

DeliveriesWaybillTC.addRelation(
  'document',
  {
    resolver: () => DocumentsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: any) => source.document && source.document._id,
    },
    projection: { document: true }, // point fields in source object, which should be fetched from DB
  }
);

const DeliveriesInvoiceTC = DeliveriesTC.getFieldOTC('invoice');

DeliveriesInvoiceTC.addRelation(
  'document',
  {
    resolver: () => DocumentsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: any) => source.document && source.document._id,
    },
    projection: { document: true }, // point fields in source object, which should be fetched from DB
  }
);

const DeliveriesLinesTC = DeliveriesTC.getFieldOTC('lines');

DeliveriesLinesTC.addRelation(
  'product',
  {
    resolver: () => ProductsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IDeliveryLine) => source.product,
    },
    projection: { product: 1 }, // point fields in source object, which should be fetched from DB
  }
);

DeliveriesTC.addResolver({
  kind: 'mutation',
  name: 'acceptDelivery',
  args: {
    deliveryId: 'String!',
    numberOfCartons: 'Int!'
  },
  type: DeliveriesTC as any, // array
  resolve: async ({ args, context }) => {
    const { deliveryId, numberOfCartons }: { deliveryId: string, numberOfCartons: number } = args;
    const { token } = context;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');

    // const delivery: IDelivery = await Deliveries.findById(deliveryId).exec();
    const delivery: IDelivery | null = await Deliveries.findById(deliveryId);

    if (delivery) {
      const createdBy = await Users.findById(decoded.sub);
      const updatedBy = await Users.findById(decoded.sub);

      if (updatedBy != undefined) {
        delivery.updatedBy = updatedBy;
        delivery.updatedDate = new Date();
      } else {
        throw ('Updated by user is null');
      }

      if (createdBy == undefined) {
        throw ('Created by user is null');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      const receivingLocation = await Bins.findOne({ name: 'Receiving'});

      log('receivingLocation', receivingLocation);

      // create cartons
      const cartons = await Promise.all(Array.from(Array(numberOfCartons).keys()).map(
        async (index: number): Promise<ICarton> =>
          await Cartons.create({
            createdBy,
            createdDate: new Date(),
            status: 'unassigned',
            cartonNumber: index + 1,
            bin: receivingLocation,
            delivery: deliveryId
          })
      ));

      delivery.status = 'accepted';
      delivery.cartons = cartons;
      delivery.deliveredDate = new Date();

      // @ts-ignore
      // const result = await Deliveries.updateOne({ _id: deliveryId }, delivery).exec();
      const result = Deliveries.findOneAndUpdate({ _id: delivery._id }, delivery);

      await session.commitTransaction();
      session.endSession();

      return result;
    } else {
      throw('Delivery not found');
    }
  },
});

// remove audit fields
// DeliveriesTC.getResolver('updateOneWithCartons').getArgITC('cartons').removeField(['updatedDate', 'updatedBy', 'createdDate', 'createdBy']);
// DeliveriesTC.getResolver('acceptDelivery').getArgITC('delivery').removeField(['createdDate', 'createdBy']);

/*
const deliveryPaginationResolver = DeliveriesTC.getResolver('pagination').addFilterArg({
  name: 'supplierName',
  type: 'String',
  description: 'Search by supplier name',
  query: (rawQuery, value) => {
    rawQuery['supplier.supplierName'] = value;
  }
})
*/

// schemaComposer.Query.addFields({
const queries = {
  // deliveryBetweenDate: DeliveriesTC.getResolver('findBetweenDate'),
  deliveryById: DeliveriesTC.getResolver('findById'),
  deliveryByIds: DeliveriesTC.getResolver('findByIds'),
  deliveryOne: DeliveriesTC.getResolver('findOne'),
  deliveryMany: DeliveriesTC.getResolver('findMany'),
  deliveryCount: DeliveriesTC.getResolver('count'),
  deliveryConnection: DeliveriesTC.getResolver('connection'),
  deliveryPagination: DeliveriesTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
  deliveryAccept: DeliveriesTC.getResolver('acceptDelivery'),
  // TG add for count deliveryUpdateOneWithCartons: DeliveriesTC.getResolver('createOneInventoryCount'),
  deliveryCreateOne: DeliveriesTC.getResolver('createOne'),
  deliveryCreateMany: DeliveriesTC.getResolver('createMany'),
  deliveryUpdateById: DeliveriesTC.getResolver('updateById'),
  deliveryUpdateOne: DeliveriesTC.getResolver('updateOne'),
  deliveryUpdateMany: DeliveriesTC.getResolver('updateMany'),
  deliveryRemoveById: DeliveriesTC.getResolver('removeById'),
  deliveryRemoveOne: DeliveriesTC.getResolver('removeOne'),
  deliveryRemoveMany: DeliveriesTC.getResolver('removeMany'),
};
// });

/*const subscriptions = {
 deliveryAdded: {
   // Additional event labels can be passed to asyncIterator creation
   subscribe: () => pubsub.asyncIterator([DELIVERY_ADDED]),
 },
 deliveryUpdated: {
   // Additional event labels can be passed to asyncIterator creation
   subscribe: () => pubsub.asyncIterator([DELIVERY_UPDATED]),
 }
}*/

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

// export { mutations, queries, subscriptions };
export { mutations, queries };
