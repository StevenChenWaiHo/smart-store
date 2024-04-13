export default function dateNumberToString(date) {
    if (!date) return null
    return new Date(date).toDateString()
}