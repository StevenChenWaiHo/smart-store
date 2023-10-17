import { Text } from "react-native";
import { Header, ListItem, Icon, Button } from '@rneui/themed';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";


export default function ItemListScreen() {

  return (
    <>
      <StatusBar hidden={false} />
      
      <Header
        backgroundImageStyle={{}}
        barStyle="default"
        centerComponent={{
          text: "MY LIST",
          style: { color: "#fff" }
        }}
        centerContainerStyle={{}}
        containerStyle={{ width: '100%'}}
        leftContainerStyle={{}}
        linearGradientProps={{}}
        placement="center"
        rightComponent={{ icon: "menu", color: "#fff" }}
        rightContainerStyle={{}}
        statusBarProps={{}}
      />
      <ListItem.Swipeable
        leftContent={(reset) => (
          <Button
            title="Info"
            onPress={() => reset()}
            icon={{ name: 'info', color: 'white' }}
            buttonStyle={{ minHeight: '100%' }}
          />
        )}
        rightContent={(reset) => (
          <Button
            title="Delete"
            onPress={() => reset()}
            icon={{ name: 'delete', color: 'white' }}
            buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
          />
        )}
      >
        <Icon name="store" />
        <ListItem.Content>
          <ListItem.Title>Hello Swiper</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem.Swipeable>
    </>

  );
}