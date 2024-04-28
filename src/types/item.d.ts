export interface Item {
    itemName: string
    date: DateNumber | null
    quantity: number
    image: string
    barcode: string | null
    remarks: string
    notificationId: string | null
    storage?: string
}

export interface SavedItem {
    itemName: string
    quantity: number
    image: string
    barcode: string
}
  
export interface ItemInDatabase extends Item {
    id: number
}