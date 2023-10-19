
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { Camera, CameraType } from 'expo-camera';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemListScreen from './src/screens/ItemListScreen';
import { NavigationContainer } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import * as SQLite from 'expo-sqlite'

const Tab = createMaterialTopTabNavigator();

export default function App() {
  const db = SQLite.openDatabase('list.db');

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBarPosition={'bottom'}
        screenOptions={{
          swipeEnabled: false
        }}
        shifting={true}
      >
        <Tab.Screen
          name="Add Item"
          component={AddItemScreen}
          initialParams={{database: db}}
          options={{
            tabBarLabel: 'Add Item',
            tabBarIcon: (({}) => (
              <Icon name='add-shopping-cart'/>
            ))
          }}/>
        <Tab.Screen
          name="List"
          component={ItemListScreen}
          initialParams={{database: db}}
          options={{
            tabBarLabel: 'List',
            tabBarIcon: (({}) => (
              <Icon name='list'/>
            ))
          }}/>
      </Tab.Navigator>
    </NavigationContainer>

  );
}
