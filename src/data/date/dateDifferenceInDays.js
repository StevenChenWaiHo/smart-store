export default function dateDifferenceInDays(oldDate, newDate) {
    return parseInt(Math.ceil((oldDate - newDate) / (1000 * 60 * 60 * 24))); 
}