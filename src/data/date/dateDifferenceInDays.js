import debugLog from "../utils/debug/debugLog"

export default function dateDifferenceInDays(oldDate, newDate) {
    const msToDay = (1000 * 60 * 60 * 24)
    oldDate.setHours(8)
    oldDate.setMinutes(0)
    oldDate.setSeconds(0)
    newDate.setHours(8)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    debugLog({
        debugMode: true, message: `
        ${oldDate.toString()} ${newDate.toString()}
     ${parseInt(Math.ceil(oldDate / msToDay))} ${parseInt(Math.ceil(newDate / msToDay))}
     ${Math.ceil(oldDate / msToDay)} ${Math.ceil(newDate / msToDay)}
     ${oldDate/ msToDay} ${newDate/ msToDay}`
    })
    return parseInt(Math.ceil(oldDate/ msToDay)) - parseInt(Math.ceil(newDate/ msToDay));
}