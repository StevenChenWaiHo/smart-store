import { View, Image, TextInput, Button, Text, Pressable, Keyboard } from "react-native"
import DateTimePicker from '@react-native-community/datetimepicker';
import Counter from "react-native-counters"
import { TouchableOpacity, TouchableWithoutFeedback } from "react-native"
import { styles } from "../../styles/global/globalStyle"
import { useEffect, useState, useCallback, useMemo } from "react"
import dateNumberToString from "../../data/date/dateNumberToString"
import { CheckBox, ListItem } from "@rneui/themed";
import DropDownPicker from "react-native-dropdown-picker";
import { Badge } from "@rneui/themed";
import DropdownListItem from "./dropdown/DropdownListItem";
import getStorageList from "../../data/storage/getStorageList";
import { useForm, Controller } from "react-hook-form";
import { DEFAULT_IMAGE } from "../../constants/image";
import { Item } from "../../types/item";

interface EditItemFormInterface {
    itemInEdit: Item,
    handleSubmit: (data: Item) => void,
    handleCancel: () => void,
    handleChangePhotoButton: () => void,
    rightButtonText: string,
}

export interface ItemInEdit extends Item{
    id?: number,
    haveDate?: boolean,
    newStorage?: boolean
}

export default function EditItemForm ({
    itemInEdit,
    handleSubmit,
    handleCancel,
    handleChangePhotoButton,
    rightButtonText,
}: EditItemFormInterface) {
    const defaultItem = useMemo(() => ({
        ...itemInEdit,
        quantity: itemInEdit?.quantity || 1,
        haveDate: itemInEdit ? itemInEdit?.date !== undefined && itemInEdit?.date !== null : true,
        newStorage: false
    }), [itemInEdit])

    console.log("Item in Edit", itemInEdit)
    const { control, setValue, getValues, handleSubmit: formSubmit, watch, reset } = useForm({ defaultValues: defaultItem })

    useEffect(() => {
        reset(defaultItem)
    }, [itemInEdit])

    const onSubmitButtonPress = async (item: ItemInEdit) => {
        // TODO: Move this to react hook form logic
        if (item.itemName === '') {
            alert('Item Name cannot be empty')
            return;
        }

        if (!item.quantity || item.quantity < 0) {
            alert('Quantity cannot be 0 or less')
            return;
        }

        console.log("Submit ", item);
        const { haveDate, newStorage, storage, ...itemData } = item
        if (!haveDate) {
            itemData['date'] = null
        }
        handleSubmit(itemData)
        reset()
    }

    const onCancelButtonPress = () => {
        reset()
        handleCancel()
    }

    // Item Name
    const ItemNameInput = () => {
        return (
            <>
                <Text style={styles.inputLabel} >Item Name:</Text>
                <Controller
                    control={control}
                    name="itemName"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            value={value}
                            placeholder="Enter Item Name Here"
                            style={styles.input}
                            clearButtonMode='while-editing'
                            enterKeyHint='done'
                            onChangeText={onChange}
                        />
                    )}
                />
            </>)
    }

    // Storage
    const StorageInput = () => {
        const [open, setOpen] = useState(false);
        const [storageList, setStorageList] = useState([]);
        const [newStorage, setNewStorage] = useState(false);

        useEffect(() => {
            updateStorageList()
        }, [])

        const handleOpen = async (bool: boolean) => {
            if (bool) {

            }
            setOpen(bool)
        }

        const onSelectItem = (storage: string) => {
            const isNewStorage = storage.custom !== undefined
            setNewStorage(isNewStorage)
            setValue("newStorage", isNewStorage)
        }

        const updateStorageList = async () => {
            setStorageList(await getStorageList())
        }


        return (
            <>
                <Text style={styles.inputLabel} >Storage: {newStorage ? <Badge top={2} value="New Storage" status="success" /> : <></>}</Text>
                <Controller
                    control={control}
                    name="storage"
                    render={({ field: { onChange, value } }) => (
                        <DropDownPicker
                            open={open}
                            value={value}
                            items={storageList}
                            setOpen={handleOpen}
                            setValue={(setStateFunction) => onChange(setStateFunction(null))} // Dropdown Picker Library have very strange behavior
                            setItems={setStorageList}
                            onSelectItem={onSelectItem}
                            searchable={true}
                            style={styles.input}
                            showBadgeDot={true}
                            listMode="SCROLLVIEW"
                            scrollViewProps={{
                                decelerationRate: "normal"
                            }}
                            placeholder="Select a Storage"
                            zIndex={1}
                            autoScroll={true}
                            maxHeight={300}
                            // Search
                            searchPlaceholder="Search..."
                            searchContainerStyle={{ padding: 0, borderBottomWidth: 0 }}
                            searchTextInputStyle={[styles.input, { borderColor: '#aaaaaa', borderWidth: 0.5 }]}
                            // Dropdown Container
                            dropDownContainerStyle={{
                                ...styles.input, backgroundColor: 'white',
                                borderColor: '#aaaaaa',
                                borderWidth: 0.5,
                                shadowColor: 'rgba(255, 255, 255, 1)',
                                shadowOffset: { width: -10, height: 1 },
                                shadowRadius: 10,

                            }}
                            // Items
                            closeOnBackPressed={true}
                            itemSeparator={true}
                            listItemContainerStyle={{ height: 60, borderRadius: 10 }}
                            renderListItem={DropdownListItem}
                            // Custom Item
                            addCustomItem={true}
                            customItemLabelStyle={{}}
                        />)} />
            </>
        )
    }


    // Quantity
    const QuantityInput = () => {
        return (
            <>
                <Text style={styles.inputLabel} >Quantity:</Text>
                <Controller
                    control={control}
                    name="quantity"
                    render={({ field: { onChange, value } }) => (
                        <Counter
                            style={{ alignSelf: 'center' }}
                            start={value}
                            onChange={onChange}
                            buttonStyle={{ borderWidth: 3 }}
                            max={100} />)} />
            </>
        )
    }

    // Expiry Date
    const ExpiryDateInput = () => {
        const [haveDate, setHaveDate] = useState(getValues("haveDate"))
        const [showAndroidDatePicker, setShowDatePicker] = useState(false);

        const toggleDatePicker = () => {
            setShowDatePicker(!showAndroidDatePicker)
        }

        const onPressHaveDate = () => {
            setValue("haveDate", !haveDate)
            if (!getValues("date")) {
                setValue("date", Math.floor(new Date().getTime()))
            }
            setHaveDate(!haveDate)
        }

        const onChangeDate = ({ type }, selectedDate) => {
            if (type == "set") {
                const currentDate = selectedDate;
                if (Platform.OS === "android") {
                    toggleDatePicker();
                }
                setValue("date", Math.floor(currentDate.getTime()))
            } else {
                toggleDatePicker()
            }
        }

        const RenderExpiryDatePicker = ({
            value,
        }) => {

            return Platform.OS === 'android' ? (
                <Pressable style={styles.inputContainer}
                    onPress={toggleDatePicker}>
                    <TextInput
                        placeholder="Enter Date here"
                        style={styles.input}
                        value={dateNumberToString(value ? value : Math.floor(new Date().getTime()))}
                        editable={false} />
                </Pressable>) :
                (Platform.OS === 'ios' ? (
                    <DateTimePicker
                        mode='date'
                        display='spinner'
                        value={value ? new Date(value) : new Date()}
                        onChange={onChangeDate}
                        style={styles.datePickerIos} />) : <></>)
        }

        return (
            <>
                <Text style={styles.inputLabel} >Expiry Date:</Text>

                <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, alignItems: 'left', justifyContent: 'center', marginLeft: -15, marginTop: -5 }}>
                        {/* Expiry Date Checkbox Input*/}
                        <CheckBox
                            containerStyle={{ margin: 5, padding: 0 }}
                            wrapperStyle={{ margin: 0, padding: 0 }}
                            textStyle={{ margin: 0, padding: 0 }}
                            size={45}
                            checked={haveDate}
                            onPress={onPressHaveDate}
                            iconType="material-community"
                            checkedIcon="checkbox-marked"
                            uncheckedIcon="checkbox-blank-outline"
                            checkedColor="#27AAE1"
                            uncheckedColor="#27AAE1" />
                    </View>


                    {haveDate ?
                        <Controller
                            control={control}
                            name="date"
                            render={({ field: { onChange, value } }) => {
                                return (<>
                                    {/* Date Input*/}
                                    < View style={{ flex: 4 }}>
                                        <RenderExpiryDatePicker value={value} />
                                        {(Platform.OS === 'android' && showAndroidDatePicker) &&
                                            <DateTimePicker
                                                minimumDate={new Date()}
                                                mode='date'
                                                display='calendar'
                                                value={value ? new Date(value) : new Date()}
                                                onChange={onChangeDate} />}
                                    </View>
                                </>)
                            }
                            } /> : <></>}



                </View >
            </>)
    }



    // Remark
    const RemarkInput = () => (
        <>
            <Text style={styles.inputLabel} >Remarks:</Text>
            <Controller
                control={control}
                name="remarks"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        editable
                        multiline
                        numberOfLines={5}
                        maxLength={300}
                        value={value}
                        style={styles.mutilineInput}
                        clearButtonMode='while-editing'
                        enterKeyHint='done'
                        onChangeText={onChange}
                    />
                )} />
        </>
    )

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inputSheetContainer}>
                <View style={{ ...styles.container, flex: 1, flexDirection: 'row' }}>
                    <View style={{ ...styles.topCenteredContainer, flex: 3 }}>
                        {/* Change Item Image Button*/}
                        <TouchableOpacity
                            style={styles.fullExpandedBottomSheetImageContainer}
                            onPress={handleChangePhotoButton}>
                            <Image
                                source={{ uri: itemInEdit?.image || DEFAULT_IMAGE }}
                                style={styles.bottomSheetImage} />
                            <View style={styles.imageOverlayTextContainer}>
                                <Text style={styles.imageOverlayText}>Edit</Text>
                            </View>

                        </TouchableOpacity>
                    </View>
                    <View style={{ ...styles.topLeftContainer, flex: 4 }}>
                        <Text style={styles.bottomSheetSmallText}>Code: {itemInEdit?.barcode}</Text>
                        {/* Item Name Input */}
                        <ItemNameInput />
                    </View>
                </View>

                {/* Inputs */}
                <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                    {/* Storage Input */}
                    {/* <StorageInput /> */}

                    {/* Quantity Input*/}
                    <QuantityInput />

                    {/* Expiry Date Input*/}
                    <ExpiryDateInput />

                    {/* Remarks Input*/}
                    <RemarkInput />

                </View>

                {/* Buttons */}
                <View style={{ ...styles.container, flex: 1 }}>
                    {/* Cancel Button */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ ...styles.buttonContainer, flex: 1 }}>
                            <Button
                                onPress={onCancelButtonPress}
                                title="Cancel"
                                style={styles.button} />
                        </View>
                        {/* Save Button */}
                        <View style={{ ...styles.buttonContainer, flex: 1 }}>
                            <Button
                                onPress={formSubmit(onSubmitButtonPress)}
                                title={rightButtonText}
                                style={styles.button} />
                        </View>
                    </View>

                </View>
            </View>
        </TouchableWithoutFeedback>
    )
}