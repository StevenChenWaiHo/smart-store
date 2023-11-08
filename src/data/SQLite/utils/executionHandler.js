import debugLog from "../../utils/debug/debugLog";

export default function executionsHandler(
    tx,
    sqlStatement,
    params,
    resultCallback,
    debug = true) {
    tx.transaction(
        sqlStatement,
        params,
        resultCallback,
        (txObj, error) => debugLog({ debug, message: JSON.stringify(error) }),
    )
}