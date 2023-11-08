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

export default function updateItem({ db, id, data }) {
    console.log('Update List Item')
    console.log(JSON.stringify(data))
    db.transaction(tx => {
        tx.executeSql(`UPDATE list SET ${dataToSQLFields(data)} WHERE id = (?)`, [...dataToSQLValues(data), id],
        (txObj, resultList) => {},
        (txObj, error) => console.log(error))
    })
  }