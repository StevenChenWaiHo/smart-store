import {
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Header, ListItem, Icon, Button, SearchBar } from "@rneui/themed";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useReducer, useState, useRef } from "react";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../../styles/global/globalStyle";
import * as SQLite from "expo-sqlite";
import { useIsFocused } from "@react-navigation/native";
import {
  cancelScheduledNotificationAsync,
  dismissAllNotificationsAsync,
} from "expo-notifications";
import openDatabase from "../../../data/SQLite/openDatabase";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import EditItemForm, { ItemInEdit } from "../../form/EditItemForm";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import updateItem from "../../../data/item/update/updateItem";
import dateNumberToString from "../../../data/date/dateNumberToString";
import pickImageFromLibrary from "../../../data/image/utils/pickImageFromPhotoLibrary";
import { useActionSheet } from "@expo/react-native-action-sheet";
import getImageFromCamera from "../../../data/image/utils/getImageFromCamera";
import { Camera } from "expo-camera";
import dateDifferenceInDays from "../../../data/date/dateDifferenceInDays";
import ItemListView, { ListViewEntry } from "../../listView/ItemListView";
import { DEFAULT_IMAGE } from "../../../constants/image";
import { Item, ItemInDatabase } from "../../../types/item";
import { DEFAULT_ITEM, UNNAMED_ITEM_NAME } from "../../../constants/item";

export default function ItemListScreen({
  sqlStatement = "SELECT * FROM list ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date",
  sqlArguments = [],
}) {
  const db = openDatabase();
  var focus = useIsFocused();

  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (firstLoad || focus) {
      updateListFromDatabase();
      setFirstLoad(false);
    }
  }, [firstLoad, focus]);

  const [list, setList] = useState<ListViewEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [itemInEdit, setItemInEdit] = useState<Item>(DEFAULT_ITEM);

  const [searchQuery, setSearchQuery] = useState("");
  const filteredList = list.filter((item) =>
    (item?.itemName || UNNAMED_ITEM_NAME)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const updateList = (databaseList: ItemInDatabase[]) => {
    setRefreshing(true);
    const itemToIndex = new Map();
    const newList: ListViewEntry[] = [];
    databaseList.forEach((entry: ItemInDatabase, index: number) => {
      const item: ItemInDatabase = {
        id: entry.id,
        date: entry.date,
        quantity: entry.quantity || 1,
        image: entry.image || DEFAULT_IMAGE,
        notificationId: entry.notificationId,
        itemName: entry.itemName || UNNAMED_ITEM_NAME,
        barcode: entry.barcode || "",
        remarks: entry.remarks || "",
      };
      if (itemToIndex.has(item.itemName)) {
        newList[itemToIndex.get(item.itemName)].dates.push(item);
      } else {
        const pushedToIndex =
          newList.push({
            itemName: item.itemName,
            dates: [item],
          }) - 1;
        itemToIndex.set(item.itemName, pushedToIndex);
      }
    });
    setList(newList);
    setRefreshing(false);
  };

  const updateListFromDatabase = () => {
    db.transaction((tx) => {
      tx.executeSql(
        sqlStatement,
        sqlArguments,
        (txObj, resultList) => updateList(resultList.rows._array),
        (txObj, error) => {
          console.log(error);
          return true;
        }
      );
    });
  };

  const sqlDataToState = (item: ItemInDatabase) : ItemInEdit => {
    return {
      id: item?.id,
      itemName: item?.itemName || UNNAMED_ITEM_NAME,
      quantity: item?.quantity || 1,
      image: item?.image || "",
      barcode: item?.barcode || "",
      date: item?.date,
      remarks: item?.remarks || "",
    };
  };

  // Change Image

  const [hasPermission, requestPermission] = Camera.useCameraPermissions();
  const { showActionSheetWithOptions } = useActionSheet();

  const getImageFromCameraOrPhotoLibrary = async () => {
    if (!hasPermission) {
      alert("Camera Permission Denied");
      return;
    }

    const options = ["Camera", "Choose Photo From Gallery", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (selectedIndex: number | undefined) => {
        var image: string | null = null;
        switch (selectedIndex) {
          case 0:
            image = await getImageFromCamera();
            break;

          case 1:
            image = await pickImageFromLibrary();
            break;

          case cancelButtonIndex:
          // Canceled
        }
        setItemInEdit((prev) => (image ? { ...prev, image } : { ...prev }));
      }
    );
  };

  const handleChangePhotoButton = async () => {
    await getImageFromCameraOrPhotoLibrary();
  };

  const onEditButtonPress = (i: number, j: number) => {
    editItem(i, j);
  };

  const editItem = (i: number, j: number) => {
    const tempItem = filteredList[i].dates[j];
    if (!bottomSheetRef.current) {
      alert("ERROR: Bottom Sheet not ready");
      return;
    }
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM list WHERE id = (?)",
        [tempItem.id],
        (txObj, resultList) => {
          setItemInEdit(sqlDataToState({ ...resultList.rows._array[0] }));
          if (!bottomSheetRef.current) {
            alert("ERROR: Bottom Sheet not ready");
            return;
          }
          bottomSheetRef.current.expand();
        },
        (txObj, error) => {
          console.log(error);
          return true;
        }
      );
    });
  };

  const handleSaveItem = (item: Item) => {
    console.log("Save ", item);
    updateItem({ db, item: item, skipUpdateQuantityInBarcodeMap: true });
    updateListFromDatabase();
    if (!bottomSheetRef.current) {
      alert("ERROR: Bottom Sheet not ready");
      return;
    }
    bottomSheetRef.current.close();
  };

  const deleteItem = (i: number, j: number) => {
    const deleteItem = filteredList[i].dates[j];
    if (deleteItem.notificationId) {
      cancelScheduledNotificationAsync(deleteItem.notificationId);
    }
    db.transaction((tx) => {
      tx.executeSql("DELETE FROM list WHERE id = (?)", [deleteItem.id]);
    });
    updateListFromDatabase();
  };

  const onRefresh = () => {
    updateListFromDatabase();
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <>
      <StatusBar hidden={false} />

      <SearchBar
        placeholder="Type Here..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        platform={
          Platform.OS === "android" || Platform.OS === "ios"
            ? Platform.OS
            : "default"
        }
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
        snapPoints={["100%"]}
        containerStyle={styles.bottomSheetContainer}
      >
        <EditItemForm
          itemInEdit={itemInEdit}
          setItemInEdit={setItemInEdit}
          handleCancel={() => {
            bottomSheetRef.current ? bottomSheetRef.current.close() : {};
          }}
          rightButtonText="Save"
          handleSubmit={handleSaveItem}
          handleChangePhotoButton={handleChangePhotoButton}
        />
      </BottomSheet>
    </>
  );
}
