export default function debugLog({ debugMode = false, message }) {
    if (debugMode) {
        alert(message)
    } else {
        console.log(message)
    }
};