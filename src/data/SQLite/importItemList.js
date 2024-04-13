
import openDatabase from "./openDatabase";
import { readRemoteFile, readString } from 'react-native-csv';
import * as FileSystem from 'expo-file-system';
import debugLog from "../debug/debugLog";
import { getDocumentAsync } from "expo-document-picker";
import schedulePushNotification from "../notification/schedulePushNotification";

const csvFileTypes = ['text/csv', 'text/comma-separated-values']


export default async function importItemList() {

    const { assets, canceled } = await getDocumentAsync({ type: csvFileTypes, multiple: false })

    if (canceled) {
        return
    }

    console.log('Choosed File Path: ', assets[0].uri, assets[0].mimeType)

    const fileString = await FileSystem.readAsStringAsync(assets[0].uri)

    // Parse CSV to Json
    const { data, errors, meta } = readString(fileString, { header: true })

    if (errors.length > 0) {
        debugLog({ message: 'Parse File Error: ' + errors[0].message })
        return
    }

    const db = openDatabase();

    db.transaction(async tx => {
        for (var item of data) {
            const result = await schedulePushNotification

            tx.executeSql('INSERT INTO list (itemName, date, quantity, image, notificationId, barcode, remarks) values (?, ?, ?, ?, ?, ?, ?)', [item.itemName, item.date, item.quantity, item.image, item.notificationId, item.barcode, item.remarks],
                (txObj, result) => {},
                (txObj, error) => debugLog({ message: error }))
        }
    },
        (txObj, error) => debugLog({ message: error }),
        () => { }
    )
}

