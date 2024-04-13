
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemListScreen from './src/screens/ItemListScreen';
import { NavigationContainer } from '@react-navigation/native';
import { Button, Icon } from '@rneui/themed';
import updateDatabase from './src/data/SQLite/updateDatabase';
import { Accelerometer } from 'expo-sensors';
import isShaking from './src/data/motion/shake/isShaking';
import debugLog from './src/data/debug/debugLog';
import { Alert } from 'react-native';
import resetDatabase from './src/data/SQLite/resetDatabase';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { styles } from './src/styles/global/globalStyle';
import exportDatabase from './src/data/SQLite/exportItemList';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {

  const [firstLoad, setFirstLoad] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  const enableDebugMode = () => {
    setDebugMode(true);
    setFirstLoad(true)
  }

  const disableDebugMode = () => {
    setDebugMode(false);
    setFirstLoad(true)
  }

  useEffect(() => {
    if (firstLoad) {
      updateDatabase({ debugMode: debugMode })
      setFirstLoad(false)
    }
  }, [firstLoad, debugMode])

  const debugModeButtons = [
    { text: "Reset Database", onPress: () => resetDatabase() },
    { text: "Disable", onPress: () => disableDebugMode() },
    { text: "Cancel", style: 'cancel', onPress: () => enableDebugMode() },
  ]

  const normalModeButtons = [
    { text: "Enable", style: 'cancel', onPress: () => enableDebugMode() },
    { text: "Cancel", style: 'cancel', onPress: () => { } },
  ]

  useEffect(() => {
    const shakeEventListener = Accelerometer.addListener(accelerometerData => {
      if (isShaking(accelerometerData)) {
        // Handle the shake event here
        Alert.alert(
          "Debug Mode",
          `Current Debug Mode: ${debugMode ? 'On' : 'Off'}`,
          debugMode ? debugModeButtons : normalModeButtons,
          { cancelable: false }
        );
      }
    });

    return () => {
      shakeEventListener.remove();
    };

  }, [debugMode]);

  return !firstLoad && (
    <ActionSheetProvider>
      <NavigationContainer>
        <Tab.Navigator
          shifting={true}>
          <Tab.Screen
            name="Add Item"
            component={AddItemScreen}
            options={{
              headerShown: false,
              headerTitle: 'Scan Barcode To Add Item',
              headerStyle: {
                backgroundColor: 'orange',
              },
              headerTitleStyle: {
                color: 'white',
              },
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
                backgroundColor: 'orange',
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
          {debugMode ? <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: 'orange',
              },
              headerTitleStyle: {
                color: 'white',
              },
              freezeOnBlur: false,
              tabBarLabel: 'Settings',
              tabBarIcon: (({ }) => (
                <Icon name='settings' />
              ))
            }} /> : <></>}
        </Tab.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>


  );
}
