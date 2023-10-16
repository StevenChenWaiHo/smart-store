import { StyleSheet } from "react-native";
import { Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeftContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    margin: '2%'
  },
  topCenteredContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: '2%'
  },
  bottomRightContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginRight: '10%'
  },
  datePicker: {
    height: 120,
    marginTop: -40,
    marginLeft: -10,
  },
  modalContainer: {
    height: '100%',
    width: '100%',
    marginLeft: '5%',                              
    marginRight: '5%'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  camera: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  takePhotoButton: {
    width: 70,
    height: 70,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: '#fff'
  },
  addItemButton: {
    width: 70,
    height: 70,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  bottomSheetImageContainer: {
    width: '100%',
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});