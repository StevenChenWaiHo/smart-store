
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AddItemScreen from './src/screens/AddItemScreen';
import TimedItemListScreen from './src/screens/TimedItemListScreen';
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
import VersionCheck from 'react-native-version-check';
import { Linking } from 'react-native';
import { ToastAndroid } from 'react-native';
import StorageScreen from './src/screens/StorageScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

  const firstLoadFunction = async () => {

    updateDatabase({ debugMode: debugMode })
    setFirstLoad(false)
  }

  useEffect(() => {
    if (firstLoad) {
      firstLoadFunction()
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
    <GestureHandlerRootView style={{ flex: 1 }}>

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
                  <Icon
                    name='barcode-scan'
                    type='material-community' />
                ))
              }} />
            <Tab.Screen
              name="Expired Soon"
              component={TimedItemListScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: 'orange',
                },
                headerTitleStyle: {
                  color: 'white',
                },
                freezeOnBlur: false,
                tabBarLabel: 'Expired Soon',
                tabBarIcon: (({ }) => (
                  <Icon name='history' />
                ))
              }} />
            <Tab.Screen
              name="Storage"
              component={StorageScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: 'orange',
                },
                headerTitleStyle: {
                  color: 'white',
                },
                freezeOnBlur: false,
                tabBarLabel: 'Storage',
                tabBarIcon: (({ }) => (
                  <Icon
                    name='view-grid-outline'
                    type='material-community' />

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
    </GestureHandlerRootView>


  );
}
