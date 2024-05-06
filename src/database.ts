import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export const openDb = async (): Promise<Database> => {
  return open({
    filename: './mydatabase.db',
    driver: sqlite3.Database
  });
};