import { getAllScheduledNotificationsAsync } from "expo-notifications";
import debugLog from "../debug/debugLog";
import openDatabase from "../SQLite/openDatabase";

export default async function getAllNotifications() {
    const db = openDatabase()
    try {
        const notificationList = await getAllScheduledNotificationsAsync()
        
        debugLog({ message: JSON.stringify(notificationList.map((notificaiton) => `id:${notificaiton.identifier} content: ${notificaiton.content.body}`)) })
    } catch (error) {
        debugLog({message: error})
    }
}