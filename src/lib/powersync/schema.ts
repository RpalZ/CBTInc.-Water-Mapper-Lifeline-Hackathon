import { Schema, Table, column } from '@powersync/web';

export const AppSchema = new Schema({
  lists: new Table({
    name: column.text,
    owner_id: column.text
  }),
  todos: new Table({
    created_at: column.text,
    completed_at: column.text,
    completed: column.integer,
    description: column.text,
    list_id: column.text,
    owner_id: column.text
  })
});