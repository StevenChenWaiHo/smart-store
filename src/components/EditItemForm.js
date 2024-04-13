import { View, Image, TextInput, Button, Text, Pressable } from "react-native"
import DateTimePicker from '@react-native-community/datetimepicker';
import Counter from "react-native-counters"
import { TouchableOpacity } from "react-native"
import { styles } from "../styles/global/globalStyle"
import { useEffect, useState, useCallback } from "react"
import dateNumberToString from "../data/date/dateNumberToString"
import { CheckBox } from "@rneui/themed";



export default EditItemForm = ({
    itemInEdit = {},
    setItemInEdit,
    handleSubmit,
    handleCancel,
    handleChangePhotoButton,
    rightButtonText,
}) => {

    const [showAndroidDatePicker, setShowDatePicker] = useState(false);
    const [haveExpiryDate, setHaveExpiryDate] = useState(true);

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
        return <Counter start={itemInEdit?.quantity} onChange={onChangeQuantity} buttonStyle={{ borderWidth: 3}} max={100} />
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
            <View style={{ ...styles.topCenteredContainer, flex: 1, flexDirection: 'row' }}>
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
                {/* Quantity Input*/}
                <Text style={styles.inputLabel} >Quantity:</Text>
                <RenderCounter
                    style={{ alignSelf: 'center' }} />

                <Text style={styles.inputLabel} >Expiry Date:</Text>

                <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, alignItems: 'left', justifyContent: 'center', marginLeft: -15, marginTop: -5}}>
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