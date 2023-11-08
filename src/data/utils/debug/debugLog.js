export default function debugLog({ debug = false, message }) {
    if (debug) {
        alert(message)
    } else {
        console.log(message)
    }
};