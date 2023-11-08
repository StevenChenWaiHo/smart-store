

import dbUpgrade from "./db-upgrade.json"
import * as SQLite from 'expo-sqlite'
import openDatabase from "./openDatabase";
import debugLog from "../utils/debug/debugLog";
import transactionHandler from "./utils/transactionHandler";

const schemaToSQL = (schema) => {
    const sqlTables = Object.keys(schema).map(table => {
        const columns = Object.entries(schema[table]);
        const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
        return `CREATE TABLE IF NOT EXISTS ${table} ` + SQLColumns
    })
    return sqlTables
}

export default function updateDatabase({ debugMode }) {
    debugLog({ debugMode, message: 'Updating Database' })
    const db = openDatabase();

    // Create tables with current schema return current version number if success
    const initialiseAllTables = () => {
        debugLog({ debugMode, message: 'INIT ALL TABLES' })
        transactionHandler(db,
            async tx => {
                // Create the tables with current schema
                schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
                    tx.executeSql(table, null,
                        (txObj, result) => { debugLog({ debugMode, message: `${table}: ${JSON.stringify(result)}` }) },
                        (txObj, error) => { debugLog({ debugMode, message: error }); return false })
                })
                // Add version number to version table
                tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
                    (txObj, result) => { debugLog({ debugMode, message: `Add newest version number: ${JSON.stringify(result)}` }); return true },
                    (txObj, error) => { debugLog({ debugMode, message: error }); return false })
            }, debugMode)
    }

    const upgradeDatabaseToLatestVersion = () => {
        transactionHandler(db,
            tx => {
                tx.executeSql("SELECT max(versionNumber) FROM version", [],
                    (txObj, results) => {
                        const currentVersion = results.rows._array[0]['max(versionNumber)'];
                        debugLog({ debugMode, message: `Current version After Init: ${currentVersion}` })

                        const latestVersion = dbUpgrade.version
                        if (currentVersion < latestVersion) {
                            debugLog({ debugMode, message: `Database upgrading from version ${currentVersion} to version ${latestVersion}...` })
                            for (let i = currentVersion + 1; i <= latestVersion; i++) {
                                transactionHandler(tx => {
                                    tx.executeSql(dbUpgrade.upgrades[`to_v${i}`],
                                        [],
                                        (txObj, result) => { debugLog({ debugMode, message: `${dbUpgrade.upgrades[`to_v${i}`]}: ${result}` }) },
                                        (txObj, error) => debugLog({ debugMode, message: error }))
                                    tx.executeSql(`INSERT INTO version (versionNumber) values (?)`, [i],
                                        [],
                                        (txObj, result) => { debugLog({ debugMode, message: `Add Upgraded version: ${result}` }) },
                                        (txObj, error) => debugLog({ debugMode, message: error }))
                                })
                            }
                        }
                        checkAllTableSchema()
                    },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
            }, debugMode)
    }

    const deleteAllTables = () => {
        transactionHandler(db,
            tx => {
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
            }, debugMode)
    }

    const checkAllTableSchema = () => {
        debugLog({ debugMode, message: 'Check All Table' })
        transactionHandler(db,
            tx => {
                tx.executeSql("PRAGMA table_info(version);", [],
                    (txObj, result) => { debugLog({ debugMode, message: `version table fields: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
                tx.executeSql("PRAGMA table_info(list)", [],
                    (txObj, result) => { debugLog({ debugMode, message: `list table fields: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
                tx.executeSql("PRAGMA table_info(barcodeMap)", [],
                    (txObj, result) => { debugLog({ debugMode, message: `barcodeMap table fields: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })

                tx.executeSql("SELECT * FROM version", [],
                    (txObj, result) => { debugLog({ debugMode, message: `version table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
                tx.executeSql("SELECT * FROM list", [],
                    (txObj, result) => { debugLog({ debugMode, message: `list table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
                tx.executeSql("SELECT * FROM barcodeMap", [],
                    (txObj, result) => { debugLog({ debugMode, message: `barcodeMap table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                    (txObj, error) => { debugLog({ debugMode, message: error }) })
            }, debugMode)
    }

    // deleteAllTables()
    debugLog({debugMode, message: 'Current Database'})
    checkAllTableSchema()

    transactionHandler(db,
        tx => {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS version (versionNumber INTEGER)`, [],
                (txObj, results) => { },
                (txObj, error) => debugLog({ debugMode, message: error }))
        }, debugMode)

    // Check if any version is present
    transactionHandler(db,
        tx => {
            tx.executeSql("SELECT max(versionNumber) FROM version", [],
                (txObj, results) => {
                    const version = results.rows._array[0]['max(versionNumber)'];
                    debugLog({ debugMode, message: `Current Version: ${version}` })
                    // version table doesn't exist or it does not have any entry
                    if (!version) {
                        initialiseAllTables()
                        /* Cannot initialise tables. It might be becuase the app is 
                        in a version which didnt have the version table but have list
                        and barcodeMap table, which is database version 1*/
                        tx.executeSql("INSERT INTO version (versionNumber) values (?)", [1],
                            (txObj, result) => { },
                            (txObj, error) => { debugLog({ debugMode, message: error }) })
                        checkAllTableSchema()
                    }

                    upgradeDatabaseToLatestVersion()
                    checkAllTableSchema()
                },
                (txObj, error) => { debugLog({ debugMode, message: error }) }
            )
        }, debugMode)
}