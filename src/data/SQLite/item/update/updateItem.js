const dataToSQLFields = (data) => {
    return Object.keys(data).map((column) => {
        return `${column} = (?)`
    })
}

const dataToSQLValues = (data) => {
    return Object.entries(data).map(([_, value]) => {
        return value
    })
}

export default function updateItem({ db, id, data }) {
    console.log(data)
    db.transaction(tx => {
        tx.executeSql(`UPDATE list SET ${dataToSQLFields(data)} WHERE id = (?)`, [...dataToSQLValues(data), id],
        (txObj, resultList) => {console.log('Update Item: ', resultList)},
        (txObj, error) => console.log(error))
    })
  }