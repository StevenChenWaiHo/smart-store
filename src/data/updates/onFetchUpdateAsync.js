import * as Updates from 'expo-updates'
import { Alert } from 'react-native';

export default onFetchUpdateAsync = async () => {
  
    const updateApp = async () => {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      ToastAndroid.show('Updated to the newest version');
    }
  
    try {
      const update = await Updates.checkForUpdateAsync();
  
      if (update.isAvailable) {
        Alert.alert(
          "New Version Availiable",
          `Please update your app to the newest version`,
          [{ text: "Update", onPress: () => updateApp() }],
          { cancelable: false }
        );
      }
    } catch (error) {
      alert(`Error fetching latest Expo update: ${error}`);
    }
  }