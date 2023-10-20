
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { Easing } from 'react-native-reanimated';
import { Camera, CameraType } from 'expo-camera';
import { styles } from '../../styles/global/globalStyle'
import { Icon } from '@rneui/themed';
import { useIsFocused } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';


export default function AddItemScreen({ route }) {
    // const db = route.params.database;
    const db = SQLite.openDatabase('list.db');
    const defaultImage = 'https://cdn4.iconfinder.com/data/icons/picture-sharing-sites/32/No_Image-1024.png';

    const [firstLoad, setFirstLoad] = useState(true);

    const [hasPermission, requestPermission] = Camera.useCameraPermissions();
    const [itemStatus, setItemStatus] = useState({ editing: false, scanned: false }); // Combine two state to avoid duplicate triggers
    const [barcode, setBarcode] = useState(0);
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [image, setImage] = useState(defaultImage);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [takingPhoto, setTakingPhoto] = useState(false);
    const [barcodeKnown, setBarcodeKnown] = useState(false)
    const focused = useIsFocused();

    const item = {
        barcode: barcode.data,
        image,
        date: Math.floor(date.getTime()), // ios result in decimal number
        itemName,
        quantity,
    }

    const resetItem = () => {
        setBarcodeKnown(false)
        setBarcode(0)
        setItemName('');
        setQuantity(1);
        setDate(new Date());
        setImage(defaultImage);
    }

    const updatedScannedItem = (item) => {
        setItemName(item?.itemName);
        setQuantity(item?.quantity);
        setImage(item?.image);
    }

    // console.log('editing: ', editing)
    // console.log('scanned: ', scanned)

    useEffect(() => {
        if (firstLoad) {
            // db.transaction(tx => {
            //     tx.executeSql(`DROP TABLE IF EXISTS list`)
            // })

            db.transaction(tx => {
                tx.executeSql(`CREATE TABLE IF NOT EXISTS list (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                itemName TEXT,
                date INTEGER,
                quantity INTEGER,
                image BLOB)`)
            })
            db.transaction(tx => {
                tx.executeSql(`CREATE TABLE IF NOT EXISTS barcodeMap (
                barcode INTEGER PRIMARY KEY, 
                itemName TEXT,
                quantity INTEGER,
                image BLOB)`)
            })
            setFirstLoad(false)
        }
    }, [firstLoad])

    const addItemToList = async (event) => {
        if (item.itemName === '') {
            alert('Item Name cannot be empty')
            return;
        }

        if (!item.quantity || item.quantity < 0) {
            alert('Quantity cannot be empty or less than 0')
            return;
        }
        db.transaction(tx => {
            tx.executeSql('INSERT INTO list (itemName, date, quantity, image) values (?, ?, ?, ?)', [item.itemName, item.date, item.quantity, item.image],
                (txObj, resultList) => {
                    alert(`Added Item - ${item.itemName}`)
                    setItemStatus({ editing: false, scanned: false })
                },
                (txObj, error) => console.log(error))
        })
        console.log([item.barcode, item.itemName, item.quantity, item.image])
        if (!itemStatus.scanned) {
            return
        }
        if (barcodeKnown) {
            db.transaction(tx => {
                tx.executeSql('UPDATE barcodeMap SET itemName = (?), quantity = (?), image = (?) WHERE barcode = (?)', [item.itemName, item.quantity, item.image, item.barcode],
                    (txObj, resultList) => {
                        console.log(resultList.rows)
                    },
                    (txObj, error) => console.log(error))
            })
        } else {
            db.transaction(tx => {
                tx.executeSql('INSERT INTO barcodeMap (barcode, itemName, quantity, image) values (?, ?, ?, ?)', [item.barcode, item.itemName, item.quantity, item.image],
                    (txObj, resultList) => {
                        console.log(resultList.rows)
                    },
                    (txObj, error) => console.log(error))
            })
        }
    }

    // Bottom Sheet
    const bottomSheetRef = useRef(null);

    const handleItemConfirm = () => {
        setItemStatus({ editing: true, scanned: true })
    }

    const handleNoCodeAddItem = () => {
        setItemStatus({ editing: true, scanned: false })
    }

    const snapPoints = useMemo(() => itemStatus.editing ? ['100%'] : itemStatus.scanned ? (barcodeKnown ? ['40%%', '100%'] : ['25%%', '100%']) : ['100%'], [itemStatus.scanned, itemStatus.editing, barcodeKnown]);
    const animationConfigs = useBottomSheetSpringConfigs({
        damping: 30,
        overshootClamping: true,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
        stiffness: 500,
    });

    useEffect(() => {
        console.log('editing: ', itemStatus.editing)
        console.log('scanned: ', itemStatus.scanned)
        if (!itemStatus.scanned && !itemStatus.editing) {
            console.log('bottom sheet should be close')
            resetItem()
            bottomSheetRef.current.close()
            return
        }
        if (takingPhoto) {
            bottomSheetRef.current.close()
            return
        }
        if (itemStatus.editing) {
            bottomSheetRef.current.expand()
            console.log('bottom sheet should be fully expanded')
            return
        }
        if (itemStatus.scanned) {
            bottomSheetRef.current.snapToIndex(0)
            console.log('bottom sheet should be half expanded')
            return
        }

    }, [itemStatus])

    const handleBottomSheetChanged = (toPos) => {
        // Finish taking Photo
        if (takingPhoto && toPos === 0) {
            setTakingPhoto(false);
            console.log('Finish taking Photo')
            return
        }
        // Item Confirmed when swipe up after scanned
        if (!itemStatus.editing && itemStatus.scanned && toPos === 1) {
            setItemStatus({ editing: true, scanned: true })
            console.log('Item Confirmed when swipe up after scanned')
            return
        }
        // Item Confirmed when add button pressed
        // if (!editing && !scanned && toPos === 0) {
        //     setediting(true)
        //     console.log('Item Confirmed when add button pressed')
        //     return
        // }

    }

    const handleBottomSheetAnimated = (fromPos, toPos) => {
        if (takingPhoto) {
            return
        }
        // Discard scanned item after bottom sheet is closed
        if (!takingPhoto && !itemStatus.editing && itemStatus.scanned && toPos === -1) {
            setItemStatus({ editing: false, scanned: false })
            Keyboard.dismiss()
            console.log('Discard item after bottom sheet is closed')
            return
        }
    }
    // Camera
    const cameraRef = useRef(null);

    const takePicture = async () => {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
        bottomSheetRef.current.expand();

        if (!itemStatus.editing) {
            console.log('Item not confirmed when taking Photo')
            return
        }
    }

    const handleBarCodeScanned = (barcode) => {
        if (itemStatus.editing) {
            return;
        }
        setBarcode(barcode);
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM barcodeMap WHERE barcode = (?)', [barcode.data],
                (txObj, resultList) => {
                    console.log(resultList.rows)
                    setItemStatus({ editing: false, scanned: true })
                    if (resultList.rows.length === 1) {
                        setBarcodeKnown(true);
                        updatedScannedItem(resultList.rows._array[0])
                    }
                },
                (txObj, error) => console.log(error))
        })
    };

    useEffect(() => {
        if (!hasPermission) {
            Camera.requestCameraPermissionsAsync()
        }
    }, [hasPermission])

    const handleChangePhotoButton = () => {
        setTakingPhoto(true);
        console.log('Taking Photo')
    }

    const itemNameInput = useRef(null);
    const quantityInput = useRef(null);

    // Date
    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate;
            setDate(selectedDate)
            if (Platform.OS === "android") {
                toggleDatePicker();
                setDateString(currentDate.toDateString())
            }
        } else {
            toggleDatePicker()
        }
    }

    const RenderDatePicker = () => {
        if (Platform.OS === 'android') {
            // DatePicker for android
            return (
                <>
                    <Pressable
                        onPress={toggleDatePicker}>
                        <TextInput
                            placeholder="Enter Date here"
                            style={styles.input}
                            value={dateString}
                            editable={false}
                            onPressIn={toggleDatePicker} />
                    </Pressable>
                    {
                        showDatePicker &&
                        (<DateTimePicker
                            mode='date'
                            display={'calendar'}
                            value={date}
                            onChange={onChangeDate} />)
                    }
                </>);
        } else if (Platform.OS === 'ios') {
            // DatePicker for ios
            return (
                <DateTimePicker
                    mode='date'
                    display='spinner'
                    value={date}
                    onChange={onChangeDate}
                    style={styles.datePickerIos} />)
        }
    }

    const RenderBottomSheetWhenScanned =
        barcodeKnown ? (
            <View style={styles.barcodeKnownBottomSheetContainer}>
                <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                    <Image
                        source={{ uri: image }}
                        style={styles.bottomSheetImage} />
                </View>
                <View style={{ flexDirection: 'column', flex: 4 }}>
                    <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                        <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                        <Text style={styles.bottomSheetBoldText}>{itemName}</Text>
                        <Text style={styles.bottomSheetBoldText}>Quantity: {quantity || 'New Barcode'}</Text>
                        <Text style={styles.inputLabel}>Date:</Text>
                        <RenderDatePicker />
                    </View>
                    <View style={{ ...styles.bottomRightContainer, flex: 1 }}>
                        <Button
                            onPress={addItemToList}
                            style={styles.button}
                            title="Add to List" />
                    </View>
                </View>
            </View>)
            : (
                <View style={styles.barcodeUnknownBottomSheetContainer}>
                    <View style={{ flexDirection: 'column', flex: 4 }}>
                        <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                            <Text style={styles.bottomSheetBoldText}>Code: {barcode.data}</Text>
                            <Text style={styles.bottomSheetBoldText}>New Barcode</Text>
                        </View>
                        <View style={{ ...styles.bottomRightContainer, flex: 1 }}>
                            <Button
                                onPress={handleItemConfirm}
                                style={styles.button}
                                title="Add Details" />
                        </View>
                    </View>
                </View>)

    const RenderBottomSheetWhenEditing = (
        <View style={styles.inputSheetContainer}>

            <View style={{ ...styles.topCenteredContainer, flex: 2, flexDirection: 'row' }}>
                <View style={{ ...styles.topCenteredContainer, flex: 1 }}>
                    <TouchableOpacity
                        style={styles.fullExpandedBottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: image }}
                            style={styles.fullExpandedBottomSheetImage} />
                    </TouchableOpacity>
                </View>
                <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                    <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                    <Text style={styles.inputLabel} >Item Name:</Text>
                    <TextInput
                        ref={itemNameInput}
                        value={itemName}
                        autoFocus={!barcodeKnown}
                        placeholder="Enter Item Name Here"
                        style={styles.input}
                        clearButtonMode='while-editing'
                        enterKeyHint='done'
                        onChangeText={(val) => setItemName(val)}
                    />
                </View>
            </View>
            <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                <Text style={styles.inputLabel}>Date:</Text>
                <RenderDatePicker />
                <Text style={styles.inputLabel} >Quantity:</Text>
                <TextInput
                    ref={quantityInput}
                    value={quantity.toString()}
                    inputMode='numeric'
                    keyboardType='numeric'
                    placeholder="Enter Quantity Here"
                    clearButtonMode='while-editing'
                    enterKeyHint='done'
                    style={styles.input}
                    onChangeText={(val) => setQuantity(val)} />
            </View>

            <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ ...styles.buttonContainer, flex: 2 }}>
                        <Button
                            onPress={() => setItemStatus({ editing: false, scanned: false })}
                            title="Cancel"
                            style={styles.button} />
                    </View>
                    <View style={{ ...styles.buttonContainer, flex: 2 }}>
                        <Button
                            onPress={addItemToList}
                            title="Add To List"
                            style={styles.button} />
                    </View>
                </View>

            </View>
        </View>
    )

    const cameraButtonStyle = { ...styles.camera, alignItems: takingPhoto ? 'center' : 'flex-end' }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>

            <StatusBar hidden={true} />

            <View style={styles.container}>
                {focused &&
                    <Camera
                        style={cameraButtonStyle}
                        type={CameraType.back}
                        onBarCodeScanned={(itemStatus.scanned || itemStatus.editing) ? undefined : handleBarCodeScanned}
                        ref={cameraRef}>
                        {/* Take Photo / Add Item Button */}
                        <TouchableOpacity
                            onPress={takingPhoto ? takePicture : handleNoCodeAddItem}
                            style={takingPhoto ? styles.takePhotoButton : styles.addItemButton}>
                            {takingPhoto ? <></> : <Icon name='add-circle' size={70} />}
                        </TouchableOpacity>
                    </Camera>}


                {!firstLoad && <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={!itemStatus.editing}
                    onAnimate={handleBottomSheetAnimated}
                    onChange={handleBottomSheetChanged}
                    animationConfigs={animationConfigs}
                >
                    <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContainer}>
                        {itemStatus.editing ? (RenderBottomSheetWhenEditing) :
                            itemStatus.scanned ? (RenderBottomSheetWhenScanned)
                                : <><Button
                                    onPress={() => setItemStatus({ editing: false, scanned: false })}
                                    title="Cancel" /></>}
                    </BottomSheetScrollView>
                </BottomSheet>}

            </View>
        </GestureHandlerRootView>
    );
}


