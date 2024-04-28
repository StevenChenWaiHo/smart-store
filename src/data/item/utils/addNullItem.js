import openDatabase from "../../SQLite/openDatabase";

export default function addNullItem() {
    const db = openDatabase()
    db.transaction(tx => {
        tx.executeSql('INSERT INTO list (itemName, date, quantity, image, notificationId, barcode, remarks) values (?, ?, ?, ?, ?, ?, ?)', [null, null, null, null, null, null, null],
            (txObj, resultList) => {
                ToastAndroid.show(`Added Item - ${itemData.itemName}`, ToastAndroid.SHORT);
                setItemStatus({ editing: false, scanned: false })
                resetItem();
                console.log('Add to List', itemData)
            },
            (txObj, error) => { alert(error); return true})
    })
}