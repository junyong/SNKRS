import { JSONFileSync, LowSync } from 'lowdb';
import { Schema } from './types';

const getDb = (): LowSync<Schema> => {
  const adapter = new JSONFileSync<Schema>('db.json');
  const db = new LowSync<Schema>(adapter);
  db.read();
  db.data ||= { infos: [] };
  db.write();
  return db;
};

export default getDb;
