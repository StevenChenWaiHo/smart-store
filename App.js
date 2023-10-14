import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateString, setDateString] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // refs
  const bottomSheetRef = useRef(null);

  const handleOpenPress = () => bottomSheetRef.current.open()

  // variables
  const snapPoints = useMemo(() => ['25%', '50%'], []);

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

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, [hasPermission]);

  const handleBarCodeScanned = (barcode) => {
    setScanned(true);
    setBarcode(barcode);
    // alert(`Bar code with type ${barcode.type} and data ${barcode.data} has been scanned!`);
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
        {/* <StatusBar style="auto" /> */}
      </View>
      <Button
        style={StyleSheet.absoluteFillObject}
        title={'Add Items'}
        onPress={() => bottomSheetRef.current.expand()} />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        style={{...styles.shadow}}
        snapPoints={snapPoints}
        enableContentPanningGesture={true}
        enablePanDownToClose={true}
      >
        <View style={styles.modalContainer}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ ...styles.topCenteredContainer, flex: 5 }}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={Platform.OS === 'android' ? { height: '80%', width: '80%' } :
                  Platform.OS === 'ios' ? { height: '80%', width: '80%' } : {}}
              />
            </View>
            <View style={{ ...styles.topLeftContainer, flex: 4 }}>
              {scanned &&
                <Button
                  style={StyleSheet.absoluteFillObject}
                  title={'Tap to Scan Again'}
                  onPress={() => setScanned(false)} />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeftContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  topCenteredContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  datePicker: {
    height: 120,
    marginTop: -10,
    margin: '2%',
  },
  modalContainer: {
    height: '100%',
    width: '100%',
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});
