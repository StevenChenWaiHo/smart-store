
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { Camera, CameraType }
    from 'expo-camera';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { styles } from '../../styles/global/globalStyle'
import defaultImage from '../../assets/images/noImage.png'

export default function AddItemScreen() {
    const [hasPermission, setHasPermission] = Camera.useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [itemName, setItemName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [image, setImage] = useState('https://www.freeiconspng.com/uploads/no-image-icon-11.PNG');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [itemConfirmed, setItemConfirmed] = useState(false);
    const [takingPhoto, setTakingPhoto] = useState(false);

    const handleItemConfirm = () => {
        setItemConfirmed(true);
        bottomSheetRef.current.expand();
    }

    const handleNoCodeAddItem = () => {
        setItemConfirmed(true);
        bottomSheetRef.current.expand();
    }

    // Bottom Sheet
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => itemConfirmed ? ['100%'] : ['25%', '100%'], [itemConfirmed]);

    const handleBottomSheetChanged = (pos) => {
        console.log('Modal Current Position: ', pos)
        if (itemConfirmed && takingPhoto) {
            return;
        }
        // Discard scanned item after bottom sheet is closed
        if (pos === -1) {
            setScanned(false);
            setItemConfirmed(false)
            return;
        }
        // Item Confirmed when swipe up after scanned
        if (pos === 1 && scanned) {
            setItemConfirmed(true)
            return;
        }
    }
    // Camera
    const cameraRef = useRef(null);

    const takePicture = async () => {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
        setTakingPhoto(false);

        if (!itemConfirmed) {
            console.log('Item not confirmed when taking Photo')
            return
        }

        bottomSheetRef.current.expand();
    }

    const handleBarCodeScanned = (barcode) => {
        setScanned(true);
        setBarcode(barcode);
        bottomSheetRef.current.snapToIndex(0)
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }
    const handleChangePhotoButton = () => {
        setTakingPhoto(true);
        bottomSheetRef.current.close();
    }

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
                    display='compact'
                    value={date}
                    onChange={onChangeDate}
                    style={styles.datePicker} />)
        }
    }

    const RenderBottomSheetWhenScanned = () => {
        return (
            <View style={styles.modalContainer}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                        <TouchableOpacity
                            style={styles.bottomSheetImageContainer}>
                            <Image
                                source={{ uri: image }}
                                style={styles.bottomSheetImage} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ ...styles.topLeftContainer, flex: 4 }}>
                        <Text>Code: {barcode.data}</Text>
                        <Text>Item Name:</Text>
                        <TextInput
                            placeholder="Enter item name here"
                            style={styles.input}
                            value={itemName}
                        />

                    </View>
                </View>
            </View>)
    }

    const RenderBottomSheetWhenItemConfirmed = () => {
        return (
            <>
                <View style={styles.topLeftContainer}>
                    <Button
                        onPress={handleChangePhotoButton}
                        title="Edit Image" />
                    <TouchableOpacity
                        style={styles.bottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: image }}
                            style={styles.bottomSheetImage} />
                    </TouchableOpacity>
                </View>
                <View style={styles.topLeftContainer}>
                    <Text>Code: {barcode.data}</Text>
                    <Text>Item Name:</Text>
                    <TextInput
                        placeholder="Enter item name here"
                        style={styles.input}
                        value={itemName}
                    />
                    <Text>Date:</Text>
                    <RenderDatePicker />
                </View>

                <View style={styles.bottomRightContainer}>
                    {!itemConfirmed && <Button
                        onPress={handleItemConfirm}
                        title="YES" />}
                </View>
            </>
        )
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>

                <Camera
                    style={styles.camera}
                    type={CameraType.back}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    ref={cameraRef}>
                    {/* Take Photo Button */}
                    {takingPhoto &&
                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.takePhotoButton}>
                        </TouchableOpacity>}
                    {!itemConfirmed &&
                        <TouchableOpacity
                            onPress={handleNoCodeAddItem}
                            style={styles.addItemButton}>
                            <Image
                            source={{ uri: 'https://icons.iconarchive.com/icons/iconsmind/outline/512/Add-icon.png' }}
                            style={styles.bottomSheetImage} />
                        </TouchableOpacity>}

                </Camera>


                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enableContentPanningGesture={true}
                    enablePanDownToClose={true}
                    onChange={handleBottomSheetChanged}>
                    {itemConfirmed ? (<RenderBottomSheetWhenItemConfirmed />) : scanned ? (<RenderBottomSheetWhenScanned />) : <></>}
                </BottomSheet>

            </View>


        </GestureHandlerRootView>
    );
}


