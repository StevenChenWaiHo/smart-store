import ItemListScreen from "../../components/screen/ItemListTemplate"

export default function TimedItemListScreen() {
    return (
        <ItemListScreen
            sqlStatement="SELECT * FROM list ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date"
            sqlArguments={null} />
    )
}