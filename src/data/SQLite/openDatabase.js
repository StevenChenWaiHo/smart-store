import dbUpgrade from "./db-upgrade.json"
import * as SQLite from 'expo-sqlite'

const schemaToSQL = (schema) => {
  const sqlTables = Object.keys(schema).map(table => {
    const columns = Object.entries(schema[table]);
    const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
    return `CREATE TABLE IF NOT EXIST ${table} ` + SQLColumns
  }).join('; ')
  console.log(sqlTables)
}

export default function openDatabase() {

  // db.transaction(tx => {

  //   tx.executeSql(`CREATE TABLE IF NOT EXISTS version (
  //   versionNumber INTEGER)`, [],
  //     (txObj, results) => {
  //       console.log(results)
  //       if (results.rows.length == 0) {
  //         db.transaction(tx => {
  //           tx.executeSql(schemaToSQL(dbUpgrade.currentSchema))
  //           tx.executeSql("INSERT INTO version (versionNumber)", [dbUpgrade.version])
  //         },
  //           (txObj, results) => { },
  //           (txObj, error) => { console.log(error) }
  //         )
  //       }
  //     },
  //     (txObj, error) => console.log(error))

  //   tx.executeSql("SELECT max(versionNumber) FROM version", [],
  //     (txObj, results) => {
  //       let version = results[0];
  //       if (version < dbUpgrade.version) {
  //         console.log('Database Upgrading...')
  //         for (i = version + 1; i <= dbUpgrade.version; i++) {
  //           db.transaction(tx => {
  //             db.executeSql(dbUpgrade.upgrades[`to_v${i}`])
  //             db.executeSql(`INSERT INTO version (versionNumber)`, [i])
  //           })

  //         }
  //       }
  //     },
  //     (txObj, error) => console.log(error))
  // })
  return SQLite.openDatabase('list.db');
}