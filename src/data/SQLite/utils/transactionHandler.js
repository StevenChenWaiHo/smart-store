import debugLog from "../../debug/debugLog";

export default function transactionHandler(db, executions, debugMode = true) {
    db.transaction(executions,
        (txObj, error) => debugLog({ debugMode, message: error }),
        () => {}
    )
}