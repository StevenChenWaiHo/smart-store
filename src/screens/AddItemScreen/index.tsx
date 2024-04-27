
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, ToastAndroid, TextInput, Pressable, TouchableOpacity, Image, Keyboard, ImageStyle } from 'react-native';
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
import EditItemForm from '../../components/form/EditItemForm';
import dateNumberToString from '../../data/date/dateNumberToString';
import schedulePushNotification from '../../data/notification/schedulePushNotification';
import { Item, SavedItem } from '../../types/item';
import { DEFAULT_IMAGE } from '../../constants/image';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});


export default function AddItemScreen({ route }) {
    const db = openDatabase();

    const [hasPermission, requestPermission] = Camera.useCameraPermissions();
    const [itemStatus, setItemStatus] = useState({ editing: false, scanned: false }); // Combine two state to avoid duplicate triggers
    const [barcode, setBarcode] = useState(0);
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState('');
    const [remarks, setRemarks] = useState('')
    const [image, setImage] = useState();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [takingPhoto, setTakingPhoto] = useState(false);
    const [barcodeFound, setBarcodeFound] = useState({ status: false, from: '' })

    const focused = useIsFocused();
    
    const dateToInteger = (date) => {
        return Math.floor(date.getTime())
    }
    
    const emptyItem = {
        barcode: '',
        image: DEFAULT_IMAGE,
        date: Math.floor(new Date().getTime()), // INTEGER NUMBER
        itemName: '',
        quantity: 1,
        remarks: '',
    }
    
    const [item, setItem] = useState<Item>(emptyItem)

    const setItemHandler = (newData) => {
        setItem(prev => ({ ...prev, ...newData }))
    }

    // const item = {
    //     barcode: barcode.data,
    //     image,
    //     date: Math.floor(date.getTime()), // ios result in decimal number
    //     itemName,
    //     quantity: Number(quantity) || 1,
    //     remarks,
    // }

    // const resetItem = () => {
    //     setBarcodeFound({ status: false, from: '' })
    //     setBarcode(0)
    //     setItemName('');
    //     setQuantity(1);
    //     const newDate = new Date();
    //     setDate(newDate);
    //     setDateString(newDate.toDateString());
    //     setImage(defaultImage);
    //     setRemarks('')
    // }

    const resetItem = () => {
        setItem(emptyItem)
        setBarcodeFound({ status: false, from: '' })
    }

    const updatedScannedItemFromList = (item: SavedItem) => {
        setItemHandler({
            itemName: item?.itemName,
            quantity: item?.quantity,
            image: item?.image
        })
    }

    const addItemToList = async (itemData: Item) => {
        var notificationId: string | null = null
        if (itemData?.date) {
            try {
                notificationId = await schedulePushNotification(itemData) || null
            } catch (error) {
                alert(error)
            }
        }

        db.transaction(tx => {
            tx.executeSql('INSERT INTO list (itemName, date, quantity, image, notificationId, barcode, remarks) values (?, ?, ?, ?, ?, ?, ?)', [itemData.itemName, itemData.date, itemData.quantity, itemData.image, notificationId, itemData.barcode, itemData.remarks],
                (txObj, resultList) => {
                    ToastAndroid.show(`Added Item - ${itemData.itemName}`, ToastAndroid.SHORT);
                    setItemStatus({ editing: false, scanned: false })
                    resetItem();
                    console.log('Add to List', itemData)
                },
                (txObj, error) => { alert(error); return true})
        })
        if (!itemStatus.scanned) {
            return
        }
        if (barcodeFound.from === 'sql') {
            db.transaction(tx => {
                tx.executeSql('UPDATE barcodeMap SET itemName = (?), quantity = (?), image = (?) WHERE barcode = (?)', [itemData.itemName, itemData.quantity, itemData.image, itemData.barcode],
                    (txObj, resultList) => { },
                    (txObj, error) => {console.log(error); return true})
            })
        } else {
            db.transaction(tx => {
                tx.executeSql('INSERT INTO barcodeMap (barcode, itemName, quantity, image) values (?, ?, ?, ?)', [itemData.barcode, itemData.itemName, itemData.quantity, itemData.image],
                    (txObj, resultList) => { },
                    (txObj, error) => {console.log(error); return true})
            })
        }
    }


    // Camera
    const cameraRef = useRef<Camera>(null);

    const takePicture = async () => {
        if (!cameraRef.current) {
            alert('Camera is not ready')
            return 
        }
        if (!bottomSheetRef.current) {
            alert('Bottom s is not ready')
            return
        }
        const picture = await cameraRef.current.takePictureAsync();
        setItemHandler({ image: picture.uri });
        bottomSheetRef.current.expand();

        if (!itemStatus.editing) {
            // ERROR SHOULD NOT HAPPEN
            console.log('Item not confirmed when taking Photo')
            return
        }
    }

    const handleBarCodeScanned = (barcode) => {
        if (itemStatus.editing) {
            return;
        }
        setItemHandler({ barcode: barcode.data });
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM barcodeMap WHERE barcode = (?)', [barcode.data],
                (txObj, resultList) => {
                    setItemStatus({ editing: false, scanned: true })
                    if (resultList.rows.length === 1) {
                        setBarcodeFound({ status: true, from: 'sql' });
                        updatedScannedItemFromList(resultList.rows._array[0])
                    } else {
                        fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode.data}.json`)
                            .then((response) => response.json())
                            .then((json) => {
                                // Product Found
                                if (json.status === 1) {
                                    setBarcodeFound({ status: true, from: 'api' });
                                    updatedScannedItemFromList({
                                        itemName: json?.product?.product_name || 'Not Found',
                                        quantity: Number(json?.product?.quantity) || 1,
                                        image: json?.product?.image_url || DEFAULT_IMAGE,
                                        barcode: barcode.data // Not Used
                                    })
                                } else {
                                    setBarcodeFound({ status: false, from: '' });
                                }
                            }).catch((error) => { console.log(error); setBarcodeFound({ status: false, from: '' }); })
                    }
                },
                (txObj, error) => { console.log(error);  return true})
        })
    };

    useEffect(() => {
        if (!hasPermission) {
            Camera.requestCameraPermissionsAsync()
        }
    }, [hasPermission])

    // Date
    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const onChangeDate = ({ type }, selectedDate) => {
        if (type == "set") {
            const currentDate = selectedDate;
            if (Platform.OS === "android") {
                toggleDatePicker();
            }
            setItemHandler({ date: dateToInteger(currentDate) })
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
                        value={dateNumberToString(item?.date)}
                        editable={false}
                        onPressIn={toggleDatePicker} />
                </Pressable>
                {
                    showDatePicker &&
                    (<DateTimePicker
                        minimumDate={new Date()}
                        mode='date'
                        display={'calendar'}
                        value={new Date(item?.date)}
                        onChange={onChangeDate} />)
                }
            </>) :
            (Platform.OS === "ios" ? (
                <DateTimePicker
                    minimumDate={new Date()}
                    mode='date'
                    display='spinner'
                    value={new Date(item?.date)}
                    onChange={onChangeDate}
                    style={styles.datePickerIos} />) : <></>)
    }, [item?.date, showDatePicker])



    const onChangeQuantity = (number, type) => {
        setItemHandler({ quantity: number })
    }

    // Bottom Sheet
    const bottomSheetRef = useRef<BottomSheet>(null);

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

    // Force close bottom sheet when rendered
    const RenderEmptySheet = () => {
        return (
            <Button
                onPress={() => setItemStatus({ editing: false, scanned: false })}
                title="Cancel" />)
    }

    useEffect(() => {
        if (!bottomSheetRef.current) {
            return
        }
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

        // Discard scanned item after bottom sheet is closed
        if (!takingPhoto && !itemStatus.editing && itemStatus.scanned && toPos === -1) {
            setItemStatus({ editing: false, scanned: false })
            Keyboard.dismiss()
            return
        }
    }

    const RenderCounter = () => {
        return <Counter start={item?.quantity} onChange={onChangeQuantity} buttonStyle={{ borderWidth: 3 }} max={100} />
    }

    const RenderBottomSheetWhenScanned =
        barcodeFound.status ? (
            <View style={styles.barcodeKnownBottomSheetContainer}>
                <View style={{ ...styles.topCenteredContainer, flex: 2 }}>
                    <View style={styles.bottomSheetImageContainer}>
                        <Image
                            source={{ uri: item?.image || DEFAULT_IMAGE }}
                            style={styles.bottomSheetImage as ImageStyle} />
                    </View>
                </View>
                <View style={{ flexDirection: 'column', flex: 4 }}>
                    <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                        <Text style={styles.bottomSheetSmallText}>Code: {item?.barcode}</Text>
                        <Text numberOfLines={1} style={styles.bottomSheetBoldText}>{item?.itemName}</Text>
                        <Text style={styles.inputLabel}>Quantity:</Text>
                        <RenderCounter />
                        <Text style={styles.inputLabel}>Expiry Date:</Text>
                        <RenderDatePicker />
                    </View>
                    <View style={{ ...styles.bottomRightContainer, flex: 1, flexDirection: 'row' }}>
                        <View style={{ ...styles.buttonContainer, flex: 2 }}>
                            <Button
                                onPress={handleItemEdit}
                                title="Edit Details" />
                        </View>
                        <View style={{ ...styles.buttonContainer, flex: 2 }}>
                            <Button
                                onPress={() => addItemToList(item)}
                                title="Add to List" />
                        </View>
                    </View>
                </View>
            </View>)
            : (
                <View style={styles.barcodeUnknownBottomSheetContainer}>
                    <View style={{ flexDirection: 'column', flex: 4 }}>
                        <View style={{ ...styles.topLeftContainer, flex: 2 }}>
                            <Text style={styles.bottomSheetBoldText}>Code: {item?.barcode}</Text>
                            <Text style={styles.bottomSheetBoldText}>{item?.itemName || 'Not Found in Database'}</Text>
                        </View>
                        <View style={{ ...styles.bottomRightContainer, flex: 1 }}>
                            <Button
                                onPress={handleItemEdit}
                                title="Add Item" />
                        </View>
                    </View>
                </View>)

    // const RenderBottomSheetWhenEditing = (
    //     <View style={styles.inputSheetContainer}>

    //         {/* Item Name Input */}
    //         <View style={{ ...styles.topCenteredContainer, flex: 2, flexDirection: 'row' }}>
    //             <View style={{ ...styles.topCenteredContainer, flex: 3 }}>
    //                 <TouchableOpacity
    //                     style={styles.fullExpandedBottomSheetImageContainer}
    //                     onPress={handleChangePhotoButton}>
    //                     <Image
    //                         source={{ uri: item?.image }}
    //                         style={styles.bottomSheetImage} />
    //                 </TouchableOpacity>
    //             </View>
    //             <View style={{ ...styles.topLeftContainer, flex: 4 }}>
    //                 <Text style={styles.bottomSheetSmallText}>Code: {item?.barcode}</Text>
    //                 <Text style={styles.inputLabel} >Item Name:</Text>
    //                 <TextInput
    //                     value={item?.itemName}
    //                     placeholder="Enter Item Name Here"
    //                     style={styles.input}
    //                     clearButtonMode='while-editing'
    //                     enterKeyHint='done'
    //                     onChangeText={(val) => setItemHandler({itemName: val})}
    //                 />
    //             </View>
    //         </View>

    //         {/* Inputs */}
    //         <View style={{ ...styles.topLeftContainer, flex: 2 }}>
    //             <Text style={styles.inputLabel}>Expiry Date:</Text>
    //             <RenderDatePicker />

    //             <Text style={styles.inputLabel} >Quantity:</Text>
    //             <Counter start={item?.quantity} onChange={onChangeQuantity} max={100} />

    //             <Text style={styles.inputLabel} >Remarks:</Text>
    //             <TextInput
    //                 editable
    //                 multiline
    //                 numberOfLines={5}
    //                 maxLength={300}
    //                 style={styles.mutilineInput}
    //                 clearButtonMode='while-editing'
    //                 enterKeyHint='done'
    //                 onChangeText={(val) => setItemHandler({remarks: val})}
    //             />
    //         </View>

    //         {/* Buttons */}
    //         <View style={{ ...styles.topCenteredContainer, flex: 1 }}>
    //             <View style={{ flexDirection: 'row' }}>
    //                 <View style={{ ...styles.buttonContainer, flex: 2 }}>
    //                     <Button
    //                         onPress={() => setItemStatus({ editing: false, scanned: false })}
    //                         title="Cancel"
    //                         style={styles.button} />
    //                 </View>
    //                 <View style={{ ...styles.buttonContainer, flex: 2 }}>
    //                     <Button
    //                         onPress={addItemToList}
    //                         title="Add To List"
    //                         style={styles.button} />
    //                 </View>
    //             </View>

    //         </View>
    //     </View>
    // )

    // Notification
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const notificationListener = useRef<Notifications.Subscription | undefined>();
    const responseListener = useRef<Notifications.Subscription | undefined>();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            if (!notificationListener.current || !responseListener.current) {
                return
            }
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    async function registerForPushNotificationsAsync() {
        let token: string = '';

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
        <>

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
                    onChange={handleBottomSheetChanged}
                    animationConfigs={animationConfigs}
                    containerStyle={styles.bottomSheetContainer}>
                    {itemStatus.editing ? (
                        <EditItemForm
                            itemInEdit={item}
                            handleCancel={() => setItemStatus({ editing: false, scanned: false })}
                            rightButtonText='Add To List'
                            handleSubmit={addItemToList}
                            handleChangePhotoButton={() => setTakingPhoto(true)} />
                    ) :
                        itemStatus.scanned ? (RenderBottomSheetWhenScanned)
                            : <><RenderEmptySheet /></>}
                </BottomSheet>

            </View>
        </>
    );
}