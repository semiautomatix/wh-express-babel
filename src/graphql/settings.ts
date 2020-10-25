const customizationOptions = {}; // left it empty for simplicity, described below
import { composeWithMongoose } from 'graphql-compose-mongoose';
// import { schemaComposer } from 'graphql-compose';
import Settings from '../models/settings';

const SettingsTC = composeWithMongoose(Settings, customizationOptions);

// schemaComposer.Query.addFields({
const queries = {
    settingById: SettingsTC.getResolver('findById'),
    settingByIds: SettingsTC.getResolver('findByIds'),
    settingOne: SettingsTC.getResolver('findOne'),
    settingMany: SettingsTC.getResolver('findMany'),
    settingCount: SettingsTC.getResolver('count'),
    settingConnection: SettingsTC.getResolver('connection'),
    settingPagination: SettingsTC.getResolver('pagination'),
};
// });

// schemaComposer.Mutation.addFields({
const mutations = {
    settingCreateOne: SettingsTC.getResolver('createOne'),
    settingCreateMany: SettingsTC.getResolver('createMany'),
    settingUpdateById: SettingsTC.getResolver('updateById'),
    settingUpdateOne: SettingsTC.getResolver('updateOne'),
    settingUpdateMany: SettingsTC.getResolver('updateMany'),
    settingRemoveById: SettingsTC.getResolver('removeById'),
    settingRemoveOne: SettingsTC.getResolver('removeOne'),
    settingRemoveMany: SettingsTC.getResolver('removeMany'),
};
// });

// const graphqlSchema = schemaComposer.buildSchema();
// export default graphqlSchema;

export { mutations, queries };