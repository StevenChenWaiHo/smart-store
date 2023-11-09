export default function deleteAllTables({db}) {
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