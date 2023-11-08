
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { Camera, CameraType } from 'expo-camera';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemListScreen from './src/screens/ItemListScreen';
import { NavigationContainer } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import * as SQLite from 'expo-sqlite'
import updateDatabase from './src/data/SQLite/updateDatabase';

const Tab = createBottomTabNavigator();

export default function App() {

  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (firstLoad) {
      updateDatabase()
      setFirstLoad(false)
    }
  }, [firstLoad])

  return !firstLoad && (
    <NavigationContainer>
      <Tab.Navigator
        shifting={true}
      >
        <Tab.Screen
          name="Add Item"
          component={AddItemScreen}
          options={{
            headerShown: false,
            freezeOnBlur: false,
            tabBarLabel: 'Add Item',
            tabBarIcon: (({ }) => (
              <Icon name='add-shopping-cart' />
            ))
          }} />
        <Tab.Screen
          name="List"
          component={ItemListScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: 'skyblue',
            },
            headerTitleStyle: {
              color: 'white',
            },
            freezeOnBlur: false,
            tabBarLabel: 'List',
            tabBarIcon: (({ }) => (
              <Icon name='list' />
            ))
          }} />
      </Tab.Navigator>
    </NavigationContainer>

  );
}
