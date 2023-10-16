
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { Camera, CameraType } from 'expo-camera';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { styles } from '../../styles/global/globalStyle'

export default function AddItemScreen() {
    const [hasPermission, setHasPermission] = Camera.useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [itemName, setItemName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [image, setImage] = useState();
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Bottom Nav Bar
    const Tab = createMaterialTopTabNavigator();
    const mode = ['SCAN', 'ITEM', 'LIST']

    // Bottom Sheet
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '100%'], []);

    const handleBottomSheetChanged = (pos) => {
        // Discard scanned item after bottom sheet is closed
        if (pos === -1) {
            setScanned(false);
        }
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

    // Camera
    const cameraRef = useRef(null);

    const takePicture = async () => {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
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

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>

                <Camera
                    style={styles.camera}
                    type={CameraType.back}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    ref={cameraRef}>
                    {/* Take Photo Button */}
                    {scanned &&
                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.bottomSheetImage}
                        />}

                </Camera>
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enableContentPanningGesture={true}
                enablePanDownToClose={true}
                onChange={handleBottomSheetChanged}>
                <View style={styles.modalContainer}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ ...styles.topCenteredContainer, flex: 5 }}>
                            <TouchableOpacity>
                                <Image
                                    source={{ uri: image }}
                                    style={{ height: 100, width: 100 }} />
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
                            <Text>Date:</Text>
                            {!showDatePicker &&
                                (<Pressable
                                    onPress={toggleDatePicker}>
                                    <TextInput
                                        placeholder="Enter Date here"
                                        style={styles.input}
                                        value={dateString}
                                        editable={false}
                                        onPressIn={toggleDatePicker}
                                    />
                                </Pressable>)}

                            {showDatePicker &&
                                (<DateTimePicker
                                    mode='date'
                                    display='spinner'
                                    value={new Date()}
                                    onChange={onChangeDate}
                                    style={styles.datePicker} />)}
                        </View>
                    </View>
                </View>
            </BottomSheet>
        </GestureHandlerRootView>
    );
}


