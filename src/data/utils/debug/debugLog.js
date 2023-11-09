export default function debugLog({ debugMode = true, message }) {
    if (debugMode) {
        alert(message)
    } else {
        console.log(message)
    }
};