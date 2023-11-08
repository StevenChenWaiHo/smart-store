

import dbUpgrade from "./db-upgrade.json"
import * as SQLite from 'expo-sqlite'
import openDatabase from "./openDatabase";

const schemaToSQL = (schema) => {
    const sqlTables = Object.keys(schema).map(table => {
        const columns = Object.entries(schema[table]);
        const SQLColumns = '(' + columns.map(([column, type]) => `${column} ${type}`).join(", ") + ")"
        return `CREATE TABLE IF NOT EXISTS ${table} ` + SQLColumns
    })
    return sqlTables
}

export default function updateDatabase() {
    console.log('Update Database')
    const db = openDatabase();


    // Create tables with current schema return current version number if success
    const initialiseAllTables = () => {
        console.log('INIT ALL TABLES')
        db.transaction(tx => {
            // Create the tables with current schema
            schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
                tx.executeSql(table, null,
                    (txObj, result) => { },
                    (txObj, error) => { return false })
            })
            // Add version number to version table
            tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
                (txObj, result) => { return true },
                (txObj, error) => { return false })
        })
    }

    const upgradeDatabaseToLatestVersion = () => {
        db.transaction(tx => {
            tx.executeSql("SELECT max(versionNumber) FROM version", [],
                (txObj, results) => {
                    const currentVersion = results.rows._array[0]['max(versionNumber)'];
                    console.log(`Database current version: ${currentVersion}`)
                    const latestVersion = dbUpgrade.version
                    if (currentVersion < latestVersion) {
                        console.log(`Database upgrading from version ${currentVersion} to version ${latestVersion}...`)
                        alert(`Database upgrading from version ${currentVersion} to version ${latestVersion}...`)
                        for (let i = currentVersion + 1; i <= latestVersion; i++) {
                            db.transaction(tx => {
                                tx.executeSql(dbUpgrade.upgrades[`to_v${i}`],
                                    [],
                                    (txObj, result) => { },
                                    (txObj, error) => alert(error))
                                tx.executeSql(`INSERT INTO version (versionNumber) values (?)`, [i],
                                    [],
                                    (txObj, result) => { },
                                    (txObj, error) => alert(error))
                            })
                        }
                    }
                })
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

    db.transaction(tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS version (versionNumber INTEGER)`, [],
            (txObj, results) => { },
            (txObj, error) => console.log(error))
    })

    // Check if any version is present
    db.transaction(tx => {
        tx.executeSql("SELECT max(versionNumber) FROM version", [],
            (txObj, results) => {
                const version = results.rows._array[0]['max(versionNumber)'];
                console.log('Current Version: ', version)
                // version table doesn't exist or it does not have any entry
                if (!version) {
                    if (initialiseAllTables()) {
                        console.log('INIT ALL TABLES SUCCESS')
                        return
                    } else {
                        /* Cannot initialise tables. It might be becuase the app is 
                        in a version which didnt have the version table but have list
                        and barcodeMap table, which is database version 1*/
                        tx.executeSql("INSERT INTO version (versionNumber) values (?)", [1],
                            (txObj, result) => { },
                            (txObj, error) => console.log(error))
                    }
                }

                upgradeDatabaseToLatestVersion()
            })
    })
}