import { ListItem, SearchBar, Image } from "@rneui/themed";
import { FlatList, ImageStyle, Platform, RefreshControl } from "react-native";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native";
import { DEFAULT_IMAGE } from "../../constants/image";
import { styles as global, styles } from "../../styles/global/globalStyle";
import { ListItemContent } from "@rneui/base/dist/ListItem/ListItem.Content";
import { useState } from "react";
import { ListViewEntry } from "../../components/listView/ItemListView";

const ImageGird = () => {
  return (
    <View style={{ flexDirection: "column" }}>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <Image
          source={{
            uri: "https://images.openfoodfacts.org/images/products/544/900/021/4799/front_en.203.400.jpg",
          }}
          style={storageListStyles.image}
          containerStyle={storageListStyles.imageContainer as ImageStyle}
        />
        <Image
          source={{
            uri: "https://images.openfoodfacts.org/images/products/326/884/000/1008/front_fr.377.400.jpg",
          }}
          style={storageListStyles.image}
          containerStyle={storageListStyles.imageContainer as ImageStyle}
        />
      </View>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <Image
          source={{
            uri: "https://images.openfoodfacts.org/images/products/505/969/773/4953/front_en.3.400.jpg",
          }}
          style={storageListStyles.image}
          containerStyle={storageListStyles.imageContainer as ImageStyle}
        />
        <View style={storageListStyles.imageWithOverlay}>
          <Image
            source={{}}
            style={storageListStyles.image}
            containerStyle={storageListStyles.imageContainer as ImageStyle}
          />
          <View style={storageListStyles.imageOverlayTextContainer}>
            <Text style={storageListStyles.imageOverlayText}>+10</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const StorageListItem = ({
  item,
  index: i,
}: {
  item: string;
  index: number;
}) => {
  return (
    <View style={storageListStyles.itemContainer}>
      <ListItem containerStyle={storageListStyles.itemContent}>
        <ImageGird />
        <ListItemContent>
          <Text style={styles.bottomSheetBoldText}>Storage {i}</Text>
          <View style={{ width: "100%" }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={storageListStyles.description}
            >
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nemo
              ratione incidunt tempore quasi molestiae expedita provident sint
              reiciendis, repellendus aliquam quis accusamus nihil ab
              reprehenderit quam corporis, vel commodi ut?
            </Text>
          </View>
        </ListItemContent>
      </ListItem>
    </View>
  );
};

export default function StorageScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const onRefresh = () => {};

  return (
    <>
      <SearchBar
        placeholder="Type Here..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        platform={
          Platform.OS === "android" || Platform.OS === "ios"
            ? Platform.OS
            : "default"
        }
      />

      <FlatList
        data={new Array(20).fill("abc").map((val, i) => val + (i + 1))}
        keyExtractor={(item, index) => index.toString()}
        renderItem={StorageListItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </>
  );
}

const storageListStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start", // if you want to fill rows left to right
  },
  itemContainer: {
    padding: 5,
  },
  itemContent: {
    borderRadius: 10,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    margin: 1,
    backgroundColor: "#3d3d3d",
    borderColor: "lightgrey",
  },
  image: {
    resizeMode: "cover",
  },
  imageWithOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayTextContainer: {
    position: "absolute",
  },
  imageOverlayText: {
    fontWeight: "bold",
    color: "white",
    fontSize: 15,
    justifyContent: "center",
    alignItems: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  description: {
    flex: 1,
    color: "grey",
  },
});
