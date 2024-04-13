import { Text, Image, ActivityIndicator, FlatList, RefreshControl, View, TouchableOpacity, Platform } from "react-native";
import { Header, ListItem, Icon, Button, SearchBar } from '@rneui/themed';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useReducer, useState, useRef } from "react";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../styles/global/globalStyle";
import * as SQLite from 'expo-sqlite'
import { useIsFocused } from "@react-navigation/native";
import { cancelScheduledNotificationAsync, dismissAllNotificationsAsync } from "expo-notifications";
import openDatabase from "../../data/SQLite/openDatabase";
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import EditItemForm from '../../components/EditItemForm';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import updateItem from "../../data/SQLite/item/update/updateItem";
import dateNumberToString from "../../data/date/dateNumberToString";
import pickImageFromLibrary from "../../data/image/utils/pickImageFromPhotoLibrary";
import { useActionSheet } from "@expo/react-native-action-sheet";
import getImageFromCamera from '../../data/image/utils/getImageFromCamera'
import { Camera } from "expo-camera";
import dateDifferenceInDays from "../../data/date/dateDifferenceInDays";

export default function ItemListScreen({ route }) {
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
  const filteredList = list.filter((item) => item?.itemName.includes(searchQuery))

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
      tx.executeSql('SELECT * FROM list ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date', null,
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
      date: item?.date || new Date(),
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

  const handleItemListLeftButtonPress = (i, j) => {
    editItem(i, j);
  }

  const editItem = (i, j) => {
    const tempItem = list[i].dates[j]
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM list WHERE id = (?)', [tempItem.id],
        (txObj, resultList) => {
          bottomSheetRef.current.expand()
          console.log(resultList.rows._array[0])
          setItemInEdit(sqlDataToState({ ...resultList.rows._array[0] }))
        },
        (txObj, error) => console.log(error))
    })
  }

  const handleSaveItem = () => {
    updateItem({ db, item: itemInEdit, skipUpdateQuantityInBarcodeMap: true })
    bottomSheetRef.current.close()
    updateListFromDatabase()
  }


  const useOneItem = (i, j) => {
    const tempItem = list[i].dates[j]
    const newQuantity = Math.max(tempItem.quantity - 1, 0)
    tempItem.quantity = newQuantity;
    db.transaction(tx => {
      tx.executeSql('UPDATE list SET quantity = (?) WHERE id = (?)', [newQuantity, tempItem.id])
    })
    updateListFromDatabase()
  }

  const deleteItem = (i, j) => {
    const tempItem = list[i].dates[j]
    const tempItemId = tempItem.id
    list[i].dates.splice(j, 1)
    if (list[i].dates.length <= 0) {
      list.splice(i, 1)
    }
    cancelScheduledNotificationAsync(tempItem.notificationId)
    db.transaction(tx => {
      tx.executeSql('DELETE FROM list WHERE id = (?)', [tempItemId])
    })
    forceUpdate(1)
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

  const RenderExpiryDateLabel = ({ expiryDate }) => {
    if (!expiryDate) {
      return (
        <Text style={{ ...styles.labelWithBackground, backgroundColor: 'lightgrey', color: 'white', fontWeight: 'bold' }}>No Expiry Date</Text>
      )
    }

    const expiryDateObject = new Date(expiryDate)

    const difference = dateDifferenceInDays(expiryDateObject, new Date())
    const labelString =
      difference < 0 ? 'Expired' :
        difference === 0 ? 'Expiring Today' :
          difference === 1 ? `Expiring Tomorrow` : `Expiring in ${difference} days`

    return (
      <Text style={{ ...styles.labelWithBackground, backgroundColor: getExpiryDateLabelColor(expiryDateObject), color: 'white', fontWeight: 'bold' }}>{labelString}</Text>
    )
  }

  const [expandedItemId, setExpandedItemId] = useState(-1);

  const ItemView = ({ item, index: i }) => {
    return (
      item.dates.length > 1 ?
        // Multiple Dates
        <ListItem.Accordion
          topDivider
          bottomDivider
          key={i}
          content={
            <>
              <Image
                source={{ uri: item?.dates?.[0]?.image }}
                style={styles.itemListImage} />
              <ListItem.Content style={styles.listItemContent}>
                <RenderExpiryDateLabel expiryDate={item?.dates?.[0].date} />
                <ListItem.Title>
                  <Text style={styles.bottomSheetBoldText}>{item?.itemName}</Text>
                </ListItem.Title>
                <ListItem.Subtitle>
                  <View>
                    {item?.dates?.[0].date ? <Text >{dateNumberToString(item?.dates?.[0].date)}</Text> : <></>}
                    {/* Sum of quantity of all items */}
                    <Text>Quantity : {item?.dates?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}</Text>
                  </View>
                </ListItem.Subtitle>
              </ListItem.Content>
            </>

          }
          isExpanded={expandedItemId === i}
          onPress={() => expandedItemId !== i ? setExpandedItemId(i) : setExpandedItemId(-1)}
        >
          <View >
            {item.dates.map((date, j) => (
              <ListItem.Swipeable
                topDivider
                bottomDivider
                key={j}
                leftContent={(reset) => (
                  <Button
                    title="Edit"
                    onPress={() => { handleItemListLeftButtonPress(i, j); reset() }}
                    icon={{ name: 'edit', color: 'white' }}
                    buttonStyle={{ minHeight: '100%' }}
                  />
                )}
                rightContent={(reset) => (
                  <Button
                    title="Delete"
                    onPress={() => { deleteItem(i, j); reset() }}
                    icon={{ name: 'delete', color: 'white' }}
                    buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
                  />
                )}
              >
                <View style={{ ...styles.accordionListContainer, flexDirection: 'row' }}>
                  <Image
                    source={{ uri: date.image }}
                    style={styles.itemListImage} />
                  <ListItem.Content style={styles.listItemContent}>
                    <RenderExpiryDateLabel expiryDate={date.date} />
                    {date.date ?
                      <ListItem.Title>
                        <Text style={styles.bottomSheetText}>{dateNumberToString(date.date)}</Text>
                      </ListItem.Title> : <></>}
                    <ListItem.Subtitle>
                      Quantity: {date.quantity}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                </View>

              </ListItem.Swipeable>))}
          </View>

        </ListItem.Accordion>
        :
        // Only one Date
        <ListItem.Swipeable
          topDivider
          bottomDivider
          leftContent={(reset) => (
            <Button
              title="Edit"
              onPress={() => { handleItemListLeftButtonPress(i, 0); reset() }}
              icon={{ name: 'edit', color: 'white' }}
              buttonStyle={{ minHeight: '100%' }}
            />
          )}
          rightContent={(reset) => (
            <Button
              title="Delete"
              onPress={() => { deleteItem(i, 0); reset() }}
              icon={{ name: 'delete', color: 'white' }}
              buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
            />
          )}
        >
          <>
            <Image
              source={{ uri: item?.dates?.[0].image }}
              style={styles.itemListImage} />
            <ListItem.Content style={styles.listItemContent}>
              <RenderExpiryDateLabel expiryDate={item?.dates?.[0].date} />
              <ListItem.Title>
                <Text style={styles.bottomSheetBoldText}>{item?.itemName}</Text>
              </ListItem.Title>
              <ListItem.Subtitle>
                <View>
                  {item?.dates?.[0].date ? <Text>{dateNumberToString(item?.dates?.[0].date)}</Text> : <></>}
                  <Text>Quantity : {item?.dates?.[0].quantity}</Text>
                </View>

              </ListItem.Subtitle>
            </ListItem.Content>
          </>

        </ListItem.Swipeable>
    );
  };

  const ItemSeparatorView = () => {
    return (
      // Flat List Item Separator
      <View
        style={{
          height: 0.5,
          width: '100%',
          backgroundColor: '#C8C8C8',
        }}
      />
    );
  };

  const bottomSheetRef = useRef(null);

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar hidden={false} />

        <SearchBar
          placeholder="Type Here..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          platform={Platform.OS}
        />

        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => index.toString()}
          includeseparatorComponent={ItemSeparatorView}
          renderItem={ItemView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />}
        />

        <BottomSheet
          ref={bottomSheetRef}
          enablePanDownToClose
          index={-1}
          snapPoints={['100%']}>
          <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContainer}>
            <EditItemForm
              itemInEdit={itemInEdit}
              setItemInEdit={setItemInEdit}
              handleCancel={() => bottomSheetRef.current.close()}
              rightButtonText='Save'
              handleSubmit={handleSaveItem}
              handleChangePhotoButton={handleChangePhotoButton} />
          </BottomSheetScrollView>
        </BottomSheet>

      </GestureHandlerRootView>


    </>

  );
}