
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image, Keyboard } from 'react-native';
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
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Counter from 'react-native-counters';
import openDatabase from '../../data/SQLite/openDatabase'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function AddItemScreen({ route }) {
    const db = openDatabase();
    const defaultImage = 'https://cdn4.iconfinder.com/data/icons/picture-sharing-sites/32/No_Image-1024.png';

    const [hasPermission, requestPermission] = Camera.useCameraPermissions();
    const [itemStatus, setItemStatus] = useState({ editing: false, scanned: false }); // Combine two state to avoid duplicate triggers
    const [barcode, setBarcode] = useState(0);
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [remarks, setRemarks] = useState('')
    const [image, setImage] = useState(defaultImage);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [takingPhoto, setTakingPhoto] = useState(false);
    const [barcodeFound, setBarcodeFound] = useState({ status: false, from: '' })
    const focused = useIsFocused();

    const item = {
        barcode: barcode.data,
        image,
        date: Math.floor(date.getTime()), // ios result in decimal number
        itemName,
        quantity: Number(quantity) || 1,
        remarks,
    }

    const resetItem = () => {
        setBarcodeFound({ status: false, from: '' })
        setBarcode(0)
        setItemName('');
        setQuantity(1);
        const newDate = new Date();
        setDate(newDate);
        setDateString(newDate.toDateString());
        setImage(defaultImage);
        setRemarks('')
    }

    const updatedScannedItem = (item) => {
        setItemName(item?.itemName);
        setQuantity(item?.quantity);
        setImage(item?.image);
    }

    const addItemToList = async (event) => {
        if (item.itemName === '') {
            alert('Item Name cannot be empty')
            return;
        }

        if (!item.quantity || item.quantity < 0) {
            alert('Quantity cannot be empty or less than 0')
            return;
        }
        const notificationId = await schedulePushNotification(item)
        db.transaction(tx => {
            tx.executeSql('INSERT INTO list (itemName, date, quantity, image, notificationId, barcode, remarks) values (?, ?, ?, ?, ?, ?, ?)', [item.itemName, item.date, item.quantity, item.image, notificationId, item.barcode, item.remarks],
                (txObj, resultList) => {
                    alert(`Added Item - ${item.itemName}`)
                    setItemStatus({ editing: false, scanned: false })
                    resetItem();
                    console.log('Add to List', resultList.rows._array)
                },
                (txObj, error) => alert(error))
        })
        if (!itemStatus.scanned || !barcodeFound.status) {
            return
        }
        if (barcodeFound.from === 'sql') {
            db.transaction(tx => {
                tx.executeSql('UPDATE barcodeMap SET itemName = (?), quantity = (?), image = (?) WHERE barcode = (?)', [item.itemName, item.quantity, item.image, item.barcode],
                    (txObj, resultList) => { },
                    (txObj, error) => console.log(error))
            })
        } else {
            db.transaction(tx => {
                tx.executeSql('INSERT INTO barcodeMap (barcode, itemName, quantity, image) values (?, ?, ?, ?)', [item.barcode, item.itemName, item.quantity, item.image],
                    (txObj, resultList) => { },
                    (txObj, error) => console.log(error))
            })
        }
    }


    // Camera
    const cameraRef = useRef(null);

    const takePicture = async () => {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
        bottomSheetRef.current.expand();

        if (!itemStatus.editing) {
            // ERROR SHOULD NOT HAPPEN
            console.log('Item not confirmed when taking Photo')
            return
        }
    }

    const handleBarCodeScanned = (barcode) => {
        console.log('hi')
        if (itemStatus.editing) {
            return;
        }
        setBarcode(barcode);
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM barcodeMap WHERE barcode = (?)', [barcode.data],
                (txObj, resultList) => {
                    setItemStatus({ editing: false, scanned: true })
                    if (resultList.rows.length === 1) {
                        setBarcodeFound({ status: true, from: 'sql' });
                        updatedScannedItem(resultList.rows._array[0])
                    } else {
                        fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode.data}.json`)
                            .then((response) => response.json())
                            .then((json) => {
                                // Product Found
                                if (json.status === 1) {
                                    setBarcodeFound({ status: true, from: 'api' });
                                    updatedScannedItem({
                                        itemName: json?.product?.product_name || 'Not Found',
                                        quantity: Number(json?.product?.quantity) || 1,
                                        image: json?.product?.image_url || defaultImage,
                                    })
                                } else {
                                    setBarcodeFound({ status: false, from: '' });
                                }
                            }).catch((error) => { console.log(error); setBarcodeFound({ status: false, from: '' }); })
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
    }

    // Date
    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate;
            if (Platform.OS === "android") {
                toggleDatePicker();
                setDateString(currentDate.toDateString())
            }
            setDate(selectedDate)
        } else {
            toggleDatePicker()
        }
    }

    const RenderDatePicker = useCallback(() => {
        return Platform.OS === 'android' ? (
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
            </>) :
            (Platform.OS === 'android' ? (
                <DateTimePicker
                    mode='date'
                    display='spinner'
                    value={date}
                    onChange={onChangeDate}
                    style={styles.datePickerIos} />) : <></>)
    }, [date, showDatePicker])



    const onChangeQuantity = (number, type) => {
        setQuantity(number)
    }

    // Bottom Sheet
    const bottomSheetRef = useRef(null);

    const handleItemEdit = () => {
        setItemStatus({ editing: true, scanned: true })
    }

    const handleNoCodeAddItem = () => {
        setItemStatus({ editing: true, scanned: false })
    }

    const snapPoints = useMemo(() => itemStatus.editing ? ['100%'] : itemStatus.scanned ? (barcodeFound.status ? ['40%%', '100%'] : ['25%%', '100%']) : ['100%'], [itemStatus.scanned, itemStatus.editing, barcodeFound.status]);
    const animationConfigs = useBottomSheetSpringConfigs({
        damping: 30,
        overshootClamping: true,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
        stiffness: 500,
    });

    useEffect(() => {
        if (takingPhoto) {
            bottomSheetRef.current.close();
            return
        }
        // Bottom sheet should be close
        if (!itemStatus.scanned && !itemStatus.editing) {
            resetItem()
            bottomSheetRef.current.close();
            return
        }
        // Bottom sheet should be fully expanded
        if (itemStatus.editing) {
            bottomSheetRef.current.expand();
            return
        }
        // Bottom sheet should be half expanded
        if (itemStatus.scanned) {
            bottomSheetRef.current.snapToIndex(0)
            return
        }
    }, [itemStatus, takingPhoto])

    const handleBottomSheetChanged = (toPos) => {
        // Finish taking Photo
        if (takingPhoto && toPos === 0) {
            setTakingPhoto(false);
            return
        }
        // Item Confirmed when swipe up after scanned
        if (!itemStatus.editing && itemStatus.scanned && toPos === 1) {
            setItemStatus({ editing: true, scanned: true })
            return
        }

    }

    const handleBottomSheetAnimated = (fromPos, toPos) => {
        if (takingPhoto) {
            return
        }
        // Discard scanned item after bottom sheet is closed
        if (!takingPhoto && !itemStatus.editing && itemStatus.scanned && toPos === -1) {
            setItemStatus({ editing: false, scanned: false })
            Keyboard.dismiss()
            return
        }
    }


    const RenderBottomSheetWhenScanned =
        barcodeFound.status ? (
            <View style={styles.barcodeKnownBottomSheetContainer}>
                <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                    <View style={styles.bottomSheetImageContainer}>
                        <Image
                            source={{ uri: image }}
                            style={styles.bottomSheetImage} />
                    </View>
                </View>
                <View style={{ flexDirection: 'column', flex: 4 }}>
                    <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                        <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                        <Text numberOfLines={1} style={styles.bottomSheetBoldText}>{item.itemName}</Text>
                        <Text style={styles.inputLabel}>Quantity:</Text>
                        <Counter start={quantity} onChange={onChangeQuantity} />
                        <Text style={styles.inputLabel}>Date:</Text>
                        <RenderDatePicker />
                    </View>
                    <View style={{ ...styles.bottomRightContainer, flex: 1, flexDirection: 'row' }}>
                        <View style={{ ...styles.buttonContainer, flex: 2 }}>
                            <Button
                                onPress={handleItemEdit}
                                style={styles.button}
                                title="Edit Details" />
                        </View>
                        <View style={{ ...styles.buttonContainer, flex: 2 }}>
                            <Button
                                onPress={addItemToList}
                                style={styles.button}
                                title="Add to List" />
                        </View>
                    </View>
                </View>
            </View>)
            : (
                <View style={styles.barcodeUnknownBottomSheetContainer}>
                    <View style={{ flexDirection: 'column', flex: 4 }}>
                        <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                            <Text style={styles.bottomSheetBoldText}>Code: {barcode.data}</Text>
                            <Text style={styles.bottomSheetBoldText}>{itemName || 'Not Found in Database'}</Text>
                        </View>
                        <View style={{ ...styles.bottomRightContainer, flex: 1 }}>
                            <Button
                                onPress={handleItemEdit}
                                style={styles.button}
                                title="Add Item" />
                        </View>
                    </View>
                </View>)

    const RenderBottomSheetWhenEditing = (
        <View style={styles.inputSheetContainer}>

            {/* Item Name Input */}
            <View style={{ ...styles.topCenteredContainer, flex: 2, flexDirection: 'row' }}>
                <View style={{ ...styles.topCenteredContainer, flex: 3 }}>
                    <TouchableOpacity
                        style={styles.fullExpandedBottomSheetImageContainer}
                        onPress={handleChangePhotoButton}>
                        <Image
                            source={{ uri: image }}
                            style={styles.bottomSheetImage} />
                    </TouchableOpacity>
                </View>
                <View style={{ ...styles.topLeftContainer, flex: 4 }}>
                    <Text style={styles.bottomSheetSmallText}>Code: {barcode.data}</Text>
                    <Text style={styles.inputLabel} >Item Name:</Text>
                    <TextInput
                        value={item.itemName}
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
                <RenderDatePicker />

                <Text style={styles.inputLabel} >Quantity:</Text>
                <Counter start={quantity} onChange={onChangeQuantity} />

                <Text style={styles.inputLabel} >Remarks:</Text>
                <TextInput
                    editable
                    multiline
                    numberOfLines={5}
                    maxLength={300}
                    style={styles.mutilineInput}
                    clearButtonMode='while-editing'
                    enterKeyHint='done'
                    onChangeText={(val) => setRemarks(val)}
                />
            </View>

            {/* Buttons */}
            <View style={{ ...styles.topCenteredContainer, flex: 1 }}>
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

    // Notification
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    async function schedulePushNotification(item) {
        const trigger = new Date(item?.date);
        trigger.setHours(8)
        trigger.setMinutes(0)
        trigger.setSeconds(0)

        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "Your Item is Expiring 📬",
                body: `${item?.itemName} is expiring on ${new Date(item?.date).toDateString()}`,
            },
            trigger,
        });
    }

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const result = await Notifications.requestPermissionsAsync();
                finalStatus = result.status;

            }
            if (finalStatus !== 'granted') {
                alert('Please allow notification. You can grant the app notification access in app settings');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            alert('Must use physical device for Push Notifications');
        }

        return token;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>

            <StatusBar hidden={false} />

            <View style={styles.container}>
                {focused &&
                    <Camera
                        style={{ ...styles.camera, alignItems: takingPhoto ? 'center' : 'flex-end' }} // Camera Button Postion change when taking photo
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


                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={!itemStatus.editing}
                    onAnimate={handleBottomSheetAnimated}
                    onChange={handleBottomSheetChanged}
                    animationConfigs={animationConfigs}>
                    <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContainer}>
                        {itemStatus.editing ? (RenderBottomSheetWhenEditing) :
                            itemStatus.scanned ? (RenderBottomSheetWhenScanned)
                                : <><Button
                                    onPress={() => setItemStatus({ editing: false, scanned: false })}
                                    title="Cancel" /></>}
                    </BottomSheetScrollView>
                </BottomSheet>

            </View>
        </GestureHandlerRootView>
    );
}


