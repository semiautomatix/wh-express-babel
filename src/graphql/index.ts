import { schemaComposer } from 'graphql-compose';

import * as Bins from './bins';
import * as Cartons from './cartons';
import * as Deliveries from './deliveries';
import * as Documents from './documents';
import * as Outbounds from './outbounds';
import * as Policies from './policies';
import * as Products from './products';
import * as Roles from './roles';
import * as Suppliers from './suppliers';
import * as Users from './users';

schemaComposer.Query.addFields({
  ...Bins.queries,
  ...Cartons.queries,
  ...Deliveries.queries,
  ...Documents.queries,
  ...Outbounds.queries,
  ...Policies.queries,
  ...Products.queries,
  ...Roles.queries,
  ...Suppliers.queries,
  ...Users.queries
});

schemaComposer.Mutation.addFields({
  ...Bins.mutations,
  ...Cartons.mutations,
  ...Deliveries.mutations,
  ...Documents.mutations,
  ...Outbounds.mutations,
  ...Policies.mutations,
  ...Products.mutations,
  ...Roles.mutations,
  ...Suppliers.mutations,
  ...Users.mutations,
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;