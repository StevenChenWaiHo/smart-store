
import openDatabase from "./openDatabase";
import { readRemoteFile, readString } from 'react-native-csv';
import * as FileSystem from 'expo-file-system';
import debugLog from "../debug/debugLog";
import { getDocumentAsync } from "expo-document-picker";
import schedulePushNotification from "../notification/schedulePushNotification";
import { readOnly, writable } from "../../constants/SQLConstants";

const csvFileTypes = ['text/csv', 'text/comma-separated-values']


export default async function importSavedItems() {

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

    await db.transactionAsync(async tx => {
        const result = await tx.executeSqlAsync('SELECT * FROM barcodeMap', [])
        console.log(result.rows)
    }, readOnly)

    await db.transactionAsync(async tx => {
        try {
            for (var item of data) {
                await tx.executeSqlAsync('REPLACE INTO barcodeMap (barcode, itemName, quantity, image) values (?, ?, ?, ?)', [item.barcode, item.itemName, item.quantity, item.image])
            }
        } catch (error) {
            debugLog({ message: error })
        }
    }, writable)

    await db.transactionAsync(async tx => {
        const result = await tx.executeSqlAsync('SELECT * FROM barcodeMap', [])
        console.log(result.rows)
    }, readOnly)
}

