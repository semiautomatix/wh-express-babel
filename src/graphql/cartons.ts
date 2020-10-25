import { composeWithMongoose } from 'graphql-compose-mongoose';
import * as jwt from 'jsonwebtoken';
import debug from 'debug';
import RedisSMQ from 'rsmq';

import Bins from '../models/locations';
import Cartons, { ICarton, ICartonInventoryCount, ICartonInventoryCountCounted } from '../models/cartons';
import Users from '../models/users';
import Deliveries, { IDelivery } from '../models/deliveries';
import Product from '../models/products';

const log = debug('graphql:cartons:log');

// const pubsub = new PubSub();
// const DELIVERY_ADDED = 'DELIVERY_ADDED';
// const DELIVERY_UPDATED = 'DELIVERY_UPDATED';
const rsmq = new RedisSMQ({ host: '127.0.0.1', port: 6379, ns: 'asmalls' });
rsmq.createQueue({ qname: 'deliveries' }, function (err, resp) {
  if (err) {
    console.error(err);
    return;
  }

  if (resp === 1) {
    log('deliveries queue created');
  }
});

const sendMessage = (message: any) => {
  rsmq.sendMessage({ qname: 'deliveries', message }, function (err, resp) {
    if (err) {
      console.error(err);
      return;
    }

    console.log('Message sent. ID:', resp);
  });
};

const customizationOptions = {
  resolvers: {
    createOne: {
      record: {
        removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy']
      }
    },
  }
};

const BinsTC = composeWithMongoose(Bins, customizationOptions);
const CartonsTC = composeWithMongoose(Cartons, customizationOptions);
const UsersTC = composeWithMongoose(Users, customizationOptions);
const DeliveriesTC = composeWithMongoose(Deliveries, customizationOptions);
const ProductsTC = composeWithMongoose(Product, customizationOptions);

CartonsTC.wrapResolverResolve('createOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = async (doc: ICarton, resolveParams) => {
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

const updateBeforeRecordMutate = async (doc: ICarton, resolveParams) => {
  const { token } = resolveParams.context;
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
  const updatedBy = await Users.findOne({ _id: decoded.sub });

  if (updatedBy != undefined) {
    doc.updatedBy = updatedBy;
    doc.updatedDate = new Date();
  } else {
      throw('Updated by user is null');
  }

  if (doc.status === 'unassigned') {
    doc.assignedUser = undefined;
  } else if (doc.status === 'counted') {
    doc.assignedUser = undefined;
    doc.bin = undefined;
    if (doc.inventoryCount) {
      // @ts-ignore
      doc.inventoryCount = doc.inventoryCount.map(
        ({ counted }: ICartonInventoryCount) => ({
          counted,
          inventoryClerk: updatedBy,
          inventoryCountDate: new Date(),
        })
      );
    }
  }

  // TODO: add code to check new state change to prevent invalid state changes

  return doc;
};

CartonsTC.wrapResolverResolve('updateOne', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  return next(rp);
});

CartonsTC.wrapResolverResolve('updateById', (next) => async (rp) => {
  // extend resolve params with hook
  rp.beforeRecordMutate = updateBeforeRecordMutate;

  const payload = await next(rp);
  // after update logic
  const delivery: IDelivery | null = await Deliveries.findById(payload.record.delivery);
  if (delivery) {
    const deliveryIsCounted: boolean = await (delivery.cartons as any as string[]).reduce(
      async (acc: Promise<boolean>, cur: string): Promise<boolean> => {
        const accumulator = await acc;
        const carton = await Cartons.findById(cur);
        return carton ? accumulator && carton.status === 'counted' : false;
      }, Promise.resolve(true)
    );

    if (deliveryIsCounted) {
      const response = await Deliveries.findOneAndUpdate({ _id: delivery._id }, { status: 'counted' });
      sendMessage(JSON.stringify(response));
    }
  }

  return payload;
});

CartonsTC.addRelation(
  'delivery',
  {
    resolver: () => DeliveriesTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICarton) => source.delivery,
    },
    projection: { delivery: 1 }, // point fields in source object, which should be fetched from DB
  }
);

CartonsTC.addRelation(
  'createdBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICarton) => source.createdBy,
    },
    projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

CartonsTC.addRelation(
  'updatedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICarton) => source.updatedBy,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

CartonsTC.addRelation(
  'assignedUser',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICarton) => source.assignedUser,
    },
    projection: { assignedUser: 1 }, // point fields in source object, which should be fetched from DB
  }
);

CartonsTC.addRelation(
  'bin',
  {
    resolver: () => BinsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICarton) => source.bin,
    },
    projection: { bin: 1 }, // point fields in source object, which should be fetched from DB
  }
);

const CartonsInventoryCountTC = CartonsTC.getFieldOTC('inventoryCount');

CartonsInventoryCountTC.addRelation(
  'inventoryClerk',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICartonInventoryCount) => source.inventoryClerk,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

const CartonsInventoryCountCountedTC = CartonsInventoryCountTC.getFieldOTC('counted');

CartonsInventoryCountCountedTC.addRelation(
  'product',
  {
    resolver: () => ProductsTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: ICartonInventoryCountCounted) => source.product,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

/*CartonsTC.addFields({
  delivery: {
    type: 'Delivery',
  }
});*/

/*const testFilter = {
  name: 'testing123',
  type: 'string' as any,
  description: 'Filter based on slug.',
  query: (rawQuery, value) => {
    log(rawQuery),
    log(value);
    console.log(rawQuery, value);
    // if (value.length === 1) {
    //   rawQuery['location.name'] = value[0];
    // } else {
    //   rawQuery['location.name'] = { $in: value };
    // }
  },
};*/

/*const customPaginationResolver = CartonsTC.getResolver('pagination').addFilterArg(testFilter);
customPaginationResolver.name = 'pagination';
CartonsTC.addResolver(customPaginationResolver as any);
const findManyResolver = CartonsTC.getResolver('findMany').addFilterArg(testFilter);
findManyResolver.name = 'findMany';
CartonsTC.addResolver(findManyResolver as any);
const customResolver = CartonsTC.getResolver('connection').addFilterArg(testFilter);
customResolver.name = 'connection';
CartonsTC.addResolver(customResolver as any);*/

// schemaComposer.Query.addFields({
const queries = {
  cartonById: CartonsTC.getResolver('findById'),
  cartonByIds: CartonsTC.getResolver('findByIds'),
  cartonOne: CartonsTC.getResolver('findOne'),
  cartonMany: CartonsTC.getResolver('findMany'),
  cartonCount: CartonsTC.getResolver('count'),
  cartonConnection: CartonsTC.getResolver('connection'),
  cartonPagination: CartonsTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
  cartonCreateOne: CartonsTC.getResolver('createOne'),
  cartonCreateMany: CartonsTC.getResolver('createMany'),
  cartonUpdateById: CartonsTC.getResolver('updateById'),
  cartonUpdateOne: CartonsTC.getResolver('updateOne'),
  cartonUpdateMany: CartonsTC.getResolver('updateMany'),
  cartonRemoveById: CartonsTC.getResolver('removeById'),
  cartonRemoveOne: CartonsTC.getResolver('removeOne'),
  cartonRemoveMany: CartonsTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };