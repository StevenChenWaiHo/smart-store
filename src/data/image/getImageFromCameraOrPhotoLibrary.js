import getImageFromCamera from "./utils/getImageFromCamera";
import pickImageFromPhotoLibrary from "./utils/pickImageFromPhotoLibrary";
import { Camera } from "expo-camera";
import { useActionSheet } from "@expo/react-native-action-sheet";

export default async function getImageFromCameraOrPhotoLibrary() {
  
      const options = ['Camera', 'Choose Photo From Gallery', 'Cancel'];
      const cancelButtonIndex = 2;
  
      return useActionSheet().showActionSheetWithOptions({
        options,
        cancelButtonIndex,
      }, (selectedIndex) => {
        switch (selectedIndex) {
          case 0:
            getImageFromCamera()
            break;
  
          case 1:
            pickImageFromLibrary()
            break;
        }});
}