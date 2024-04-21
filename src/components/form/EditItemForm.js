import { View, Image, TextInput, Button, Text, Pressable } from "react-native"
import DateTimePicker from '@react-native-community/datetimepicker';
import Counter from "react-native-counters"
import { TouchableOpacity } from "react-native"
import { styles } from "../../styles/global/globalStyle"
import { useEffect, useState, useCallback } from "react"
import dateNumberToString from "../../data/date/dateNumberToString"
import { CheckBox, ListItem } from "@rneui/themed";
import DropDownPicker from "react-native-dropdown-picker";
import { Badge } from "@rneui/themed";
import DropdownListItem from "./dropdown/DropdownListItem";
import getStorageList from "../../data/storage/getStorageList";

export default EditItemForm = ({
    itemInEdit = {},
    setItemInEdit,
    handleSubmit,
    handleCancel,
    handleChangePhotoButton,
    rightButtonText,
}) => {

    const [showAndroidDatePicker, setShowDatePicker] = useState(false);
    const [haveExpiryDate, setHaveExpiryDate] = useState(itemInEdit?.date !== null && itemInEdit?.date !== undefined);


    useEffect(() => {
        setHaveExpiryDate(itemInEdit?.date !== null && itemInEdit?.date !== undefined)
    }, [itemInEdit?.date])

    const onChangeItemName = (text) => {
        setItemInEdit((prev) => ({ ...prev, itemName: text }))
    }

    const onChangeQuantity = (number, type) => {
        setItemInEdit((prev) => ({ ...prev, quantity: number }))
    }

    const onChangeRemark = (text) => {
        setItemInEdit((prev) => ({ ...prev, remarks: text }))
    }

    const onChangeNotifyMe = () => {
        const newHaveExpiryDate = !haveExpiryDate
        setHaveExpiryDate(newHaveExpiryDate)
        setItemInEdit((prev) => ({ ...prev, date: newHaveExpiryDate ? Math.floor(new Date().getTime()) : null }))
    }

    const RenderCounter = () => {
        return <Counter start={itemInEdit?.quantity} onChange={onChangeQuantity} buttonStyle={{ borderWidth: 3 }} max={100} />
    }

    const toggleDatePicker = () => {
        setShowDatePicker(!showAndroidDatePicker)
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate;
            if (Platform.OS === "android") {
                toggleDatePicker();
            }
            setItemInEdit((prev) => ({ ...prev, date: Math.floor(currentDate.getTime()) }))
        } else {
            toggleDatePicker()
        }
    }



    
    const RenderDropDownPicker = () => {
        const [open, setOpen] = useState(false);
        const [storage, setStorage] = useState()
        const [storageList, setStorageList] = useState([]);
        const [newStorage, setNewStorage] = useState(false);

        useEffect(() => {
            updateStorageList()
        }, [])

        const handleOpen = async (bool) => {
            if (bool) {
                
            }
            setOpen(bool)
        }


        const onSelectItem = (storage) => {
            setNewStorage(storage.custom !== undefined)
        }

        const updateStorageList = async () => {
            setStorageList(await getStorageList())
        }


        return (
            <>
                <Text style={styles.inputLabel} >Storage: {newStorage ? <Badge top={2} value="New Storage" status="success" /> : <></>}</Text>
                <DropDownPicker
                    open={open}
                    value={storage}
                    items={storageList}
                    setOpen={handleOpen}
                    setValue={setStorage}
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
                />

            </>

        )
    }

    const RenderDatePicker = useCallback(() => {
        return Platform.OS === 'android' ? (
            <>
                <Pressable style={styles.inputContainer}
                    onPress={toggleDatePicker}>
                    <TextInput
                        placeholder="Enter Date here"
                        style={styles.input}
                        value={dateNumberToString(itemInEdit?.date ? itemInEdit?.date : Math.floor(new Date().getTime()))}
                        editable={false} />
                </Pressable>
            </>) :
            (Platform.OS === 'ios' ? (
                <DateTimePicker
                    mode='date'
                    display='spinner'
                    value={itemInEdit?.date ? new Date(itemInEdit?.date) : new Date()}
                    onChange={onChangeDate}
                    style={styles.datePickerIos} />) : <></>)
    }, [itemInEdit?.date])

    return (
        <View style={styles.inputSheetContainer}>
            <View style={{ ...styles.container, flex: 1, flexDirection: 'row' }}>
                <View style={{ ...styles.topCenteredContainer, flex: 3 }}>
                    {/* Change Item Image Button*/}
                    <TouchableOpacity
                        style={styles.fullExpandedBottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: itemInEdit?.image }}
                            style={styles.bottomSheetImage} />
                        <View style={styles.imageOverlayTextContainer}>
                            <Text style={styles.imageOverlayText}>Edit</Text>
                        </View>

                    </TouchableOpacity>
                </View>
                <View style={{ ...styles.topLeftContainer, flex: 4 }}>
                    <Text style={styles.bottomSheetSmallText}>Code: {itemInEdit?.barcode}</Text>
                    {/* Item Name Input */}
                    <Text style={styles.inputLabel} >Item Name:</Text>
                    <TextInput
                        value={itemInEdit?.itemName}
                        placeholder="Enter Item Name Here"
                        style={styles.input}
                        clearButtonMode='while-editing'
                        enterKeyHint='done'
                        onChangeText={onChangeItemName}
                    />
                </View>
            </View>

            {/* Inputs */}
            <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                <RenderDropDownPicker />

                {/* Quantity Input*/}
                <Text style={styles.inputLabel} >Quantity:</Text>
                <RenderCounter
                    style={{ alignSelf: 'center' }} />


                {/* Expiry Date Input*/}
                <Text style={styles.inputLabel} >Expiry Date:</Text>

                <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, alignItems: 'left', justifyContent: 'center', marginLeft: -15, marginTop: -5 }}>
                        {/* Expiry Date Checkbox Input*/}
                        <CheckBox
                            containerStyle={{ margin: 5, padding: 0 }}
                            wrapperStyle={{ margin: 0, padding: 0 }}
                            textStyle={{ margin: 0, padding: 0 }}
                            size={45}
                            checked={haveExpiryDate}
                            onPress={onChangeNotifyMe}
                            iconType="material-community"
                            checkedIcon="checkbox-marked"
                            uncheckedIcon="checkbox-blank-outline"
                            checkedColor="#27AAE1"
                            uncheckedColor="#27AAE1" />
                    </View>

                    {haveExpiryDate ? <>
                        {/* Date Input*/}
                        <View style={{ flex: 4 }}>
                            <RenderDatePicker />
                            {(Platform.OS === 'android' && showAndroidDatePicker) &&
                                <DateTimePicker
                                    minimumDate={new Date()}
                                    mode='date'
                                    display='calendar'
                                    value={new Date(itemInEdit?.date)}
                                    onChange={onChangeDate} />}
                        </View>

                    </> : <></>}

                </View>

                {/* Remarks Input*/}
                <Text style={styles.inputLabel} >Remarks:</Text>
                <TextInput
                    editable
                    multiline
                    numberOfLines={5}
                    maxLength={300}
                    value={itemInEdit?.remarks}
                    style={styles.mutilineInput}
                    clearButtonMode='while-editing'
                    enterKeyHint='done'
                    onChangeText={onChangeRemark}
                />
            </View>

            {/* Buttons */}
            <View style={{ ...styles.container, flex: 1 }}>
                {/* Cancel Button */}
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ ...styles.buttonContainer, flex: 1 }}>
                        <Button
                            onPress={handleCancel}
                            title="Cancel"
                            style={styles.button} />
                    </View>
                    {/* Save Button */}
                    <View style={{ ...styles.buttonContainer, flex: 1 }}>
                        <Button
                            onPress={handleSubmit}
                            title={rightButtonText}
                            style={styles.button} />
                    </View>
                </View>

            </View>
        </View>)
}