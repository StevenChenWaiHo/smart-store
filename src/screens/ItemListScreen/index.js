import { Text, Image, ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { Header, ListItem, Icon, Button } from '@rneui/themed';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../styles/global/globalStyle";
import * as SQLite from 'expo-sqlite'

export default function ItemListScreen() {
  const db = SQLite.openDatabase('list.db');

  const [list, setList] = useState([])
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    console.log(list)
  }, [])

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(`CREATE TABLE IF NOT EXISTS list (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            itemName TEXT,
            date TEXT)`)
    })

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM list', null,
        (txObj, resultList) => setList(resultList.rows._array),
        (txObj, error) => console.log(error))
    })
  })

  const getItemFromAsyncStorage = async () => {
    // AsyncStorage.getItem('list')
    //   .then(list => {
    //     const parsedList = JSON.parse(list)
    //     if (parsedList !== null && parsedList !== undefined && typeof parsedList === 'object') {
    //       setList(parsedList)
    //     }
    //   });
  }

  useEffect(() => {
    getItemFromAsyncStorage()
  }, [])

  const onRefresh = () => {
    getItemFromAsyncStorage()
  }

  const ItemView = ({ item }) => {
    return (
      <ListItem.Swipeable
        leftContent={(reset) => (
          <Button
            title="Info"
            onPress={() => reset()}
            icon={{ name: 'info', color: 'white' }}
            buttonStyle={{ minHeight: '100%' }}
          />
        )}
        rightContent={(reset) => (
          <Button
            title="Delete"
            onPress={() => reset()}
            icon={{ name: 'delete', color: 'white' }}
            buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
          />
        )}
      >
        <Image
          source={{ uri: item?.image }}
          style={styles.bottomSheetImage} />
        <ListItem.Content>
          <ListItem.Title>{item?.itemName}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
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
        rightComponent={{ icon: "menu", color: "#fff" }}
        rightContainerStyle={{}}
        statusBarProps={{}}
      />

      {/* {refreshing ? <ActivityIndicator /> : null}
      <FlatList
        data={list}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={ItemSeparatorView}
        enableEmptySections={true}
        renderItem={ItemView}
        refreshControl={
          <RefreshControl
            //refresh control used for the Pull to Refresh
            refreshing={refreshing}
            onRefresh={onRefresh}
          />}
      /> */}

      {list.map((item) => (
        <ListItem.Swipeable
          key={item?.id}
          leftContent={(reset) => (
            <Button
              title="Info"
              onPress={() => reset()}
              icon={{ name: 'info', color: 'white' }}
              buttonStyle={{ minHeight: '100%' }}
            />
          )}
          rightContent={(reset) => (
            <Button
              title="Delete"
              onPress={() => reset()}
              icon={{ name: 'delete', color: 'white' }}
              buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
            />
          )}
        >
          {/* <Image
            source={{ uri: item?.image }}
            style={styles.bottomSheetImage} /> */}
          <ListItem.Content>
            <ListItem.Title>{item?.itemName}</ListItem.Title>
            <ListItem.Title>{item?.date}</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem.Swipeable>
      ))}
    </>

  );
}