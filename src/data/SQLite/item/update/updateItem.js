import * as Notifications from 'expo-notifications';

const dataToSQLFields = (data) => {
    return Object.keys(data).map((column) => {
        return `${column} = (?)`
    }).join(', ')
}

const dataToSQLValues = (data) => {
    return Object.entries(data).map(([_, value]) => {
        return value
    })
}

const updateNotification = (db, item) => {
    async function schedulePushNotification(item) {
        const trigger = new Date(item?.date);
        trigger.setHours(8)
        trigger.setMinutes(0)
        trigger.setSeconds(0)

        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "Your Item is Expiring 📬",
                body: `${item?.itemName} is expiring on ${new Date(item?.date).toDateString()}`,
            },
            trigger,
        });
    }

    db.transaction(tx => {
        tx.executeSql('SELECT notificationId FROM list WHERE id = (?)', [item?.id],
            async (txObj, resultList) => {

                // Delete Current Notification
                Notifications.cancelScheduledNotificationAsync(resultList.rows._array[0]['notificationId'])

                // Update notificationId
                const newNotificationId = await schedulePushNotification(item);
                db.transaction(tx => {
                    tx.executeSql(`UPDATE list SET notificationId = (?) WHERE id = (?)`, [newNotificationId],
                        (txObj, resultList) => {console.log('Updated notification ID: ', newNotificationId)},
                        (txObj, error) => console.log(error))
                })
            },
            (txObj, error) => console.log(error))
    })


}

const updateBarcodeMap = (db, item, skipUpdateQuantityInBarcodeMap) => {
    if (skipUpdateQuantityInBarcodeMap) {
        db.transaction(tx => {
            tx.executeSql('UPDATE barcodeMap SET itemName = (?), image = (?) WHERE barcode = (?)', [item.itemName, item.image, item.barcode],
                (txObj, resultList) => { },
                (txObj, error) => console.log(error))
        })
    } else {
        db.transaction(tx => {
            tx.executeSql('UPDATE barcodeMap SET itemName = (?), quantity = (?), image = (?) WHERE barcode = (?)', [item.itemName, item.quantity, item.image, item.barcode],
                (txObj, resultList) => { },
                (txObj, error) => console.log(error))
        })
    }
    
}

// Must provide itemName when updating expiry date
export default function updateItem({ db, item, skipUpdateQuantityInBarcodeMap = false }) {
    console.log('Update List Item', JSON.stringify(item))
    const { id: id, ...data } = item
    updateNotification(db, item);
    updateBarcodeMap(db, item, skipUpdateQuantityInBarcodeMap)
    db.transaction(tx => {
        tx.executeSql(`UPDATE list SET ${dataToSQLFields(data)} WHERE id = (?)`, [...dataToSQLValues(data), id],
            (txObj, resultList) => { },
            (txObj, error) => console.log(error))
    })
}