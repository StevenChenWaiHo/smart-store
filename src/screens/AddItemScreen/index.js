
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { Easing } from 'react-native-reanimated';
import { Camera, CameraType } from 'expo-camera';
import { styles } from '../../styles/global/globalStyle'
import { Icon } from '@rneui/themed';
import { useIsFocused } from '@react-navigation/native';

export default function AddItemScreen() {
    const [hasPermission, setHasPermission] = Camera.useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [itemName, setItemName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [image, setImage] = useState('https://cdn4.iconfinder.com/data/icons/picture-sharing-sites/32/No_Image-1024.png');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [itemConfirmed, setItemConfirmed] = useState(false);
    const [takingPhoto, setTakingPhoto] = useState(false);
    const focused = useIsFocused();

    // console.log('itemConfirmed', itemConfirmed)
    // console.log('scanned', scanned)

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

    const handleBottomSheetAnimated = useMemo((fromPos, toPos) => {
        console.log('takingPhoto', takingPhoto)
        if (takingPhoto) {
            return
        }
        // Discard scanned item after bottom sheet is closed
        if (!takingPhoto && toPos === -1) {
            setScanned(false);
            setItemConfirmed(false)
            console.log('Discard scanned item after bottom sheet is closed')
            return
        }
    }, [takingPhoto])
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
        console.log('TAKGINGNG takingPhoto')
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
        const itemName = 'Cheese'
        return (
            <View style={styles.bottomSheetContainer}>
                <View style={styles.minimizedBottomSheetContainer}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                            <TouchableOpacity
                                style={styles.bottomSheetImageContainer}>
                                <Image
                                    source={{ uri: image }}
                                    style={styles.bottomSheetImage} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 4 }}>
                            <View style={styles.topLeftContainer}>
                                <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                                <Text style={styles.bottomSheetBoldText}>{itemName}</Text>
                            </View>
                            <View style={styles.bottomRightContainer}>
                                <Button
                                    style={styles.bottomRightContainer}
                                    onPress={handleItemConfirm}
                                    title="Confirm" />
                            </View>
                        </View>

                    </View>
                </View>
            </View>)
    }

    const RenderBottomSheetWhenItemConfirmed = () => {
        return (
            <>
                <View style={styles.topCenteredContainer}>
                    <TouchableOpacity
                        style={styles.fullExpandedBottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: image }}
                            style={styles.fullExpandedBottomSheetImage} />
                    </TouchableOpacity>
                </View>
                <View style={styles.topLeftContainer}>
                    <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                    <Text style={styles.bottomSheetBoldText} >Item Name:</Text>
                    <TextInput
                        placeholder="Enter Item Name Here"
                        style={styles.bottomSheetBoldText}
                        value={itemName}
                        onChange={setItemName}
                    />
                    <Text style={styles.bottomSheetBoldText}>Date:</Text>
                    <RenderDatePicker />
                </View>

                <View style={styles.topCenteredContainer}>
                    <Button
                        onPress={handleItemConfirm}
                        title="Add to List" />
                </View>
            </>
        )
    }

    const cameraButtonStyle = { ...styles.camera, alignItems: takingPhoto ? 'center' : 'flex-end' }

    return (
        <>
            <StatusBar hidden={true} />
            <GestureHandlerRootView style={{ flex: 1 }}>


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
                        {itemConfirmed ? (<RenderBottomSheetWhenItemConfirmed />) :
                            scanned ? (<RenderBottomSheetWhenScanned />) : <><Button
                                onPress={() => bottomSheetRef.current.close()}
                                title="Cancel" /></>}
                    </BottomSheet>

                </View>
            </GestureHandlerRootView>
        </>
    );
}


