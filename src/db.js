import Dexie from 'dexie';

export const db = new Dexie('CashBookDB');

db.version(1).stores({
  transactions: '++id, type, amount, date, timestamp' // Added timestamp for easy sorting
});
