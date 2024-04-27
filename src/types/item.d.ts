export interface Item {
    itemName: string
    date: number
    quantity: number
    image: string
    barcode: string | null
    remarks: string
}

export interface SavedItem {
    itemName: string
    quantity: number
    image: string
    barcode: string
}