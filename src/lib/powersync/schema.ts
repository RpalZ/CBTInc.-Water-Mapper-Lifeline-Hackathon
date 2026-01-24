import { Schema } from '@powersync/web';

export const AppSchema = new Schema({
  lists: {
    name: 'TEXT',
    owner_id: 'TEXT'
  },
  todos: {
    created_at: 'TEXT',
    completed_at: 'TEXT',
t    completed: 'INTEGER',
    description: 'TEXT',
    list_id: 'TEXT',
    owner_id: 'TEXT'
  }
});