import { Text, Image, ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { Header, ListItem, Icon, Button } from '@rneui/themed';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useReducer, useState } from "react";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../styles/global/globalStyle";
import * as SQLite from 'expo-sqlite'
import { useIsFocused } from "@react-navigation/native";

export default function ItemListScreen({ route }) {
  // const db = route.params.database;
  const db = SQLite.openDatabase('list.db');
  const focus = useIsFocused()

  const [list, setList] = useState([])
  const [refreshing, setRefreshing] = useState(true);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
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
      tx.executeSql('SELECT * FROM list ORDER BY date', null,
        (txObj, resultList) => updateList(resultList.rows._array),
        (txObj, error) => console.log(error))
    })
  }

  const useOneItem = (i, j) => {
    const tempItem = list[i].dates[j]
    const newQuantity = Math.max(tempItem.quantity - 1, 0)
    tempItem.quantity = newQuantity;
    db.transaction(tx => {
      tx.executeSql('UPDATE list SET quantity = (?) WHERE id = (?)', [newQuantity, tempItem.id])
    })
    forceUpdate()
  }

  const deleteItem = (i, j) => {
    const tempItemId = list[i].dates[j].id
    list[i].dates.splice(j, 1)
    if (list[i].dates.length <= 0) {
      list.splice(i, 1)
    }
    db.transaction(tx => {
      tx.executeSql('DELETE FROM list WHERE id = (?)', [tempItemId])
    })
    forceUpdate(1)
  }

  const clearList = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM list ORDER BY date', null)
    })
  }


  useEffect(() => {

    // db.transaction(tx => {
    //   tx.executeSql(`CREATE TABLE IF NOT EXISTS list (
    //         id INTEGER PRIMARY KEY AUTOINCREMENT, 
    //         itemName TEXT,
    //         date INTEGER,
    //         quantity INTEGER,
    //         image BLOB)`)
    // })
    if (focus) {
      updateListFromDatabase();
    }
  }, [focus])

  const onRefresh = () => {
    setRefreshing(true)
    updateListFromDatabase()
  }

  const [expandedItemId, setExpandedItemId] = useState(-1);

  const ItemView = ({ item, index: i }) => {
    return (
      item.dates.length > 1 ?
        // Multiple Dates
        <ListItem.Accordion
          key={i}
          content={
            <>
              <Image
                source={{ uri: item?.dates?.[0]?.image }}
                style={styles.itemListImage} />
              <ListItem.Content style={styles.listItemContent}>
                <ListItem.Title>
                  {item?.itemName}
                </ListItem.Title>
                <ListItem.Subtitle>
                  {new Date(item?.dates?.[0]?.date).toDateString()}
                  {/* Sum of quantity of all items */}
                  Quantity: {item?.dates?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
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
              key={j}
              leftContent={(reset) => (
                <Button
                  title="Use 1"
                  onPress={() => { useOneItem(i, j); reset()}}
                  icon={{ name: 'info', color: 'white' }}
                  buttonStyle={{ minHeight: '100%' }}
                />
              )}
              rightContent={(reset) => (
                <Button
                  title="Delete"
                  onPress={() => {deleteItem(i, j); reset()}}
                  icon={{ name: 'delete', color: 'white' }}
                  buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
                />
              )}
            >
              <View style={styles.accordionListContainer}>
                <Image
                  source={{ uri: date.image }}
                  style={styles.itemListImage} />
                <ListItem.Content style={styles.listItemContent}>
                  <ListItem.Subtitle>
                    {new Date(date.date).toDateString()}
                    {/* Sum of quantity of all items */}
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
          leftContent={(reset) => (
            <Button
              title="Use 1"
              onPress={() => {useOneItem(i, 0); reset()}}
              icon={{ name: 'info', color: 'white' }}
              buttonStyle={{ minHeight: '100%' }}
            />
          )}
          rightContent={(reset) => (
            <Button
              title="Delete"
              onPress={() => {deleteItem(i, 0); reset()}}
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
                <ListItem.Title>
                  {item?.itemName}
                </ListItem.Title>
                <ListItem.Subtitle>
                  {new Date(item?.dates?.[0].date).toDateString()}
                  {/* Sum of quantity of all items */}
                  Quantity: {item?.dates?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
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
          backgroundColor: '#C8C8C8'
        }}
      />
    );
  };

  return (
    <>
      <StatusBar hidden={false} />

      <Header
        backgroundImageStyle={{}}
        barStyle="default"
        centerComponent={{
          text: "MY LIST",
          style: { color: "#fff" }
        }}
        centerContainerStyle={{}}
        containerStyle={{ width: '100%' }}
        leftContainerStyle={{}}
        linearGradientProps={{}}
        placement="center"
        rightComponent={<Icon name='clear' color={'#FFF'} onPress={clearList}/>}
        rightContainerStyle={{}}
        statusBarProps={{}}
      />

      <FlatList
        data={list}
        keyExtractor={(item, index) => index.toString()}
        includeseparatorComponent={ItemSeparatorView}
        enableEmptySections={true}
        renderItem={ItemView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />}
      />
    </>

  );
}