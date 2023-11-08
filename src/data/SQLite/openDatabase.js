import * as SQLite from 'expo-sqlite'

export default function openDatabase() {
  return SQLite.openDatabase('list.db');
}