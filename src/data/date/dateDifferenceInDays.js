export default function dateDifferenceInDays(oldDate, newDate) {
    oldDate.setHours(8)
    oldDate.setMinutes(0)
    oldDate.setSeconds(0)
    newDate.setHours(8)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    return parseInt(Math.ceil((oldDate - newDate) / (1000 * 60 * 60 * 24)));
}