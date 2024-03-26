import openDatabase from "./openDatabase";
import { jsonToCSV, readRemoteFile } from 'react-native-csv';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export default function exportSavedItems() {
    const db = openDatabase();
    db.transaction(tx => {
        tx.executeSql(`SELECT * FROM barcodeMap`,
            [],
            async (txObj, result) => {
                try {
                    const CSV = jsonToCSV(JSON.stringify(result.rows._array));

                    // Name the File
                    const directoryUri = FileSystem.cacheDirectory;
                    const fileUri = directoryUri + `saved_items.csv`;

                    // Write the file to system
                    FileSystem.writeAsStringAsync(fileUri, CSV)

                    Sharing.shareAsync(fileUri)
                } catch (error) {
                    console.log(error);
                }
            },
            (txObj, error) => console.log(error))
    },
        (txObj, error) => debugLog({ message: error }),
        () => { }
    )
}