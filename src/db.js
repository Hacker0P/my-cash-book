import Dexie from 'dexie';

export const db = new Dexie('CashBookDB');

db.version(2).stores({
  transactions: '++id, type, amount, date, timestamp',
  categories: '++id, type, label, icon' // type: IN/OUT
});
