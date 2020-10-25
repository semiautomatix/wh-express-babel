import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import Users, { IUser } from '../models/users';
import Roles, { IRole } from '../models/roles';

const customizationOptions = {
  resolvers: {
    createOne: {
      record: {
        removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy', 'hash']
      }
    },
    updateById: {
      record: {
        removeFields: ['updatedDate', 'updatedBy', 'createdDate', 'createdBy', 'hash']
      }
    },
  }
};

const UsersTC = composeWithMongoose(Users, customizationOptions);
const RolesTC = composeWithMongoose(Roles, customizationOptions);

UsersTC.addResolver({
  name: 'authenticate',
  type: 'String', // TG https://github.com/microsoft/TypeScript/pull/31947
  args: { emailAddress: 'String!', password: 'String!' },
  resolve: async ({ source, args, context, info }) => {
    // @ts-ignore
    const { emailAddress, password } = args;
    const user: IUser | null = await Users.findOne({ emailAddress }) as IUser;
    if (user && bcrypt.compareSync(password, user.hash)) {
      return jwt.sign({ sub: user.id }, process.env.JWT_SECRET || '');
    } else {
      throw new Error('Invalid email address/password combination');
    }
  }
});

UsersTC.addResolver({
  name: 'createOneCustom',
  type: UsersTC as any, // TG https://github.com/microsoft/TypeScript/pull/31947
  args: { emailAddress: 'String!', password: 'String!', lastName: 'String!', firstName: 'String!', roles: '[MongoID]' },
  resolve: async ({ source, args, context, info }) => {
    // @ts-ignore
    const { emailAddress, password } = args;
    const { token } = context;
    // validate
    if (await Users.findOne({ emailAddress })) {
      throw `Email address ${emailAddress} is already in use`;
    }

    const user: IUser = new Users(args);

    // hash password
    if (password) {
      user.hash = bcrypt.hashSync(password, 10);
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
    const createdBy = await Users.findOne({ _id: decoded.sub });

    if (createdBy != undefined) {
      user.createdBy = createdBy;
      user.createdDate = new Date();
    } else {
      throw ('Created by user is null');
    }

    // save user
    return await user.save();
  }
});

UsersTC.addResolver({
  name: 'updateByIdCustom',
  type: UsersTC as any, // TG https://github.com/microsoft/TypeScript/pull/31947
  args: { _id: 'MongoID!', emailAddress: 'String!', password: 'String', lastName: 'String!', firstName: 'String!', roles: '[MongoID]' },
  // args: UsersTC.getResolver('createOne').getArgs(),
  resolve: async ({ source, args, context, info }) => {
    // @ts-ignore
    const { _id, emailAddress, lastName, firstName, password, roles } = args;
    const { token } = context;

    // TODO: validate
    // if (await Users.findOne({ emailAddress })) {
    //  throw `Email address ${emailAddress} is already in use`;
    // }

    const user: IUser | null = await Users.findOne({ _id });

    if (user) {
      user.firstName = firstName;
      user.emailAddress = emailAddress;
      user.lastName = lastName;
      user.roles = roles;

      // hash password
      if (password) {
        user.hash = bcrypt.hashSync(password, 10);
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
      const updatedBy = await Users.findOne({ _id: decoded.sub });

      if (updatedBy != undefined) {
        user.updatedBy = updatedBy._id;
        user.updatedDate = new Date();
      } else {
        throw ('Updated by user is null');
      }

      // save user
      return await user.save();
    } else {
      throw ('User not found!');
    }
  }
});

UsersTC.addRelation(
  'roles',
  {
    resolver: () => RolesTC.getResolver('findByIds'),
    prepareArgs: {
      _ids: (source: IUser) => source.roles || [],
    },
    projection: { role: true }, // point fields in source object, which should be fetched from DB
  }
);

UsersTC.addRelation(
  'createdBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IUser) => source.createdBy,
    },
    projection: { createdBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

UsersTC.addRelation(
  'updatedBy',
  {
    resolver: () => UsersTC.getResolver('findById'),
    prepareArgs: {
      _id: (source: IUser) => source.updatedBy,
    },
    projection: { updatedBy: 1 }, // point fields in source object, which should be fetched from DB
  }
);

const userManyResolver = UsersTC.getResolver('findMany').addFilterArg({
  name: 'roleIds',
  type: '[MongoID]',
  description: 'Search by roles',
  query: (rawQuery, value) => {
    rawQuery.roles = { $in: value }; }
  }
);

// schemaComposer.Query.addFields({
const queries = {
  authenticate: UsersTC.getResolver('authenticate'),
  userById: UsersTC.getResolver('findById'),
  userByIds: UsersTC.getResolver('findByIds'),
  userOne: UsersTC.getResolver('findOne'),
  userMany: userManyResolver,
  userCount: UsersTC.getResolver('count'),
  userConnection: UsersTC.getResolver('connection'),
  userPagination: UsersTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
  authenticate: UsersTC.getResolver('authenticate'),
  userCreateOne: UsersTC.getResolver('createOneCustom'),
  // userCreateMany: UsersTC.getResolver('createMany'),
  userUpdateById: UsersTC.getResolver('updateByIdCustom'),
  // userUpdateById: UsersTC.getResolver('updateById'),
  userUpdateOne: UsersTC.getResolver('updateOne'),
  userUpdateMany: UsersTC.getResolver('updateMany'),
  userRemoveById: UsersTC.getResolver('removeById'),
  userRemoveOne: UsersTC.getResolver('removeOne'),
  userRemoveMany: UsersTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };