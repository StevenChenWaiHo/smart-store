
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemListScreen from './src/screens/ItemListScreen';
import { NavigationContainer } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import updateDatabase from './src/data/SQLite/updateDatabase';
import { Accelerometer } from 'expo-sensors';
import isShaking from './src/data/utils/motion/shake/isShaking';
import debugLog from './src/data/utils/debug/debugLog';
import { Alert } from 'react-native';
import resetDatabase from './src/data/SQLite/resetDatabase';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

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
    </ActionSheetProvider>


  );
}
