
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
    const [scanned, setScanned] = useState(false);
    const [barcode, setBarcode] = useState(0);
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [image, setImage] = useState(defaultImage);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [itemConfirmed, setItemConfirmed] = useState(false);
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
        setScanned(false)
        setBarcodeKnown(false)
        setBarcode(0)
        setItemConfirmed(false);
        setItemName('');
        setQuantity(1);
        setDate(new Date());
        setImage(defaultImage);
        bottomSheetRef.current.forceClose();
    }

    const updatedScannedItem = (item) => {
        setItemName(item?.itemName);
        setQuantity(item?.quantity);
        setImage(item?.image);
    }

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
                    resetItem();
                    alert(`Added Item - ${item.itemName}`)
                },
                (txObj, error) => console.log(error))
        })
        console.log([item.barcode, item.itemName, item.quantity, item.image])
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

    const handleItemConfirm = () => {
        bottomSheetRef.current.expand();
    }

    const handleNoCodeAddItem = () => {
        bottomSheetRef.current.expand();
    }

    // Bottom Sheet
    const bottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => itemConfirmed ? ['100%'] : scanned ? ['25%', '100%'] : ['100%'], [scanned, itemConfirmed]);
    const animationConfigs = useBottomSheetSpringConfigs({
        damping: 30,
        overshootClamping: true,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
        stiffness: 500,
    });

    const handleBottomSheetChanged = (toPos) => {
        // Finish taking Photo
        if (takingPhoto && toPos === 0) {
            setTakingPhoto(false);
            console.log('Finish taking Photo')
            return
        }
        // Item Confirmed when add button pressed
        if (!itemConfirmed && !scanned && toPos === 0) {
            setItemConfirmed(true)
            console.log('Item Confirmed when add button pressed')
            return
        }
        // Item Confirmed when swipe up after scanned
        if (!itemConfirmed && scanned && toPos === 1) {
            setItemConfirmed(true)
            console.log('Item Confirmed when swipe up after scanned')
            return
        }
    }

    const handleBottomSheetAnimated = (fromPos, toPos) => {
        Keyboard.dismiss()
        if (takingPhoto) {
            return
        }
        // Discard scanned item after bottom sheet is closed
        if (!takingPhoto && toPos === -1) {
            resetItem();
            bottomSheetRef.current.forceClose();
            console.log('Discard scanned item after bottom sheet is closed')
            return
        }
    }
    // Camera
    const cameraRef = useRef(null);

    const takePicture = async () => {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
        bottomSheetRef.current.expand();

        if (!itemConfirmed) {
            console.log('Item not confirmed when taking Photo')
            return
        }
    }

    const handleBarCodeScanned = (barcode) => {
        setScanned(true);
        setBarcode(barcode);
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM barcodeMap WHERE barcode = (?)', [barcode.data],
                (txObj, resultList) => {
                    console.log(resultList.rows)
                    if (resultList.rows.length === 1) {
                        setBarcodeKnown(true);
                        updatedScannedItem(resultList.rows._array[0])
                    }
                    0
                },
                (txObj, error) => console.log(error))
        })
        bottomSheetRef.current.snapToIndex(0)
    };

    useEffect(() => {
        if (!hasPermission) {
            Camera.requestCameraPermissionsAsync()
        }
    }, [hasPermission])

    useEffect(() => {
        if (takingPhoto) {
            bottomSheetRef.current.forceClose()
        }
    }, [takingPhoto])

    const handleChangePhotoButton = () => {
        setTakingPhoto(true);
        console.log('Taking Photo')
    }

    const RenderBottomSheetWhenScanned = (
        <View style={styles.minimizedBottomSheetContainer}>
            <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                <Image
                    source={{ uri: image }}
                    style={styles.bottomSheetImage} />
            </View>
            <View style={{ flexDirection: 'column', flex: 4 }}>
                <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                    <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                    <Text style={styles.bottomSheetBoldText}>{itemName || 'New Barcode'}</Text>
                    <Text style={styles.bottomSheetBoldText}>Quantity: {quantity || 'New Barcode'}</Text>
                </View>
                <View style={{ ...styles.bottomRightContainer, flex: 1 }}>
                    <Button
                        onPress={handleItemConfirm}
                        style={styles.button}
                        title="Confirm" />
                </View>
            </View>
        </View>)

    const itemNameInput = useRef(null);
    const quantityInput = useRef(null);
    const dateInput = useRef(null)

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
                    focusable={true}
                    autoFocus={true}
                    mode='date'
                    display='spinner'
                    value={date}
                    onChange={onChangeDate}
                    style={styles.datePickerIos} />)
        }
    }

    const RenderBottomSheetWhenItemConfirmed = (
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
                        autoFocus={true}
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

            <View style={{ ...styles.topCenteredContainer, flex: 1 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ ...styles.buttonContainer, flex: 2 }}>
                        <Button
                            onPress={() => resetItem()}
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
                        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                        ref={cameraRef}>
                        {/* Take Photo / Add Item Button */}
                        <TouchableOpacity
                            onPress={takingPhoto ? takePicture : handleNoCodeAddItem}
                            style={takingPhoto ? styles.takePhotoButton : styles.addItemButton}>
                            {takingPhoto ? <></> : <Icon name='add-circle' size={70} />}
                        </TouchableOpacity>
                    </Camera>}


                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={itemConfirmed || scanned}
                    onAnimate={handleBottomSheetAnimated}
                    onChange={handleBottomSheetChanged}
                    animationConfigs={animationConfigs}
                >
                    <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContainer}>
                        {itemConfirmed ? (RenderBottomSheetWhenItemConfirmed) :
                            scanned ? (RenderBottomSheetWhenScanned)
                                : <><Button
                                    onPress={() => resetItem()}
                                    title="Cancel" /></>}
                    </BottomSheetScrollView>
                </BottomSheet>

            </View>
        </GestureHandlerRootView>
    );
}


