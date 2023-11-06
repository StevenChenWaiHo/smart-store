import dbUpgrade from "./db-upgrade.json"
import * as SQLite from 'expo-sqlite'

const schemaToSQL = (schema) => {
  const sqlTables = Object.keys(schema).map(table => {
    const columns = Object.entries(schema[table]);
    const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
    return `CREATE TABLE IF NOT EXISTS ${table} ` + SQLColumns
  })
  return sqlTables
}

export default function openDatabase() {
  const db = SQLite.openDatabase('list.db');

  const initialiseAllTables = () => {
    db.transaction(tx => {
      // Create the tables with current schema
      schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
        tx.executeSql(table, null,
          (txObj, result) => { },
          (txObj, error) => console.log(error))
      })
      // Add version number to version table
      tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
        (txObj, result) => { },
        (txObj, error) => console.log(error))

      tx.executeSql("SELECT * FROM version", [],
        (txObj, result) => { },
        (txObj, error) => console.log(error))
    })
  }

  // DELETE ALL DATABASE
  // db.transaction(tx => {
    // console.log('DELETE version')
  //   tx.executeSql(`DROP TABLE IF EXISTS version`,
  //     [],
  //     (txObj, result) => { },
  //     (txObj, error) => console.log(error))

  //   tx.executeSql(`DROP TABLE IF EXISTS list`,
  //     [],
  //     (txObj, result) => { console.log('DELETE list') },
  //     (txObj, error) => console.log(error))

  //   tx.executeSql(`DROP TABLE IF EXISTS barcodeMap`,
  //     [],
  //     (txObj, result) => { console.log('DELETE barcodeMap') },
  //     (txObj, error) => console.log(error))
  // })

  // db.transaction(tx => {
  //   tx.executeSql(`CREATE TABLE IF NOT EXISTS version (
  //   versionNumber INTEGER)`, [],
  //     (txObj, results) => { },
  //     (txObj, error) => console.log(error))
  // })

  // Check if any version is present
  db.transaction(tx => {
    tx.executeSql("SELECT max(versionNumber) FROM version", [],
      (txObj, results) => {
        const version = results.rows._array[0]['max(versionNumber)'];
        if (!version) {
          // Initialise all Table
          console.log('INIT ALL TABLES')
          initialiseAllTables()
          return
        }
        // Upgrade if outdated
        const latestVersion = dbUpgrade.version
        if (version < latestVersion) {
          console.log(`Database Upgrading from ${version} to ${latestVersion}...`)
          for (let i = version + 1; i <= latestVersion; i++) {
            db.transaction(tx => {
              tx.executeSql(dbUpgrade.upgrades[`to_v${i}`],
                [],
                (txObj, result) => { },
                (txObj, error) => console.log(error))
              tx.executeSql(`INSERT INTO version (versionNumber) values (?)`, [i],
                [],
                (txObj, result) => { console.log('DELETE barcodeMap') },
                (txObj, error) => console.log(error))
            })
          }
        }
      })
  })

  return db;
  }