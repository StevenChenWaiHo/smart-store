import { Item } from "../types/item";
import { DEFAULT_IMAGE } from "./image";

export const UNNAMED_ITEM_NAME = "Unknown Item";

export const DEFAULT_ITEM: Item = {
    barcode: "",
    image: DEFAULT_IMAGE,
    date: Math.floor(new Date().getTime()),
    itemName: "",
    quantity: 1,
    remarks: "",
    notificationId: null
}