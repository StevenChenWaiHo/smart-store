export default function dateNumberToString(date) {
    if (!date) return ""
    return new Date(date).toDateString()
}