import { cancelAllScheduledNotificationsAsync } from "expo-notifications";
import debugLog from "../debug/debugLog";
import openDatabase from "../SQLite/openDatabase";
import updateItem from "../SQLite/item/update/updateItem";

export default async function resetNotifications() {
    const db = openDatabase()
    try {
        await cancelAllScheduledNotificationsAsync()

        db.transaction(tx => {
            tx.executeSql('SELECT * FROM list ', [],
                async (txObj, resultList) => {

                    console.log(resultList.rows._array)
                    const itemist = resultList.rows._array

                    for (var item of itemist) {
                        console.log(item)
                        updateItem({db, item, skipUpdateQuantityInBarcodeMap: true})
                    }
    
                },
                (txObj, error) => debugLog({ message: error }))
        })
    } catch (error) {
        debugLog({message: error})
    }
}