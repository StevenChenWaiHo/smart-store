import openDatabase from "./openDatabase";
import { jsonToCSV, readRemoteFile } from 'react-native-csv';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import debugLog from "../debug/debugLog";


export default async function getList() {
    const db = openDatabase();
    await db.transactionAsync(async tx => {
        const result = await tx.executeSqlAsync(`SELECT * FROM list`, [])
        console.log(debugLog({message: JSON.stringify(result.rows)}))
    })
}