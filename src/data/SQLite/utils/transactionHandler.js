import debugLog from "../../utils/debug/debugLog";

export default function transactionHandler(db, executions, debugMode = true) {
    db.transaction(executions,
        (txObj, error) => debugLog({ debugMode, message: error }),
        () => debugLog({ debugMode, message: 'Transaction Done' })
    )
}