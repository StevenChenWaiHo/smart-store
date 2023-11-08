

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
        db.transaction(tx => {
            // Create the tables with current schema
            schemaToSQL(dbUpgrade.currentSchema).forEach((table) => {
                tx.executeSql(table, null,
                    (txObj, result) => { },
                    (txObj, error) => console.log(error))
            })
            // Add version number to version table
            tx.executeSql("INSERT INTO version (versionNumber) values (?)", [dbUpgrade.version],
                (txObj, result) => { return dbUpgrade.version },
                (txObj, error) => console.log(error))
        })
        return null
    }

    // DELETE ALL DATABASE
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

    db.transaction(tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS version (
    versionNumber INTEGER)`, [],
            (txObj, results) => { console.log(results) },
            (txObj, error) => console.log(error))
    })

    // Check if any version is present
    db.transaction(tx => {
        tx.executeSql("SELECT max(versionNumber) FROM version", [],
            (txObj, results) => {
                const version = results.rows._array[0]['max(versionNumber)'];
                console.log(version)
                // version table doesn't exist or it does not have any entry
                if (!version) {
                    console.log('INIT ALL TABLES')
                    // Add base version number to version table
                    tx.executeSql("INSERT INTO version (versionNumber) values (?)", [1],
                        (txObj, result) => { },
                        (txObj, error) => console.log(error))
                    
                    if (initialiseAllTables()) {
                        return
                    }
                }
                // Upgrade if outdated
                const latestVersion = dbUpgrade.version
                if (version < latestVersion) {
                    alert(`Database upgrading from version ${version} to version ${latestVersion}...`)
                    for (let i = version + 1; i <= latestVersion; i++) {
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