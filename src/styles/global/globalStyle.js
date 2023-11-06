import { StyleSheet } from "react-native";
import { Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  datePickerIos: {
    height: 100,
    width: '100%',
  },
  bottomSheetContainer: {
    width: '100%',
    height: '100%',
  },
  bottomSheetBoldText: {
    fontWeight: 'bold',
    fontSize: 20,
    textDecorationLine: 'underline',
  },
  inputLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    width: '100%',
    marginTop: 5,
    marginBottom: 5,
  },
  bottomSheetText: {
    fontWeight: 'normal',
    fontSize: 20
  },
  bottomSheetSmallText: {
    fontWeight: 'normal',
    fontSize: 10
  },
  itemListHeader: {
    width: '100%',
    height: '6%'
  },
  headerText: {
    color: '#FFFF',
    fontSize: 15
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
  },
  takePhotoButton: {
    width: 70,
    height: 70,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: '#fff',
    marginBottom: '1%'
  },
  addItemButton: {
    width: 70,
    height: 70,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: '#fff',
    marginBottom: '3%',
    marginRight: '3%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemButtonIcon: {
    width: 200,
    height: 200,
  },
  barcodeKnownBottomSheetContainer: {
    height: '35%',
    width: '100%',
    flexDirection: 'row', 
    margin: 10,
    paddingRight: 10,
  },
  barcodeUnknownBottomSheetContainer: {
    height: '20%',
    width: '100%',
    flexDirection: 'row', 
    margin: 10,
  },
  bottomSheetImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px black solid',
    backgroundColor: 'lightgrey',
    borderRadius: 15
  },
  bottomSheetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    alignItems: 'center',
  },
  fullExpandedBottomSheetImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '10%',
    border: '1px black solid',
    backgroundColor: 'lightgrey',
    borderRadius: 15
  },
  itemListImage: {
    width: 100,
    height: 100,
    borderRadius: 15
  },
  accordionListContainer: {
    paddingLeft: 20
  },
  listItemContent: {
    marginLeft: 10
  },
  inputSheetContainer: {
    margin: 20,
    flexDirection: 'column',
    height: '100%'
  },
  input: {
    width: "100%",
    padding: 10,
    backgroundColor: '#f2f2f2',
    height: 50
  },
  mutilineInput: {
    width: '100%',
    padding: 10,
    textAlignVertical: 'top',
    backgroundColor: '#f2f2f2',
  },
  buttonContainer: {
    margin: 10,
    width: '100%',
    height: '100%'
  },
  button: {
    width: '100%',
    height: '100%'
  }
});