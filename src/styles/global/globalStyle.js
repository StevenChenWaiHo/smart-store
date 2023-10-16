import { StyleSheet } from "react-native";

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
    },
    topCenteredContainer: {
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    datePicker: {
      height: 120,
      marginTop: -10,
      margin: '2%',
    },
    modalContainer: {
      height: '100%',
      width: '100%',
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
  bottomSheetImage: {
      width: 70,
      height: 70,
      bottom: 0,
      borderRadius: 50,
      backgroundColor: '#fff'
    }
  });