import { View, Image, TextInput, Button, Text } from "react-native"
import Counter from "react-native-counters"
import { TouchableOpacity } from "react-native"
import { styles } from "../styles/global/globalStyle"
import { useEffect, useState } from "react"

export default EditItemForm = ({
    item = {},
    handleSubmit,
    handleCancel,
    handleChangePhotoButton,
    rightButtonText,
}) => {

    const [quantity, setQuantity] = useState(item?.quantity)

    const onChangeQuantity = (number, type) => {
        setQuantity(number)
    }

    useEffect(() => {
        setQuantity(item.quantity)
    })

    return (
        <View style={styles.inputSheetContainer}>
            {/* Item Name Input */}
            <View style={{ ...styles.topCenteredContainer, flex: 2, flexDirection: 'row' }}>
                <View style={{ ...styles.topCenteredContainer, flex: 3 }}>
                    <TouchableOpacity
                        style={styles.fullExpandedBottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: item?.image }}
                            style={styles.bottomSheetImage} />
                    </TouchableOpacity>
                </View>
                <View style={{ ...styles.topLeftContainer, flex: 4 }}>
                    <Text style={styles.bottomSheetSmallText}>Code: {item?.barcode}</Text>
                    <Text style={styles.inputLabel} >Item Name:</Text>
                    <TextInput
                        value={item?.itemName}
                        placeholder="Enter Item Name Here"
                        style={styles.input}
                        clearButtonMode='while-editing'
                        enterKeyHint='done'
                        onChangeText={(val) => setItemName(val)}
                    />
                </View>
            </View>

            {/* Inputs */}
            <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                <Text style={styles.inputLabel}>Date:</Text>
                {/* <RenderDatePicker /> */}

                <Text style={styles.inputLabel} >Quantity:</Text>
                <Counter start={quantity} onChange={onChangeQuantity} max={100} />

                <Text style={styles.inputLabel} >Remarks:</Text>
                <TextInput
                    editable
                    multiline
                    numberOfLines={5}
                    maxLength={300}
                    value={item?.remarks}
                    style={styles.mutilineInput}
                    clearButtonMode='while-editing'
                    enterKeyHint='done'
                />
            </View>

            {/* Buttons */}
            <View style={{ ...styles.container, flex: 1 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ ...styles.buttonContainer, flex: 1 }}>
                        <Button
                            onPress={handleCancel}
                            title="Cancel"
                            style={styles.button} />
                    </View>
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