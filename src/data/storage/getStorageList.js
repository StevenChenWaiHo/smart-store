import openDatabase from "../SQLite/openDatabase"

export default async function getStorageList() {
    const db = openDatabase();
    var result;
    await db.transactionAsync(async tx => {
        try {
            result = await tx.executeSqlAsync(`SELECT * FROM storage`, [])
        }
        catch (error) {
            console.log(error)
        }
    })
    return [{label: "Storage 1", value: "1"}]
}