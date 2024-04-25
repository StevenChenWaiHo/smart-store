import { Text, Image, ActivityIndicator, FlatList, RefreshControl, View, TouchableOpacity, Platform } from "react-native";
import { Header, ListItem, Icon, Button, SearchBar } from '@rneui/themed';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useReducer, useState, useRef } from "react";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../../styles/global/globalStyle";
import * as SQLite from 'expo-sqlite'
import { useIsFocused } from "@react-navigation/native";
import { cancelScheduledNotificationAsync, dismissAllNotificationsAsync } from "expo-notifications";
import openDatabase from "../../../data/SQLite/openDatabase";
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import EditItemForm from '../../form/EditItemForm';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import updateItem from "../../../data/SQLite/item/update/updateItem";
import dateNumberToString from "../../../data/date/dateNumberToString";
import pickImageFromLibrary from "../../../data/image/utils/pickImageFromPhotoLibrary";
import { useActionSheet } from "@expo/react-native-action-sheet";
import getImageFromCamera from '../../../data/image/utils/getImageFromCamera'
import { Camera } from "expo-camera";
import dateDifferenceInDays from "../../../data/date/dateDifferenceInDays";
import ItemListView from "../../listView/ItemListView";

export default function ItemListScreen({
  sqlStatement = "SELECT * FROM list ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date",
  sqlArguments = null
}) {
  const db = openDatabase();
  var focus = useIsFocused();

  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (firstLoad || focus) {
      updateListFromDatabase()
      setFirstLoad(false);
    }
  }, [firstLoad, focus])

  const [list, setList] = useState([])
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [itemInEdit, setItemInEdit] = useState({})

  const [searchQuery, setSearchQuery] = useState("")
  const filteredList = list.filter((item) => item?.itemName.toLowerCase().includes(searchQuery.toLowerCase()))

  const updateList = (databaseList) => {
    setRefreshing(true)
    const itemToIndex = new Map();
    const newList = [];
    databaseList.forEach((entry, index) => {
      const item = {
        id: entry.id,
        date: entry.date,
        quantity: entry.quantity,
        image: entry.image,
        notificationId: entry.notificationId
      }
      if (itemToIndex.has(entry.itemName)) {
        newList[itemToIndex.get(entry.itemName)].dates.push(item);
      } else {
        const pushedToIndex = newList.push(
          {
            itemName: entry.itemName,
            dates: [item]
          }) - 1
        itemToIndex.set(entry.itemName, pushedToIndex)
      }
    });
    setList(newList);
    setRefreshing(false)
  }

  const updateListFromDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(sqlStatement, sqlArguments,
        (txObj, resultList) => updateList(resultList.rows._array),
        (txObj, error) => console.log(error))
    })
  }

  const sqlDataToState = (item) => {
    return {
      id: item?.id,
      itemName: item?.itemName || '',
      quantity: item?.quantity || 1,
      image: item?.image || '',
      barcode: item?.barcode || '',
      date: item?.date,
      remarks: item?.remarks || '',
    }
  }


  // Change Image

  const [hasPermission, requestPermission] = Camera.useCameraPermissions();
  const { showActionSheetWithOptions } = useActionSheet();

  const getImageFromCameraOrPhotoLibrary = async () => {
    if (!hasPermission) {
      alert('Camera Permission Denied')
      return
    }

    const options = ['Camera', 'Choose Photo From Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions({
      options,
      cancelButtonIndex,
    }, async (selectedIndex) => {
      var image = null
      switch (selectedIndex) {
        case 0:
          image = await getImageFromCamera()
          break;

        case 1:
          image = await pickImageFromLibrary()
          break;

        case cancelButtonIndex:
        // Canceled
      }
      if (image) {
        setItemInEdit(prev => ({ ...prev, image }))
      }
    });
  }

  const handleChangePhotoButton = async () => {
    await getImageFromCameraOrPhotoLibrary()
  }

  const onEditButtonPress = (i, j) => {
    editItem(i, j);
  }

  const editItem = (i, j) => {
    const tempItem = filteredList[i].dates[j]
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM list WHERE id = (?)', [tempItem.id],
        (txObj, resultList) => {
          bottomSheetRef.current.expand()
          setItemInEdit(sqlDataToState({ ...resultList.rows._array[0] }))
        },
        (txObj, error) => console.log(error))
    })
  }

  const handleSaveItem = (item) => {
    console.log("Save ", item)
    updateItem({ db, item: item, skipUpdateQuantityInBarcodeMap: true })
    bottomSheetRef.current.close()
    updateListFromDatabase()
  }

  const deleteItem = (i, j) => {
    const tempItem = filteredList[i].dates[j]
    const tempItemId = tempItem.id
    cancelScheduledNotificationAsync(tempItem.notificationId)
    db.transaction(tx => {
      tx.executeSql('DELETE FROM list WHERE id = (?)', [tempItemId])
    })
    updateListFromDatabase()
    // forceUpdate(1)
  }

  const onRefresh = () => {
    updateListFromDatabase()
  }

  const getExpiryDateLabelColor = (expiryDate) => {
    const difference = dateDifferenceInDays(expiryDate, new Date())
    return (
      difference < 0 ? 'black' :
        difference === 0 ? 'red' :
          difference <= 5 ? `orange` : 'green')
  }

  const bottomSheetRef = useRef(null);

  return (
    <>
      <StatusBar hidden={false} />

      <SearchBar
        placeholder="Type Here..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        platform={Platform.OS}
      />

      <ItemListView
        data={filteredList}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLeftButtonPress={onEditButtonPress}
        onRightButtonPress={deleteItem}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['100%']}
        contentContainerStyle={styles.bottomSheetContainer}>
        <EditItemForm
          itemInEdit={itemInEdit}
          setItemInEdit={setItemInEdit}
          handleCancel={() => bottomSheetRef.current.close()}
          rightButtonText='Save'
          handleSubmit={handleSaveItem}
          handleChangePhotoButton={handleChangePhotoButton} />
      </BottomSheet>



    </>

  );
}