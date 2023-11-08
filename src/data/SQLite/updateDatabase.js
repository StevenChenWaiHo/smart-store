

import dbUpgrade from "./db-upgrade.json"
import * as SQLite from 'expo-sqlite'
import openDatabase from "./openDatabase";
import debugLog from "../utils/debug/debugLog";

const schemaToSQL = (schema) => {
    const sqlTables = Object.keys(schema).map(table => {
        const columns = Object.entries(schema[table]);
        const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
        return `CREATE TABLE IF NOT EXISTS ${table} ` + SQLColumns
    })
    return sqlTables
}

export default function updateDatabase({ debug }) {
    debugLog({ debug, message: 'Updating Database' })
    const db = openDatabase();


    // Create tables with current schema return current version number if success
    const initialiseAllTables = () => {
        debugLog({ debug, message: 'INIT ALL TABLES' })
        db.transaction(tx => {
            // Create the tables with current schema
            schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
                tx.executeSql(table, null,
                    (txObj, result) => { debugLog({ debug, message: `${table}: ${JSON.stringify(result)}` }) },
                    (txObj, error) => { debugLog({ debug, message: error }); return false })
            })
            // Add version number to version table
            tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
                (txObj, result) => { debugLog({ debug, message: `Add newest version number: ${JSON.stringify(result)}` }); return true },
                (txObj, error) => { debugLog({ debug, message: error }); return false })
        })
    }

    const upgradeDatabaseToLatestVersion = () => {
        db.transaction(tx => {
            tx.executeSql("SELECT max(versionNumber) FROM version", [],
                (txObj, results) => {
                    const currentVersion = results.rows._array[0]['max(versionNumber)'];
                    debugLog({ debug, message: `Current version After Init: ${currentVersion}` })

                    const latestVersion = dbUpgrade.version
                    if (currentVersion < latestVersion) {
                        debugLog({ debug, message: `Database upgrading from version ${currentVersion} to version ${latestVersion}...` })
                        for (let i = currentVersion + 1; i <= latestVersion; i++) {
                            db.transaction(tx => {
                                tx.executeSql(dbUpgrade.upgrades[`to_v${i}`],
                                    [],
                                    (txObj, result) => { debugLog({ debug, message: `${dbUpgrade.upgrades[`to_v${i}`]}: ${result}` }) },
                                    (txObj, error) => debugLog({ debug, message: error }))
                                tx.executeSql(`INSERT INTO version (versionNumber) values (?)`, [i],
                                    [],
                                    (txObj, result) => { debugLog({ debug, message: `Add Upgraded version: ${result}` }) },
                                    (txObj, error) => debugLog({ debug, message: error }))
                            })
                        }
                    }
                    checkFinalTableSchema()
                },
                (txObj, error) => { debugLog({ debug, message: error }) })
        })
    }

    const deleteAllTables = () => {
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
        })
    }

    const checkFinalTableSchema = () => {
        db.transaction(tx => {
            tx.executeSql("PRAGMA table_info(version);", [],
                (txObj, result) => { debugLog({ debug, message: `version table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })
            tx.executeSql("PRAGMA table_info(list)", [],
                (txObj, result) => { debugLog({ debug, message: `list table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })
            tx.executeSql("PRAGMA table_info(barcodeMap)", [],
                (txObj, result) => { debugLog({ debug, message: `barcodeMap table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })

            tx.executeSql("SELECT * FROM version", [],
                (txObj, result) => { debugLog({ debug, message: `version table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })
            tx.executeSql("SELECT * FROM list", [],
                (txObj, result) => { debugLog({ debug, message: `list table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })
            tx.executeSql("SELECT * FROM barcodeMap", [],
                (txObj, result) => { debugLog({ debug, message: `barcodeMap table: ${result.rows._array.map((json => JSON.stringify(json)))}` }) },
                (txObj, error) => { debugLog({ debug, message: error }) })
        })
    }

    // deleteAllTables()

    db.transaction(tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS version (versionNumber INTEGER)`, [],
            (txObj, results) => { },
            (txObj, error) => debugLog({ debug, message: error }))
    })

    // Check if any version is present
    db.transaction(tx => {
        tx.executeSql("SELECT max(versionNumber) FROM version", [],
            (txObj, results) => {
                const version = results.rows._array[0]['max(versionNumber)'];
                debugLog({ debug, message: `Current Version: ${version}` })
                // version table doesn't exist or it does not have any entry
                if (!version) {
                    initialiseAllTables()
                    /* Cannot initialise tables. It might be becuase the app is 
                    in a version which didnt have the version table but have list
                    and barcodeMap table, which is database version 1*/
                    tx.executeSql("INSERT INTO version (versionNumber) values (?)", [1],
                        (txObj, result) => { },
                        (txObj, error) => { debugLog({ debug, message: error }) })
                    checkFinalTableSchema()

                }

                upgradeDatabaseToLatestVersion()

            },
            (txObj, error) => { debugLog({ debug, message: error }) }
        )
    })
    checkFinalTableSchema()
}