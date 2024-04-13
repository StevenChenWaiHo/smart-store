import * as Notifications from "expo-notifications";

export async function schedulePushNotification(item) {
    const trigger = new Date(item?.date);
    trigger.setHours(8)
    trigger.setMinutes(0)
    trigger.setSeconds(0)

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: "Your Item is Expiring 📬",
            body: `${item?.itemName} is expiring on ${new Date(item?.date).toDateString()}`,
        },
        trigger,
    });
}