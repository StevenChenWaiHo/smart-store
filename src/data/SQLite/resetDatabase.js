import openDatabase from "./openDatabase";
import * as SQLite from 'expo-sqlite';
import dbUpgrade from './db-upgrade.json'
import debugLog from '../debug/debugLog'

const schemaToSQL = (schema) => {
    const sqlTables = Object.keys(schema).map(table => {
        const columns = Object.entries(schema[table]);
        const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
        return `CREATE TABLE IF NOT EXISTS ${table} ` + SQLColumns
    })
    return sqlTables
}

export default function resetDatabase() {
    const db = openDatabase();
    db.transaction(tx => {
        tx.executeSql(`DROP TABLE IF EXISTS version`,
            [],
            (txObj, result) => { console.log('DELETE version') },
            (txObj, error) => console.log(error))

        tx.executeSql(`DROP TABLE IF EXISTS list`,
            [],
            (txObj, result) => { console.log('DELETE list') },
            (txObj, error) => console.log(error))

        tx.executeSql(`DROP TABLE IF EXISTS barcodeMap`,
            [],
            (txObj, result) => { console.log('DELETE barcodeMap') },
            (txObj, error) => console.log(error))
    },
        (txObj, error) => debugLog({ message: error }),
        () => {
            // ON DELETE SUCCESS CREATE VERSION TABLE
            db.transaction(tx => {
                tx.executeSql(`CREATE TABLE IF NOT EXISTS version (versionNumber INTEGER)`, [],
                    (txObj, results) => {
                        schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
                            tx.executeSql(table, null,
                                (txObj, result) => { debugLog({ message: `${table}: ${JSON.stringify(result)}` }) },
                                (txObj, error) => { debugLog({ message: error }); return false })
                        })
                        // Add version number to version table
                        tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
                            (txObj, result) => { debugLog({ message: `Add newest version number: ${JSON.stringify(result)}` }); return true },
                            (txObj, error) => { debugLog({ message: error }); return false })
                    },
                    (txObj, error) => debugLog({ debugMode, message: error }))
            },
                (txObj, error) => debugLog({ message: error }),
                () => {debugLog({ message: 'Reset Database Completed' })})
        }

    )
}