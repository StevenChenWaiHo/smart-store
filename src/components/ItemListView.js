import dateNumberToString from "../data/date/dateNumberToString";
import { styles } from "../styles/global/globalStyle";
import { useState } from "react";
import { Header, ListItem, Icon, Button, SearchBar } from '@rneui/themed';
import { Text, Image, ActivityIndicator, FlatList, RefreshControl, View, TouchableOpacity, Platform } from "react-native";
import dateDifferenceInDays from "../data/date/dateDifferenceInDays";

const getExpiryDateLabelColor = (expiryDate) => {
  const difference = dateDifferenceInDays(expiryDate, new Date())
  return (
    difference < 0 ? 'black' :
      difference === 0 ? 'red' :
        difference <= 5 ? `orange` : 'green')
}

const RenderExpiryDateLabel = ({ expiryDate }) => {
  if (!expiryDate) {
    return (
      <Text style={{ ...styles.labelWithBackground, backgroundColor: 'lightgrey', color: 'white', fontWeight: 'bold' }}>No Expiry Date</Text>
    )
  }

  const expiryDateObject = new Date(expiryDate)

  const difference = dateDifferenceInDays(expiryDateObject, new Date())
  const labelString =
    difference < 0 ? 'Expired' :
      difference === 0 ? 'Expiring Today' :
        difference === 1 ? `Expiring Tomorrow` : `Expiring in ${difference} days`

  return (
    <Text style={{ ...styles.labelWithBackground, backgroundColor: getExpiryDateLabelColor(expiryDateObject), color: 'white', fontWeight: 'bold' }}>{labelString}</Text>
  )
}

export default function ItemListView({
  data,
  refreshing,
  onRefresh,
  onLeftButtonPress,
  onRightButtonPress
}) {

  const [expandedItemId, setExpandedItemId] = useState(-1);

  const ItemView = ({ item, index: i }) => {
    return (
      item.dates.length > 1 ?
        // Multiple Dates
        <ListItem.Accordion
          topDivider
          bottomDivider
          key={i}
          content={
            <>
              <Image
                source={{ uri: item?.dates?.[0]?.image }}
                style={styles.itemListImage} />
              <ListItem.Content style={styles.listItemContent}>
                <RenderExpiryDateLabel expiryDate={item?.dates?.[0].date} />
                <ListItem.Title>
                  <Text style={styles.bottomSheetBoldText}>{item?.itemName}</Text>
                </ListItem.Title>
                <ListItem.Subtitle>
                  <View>
                    {item?.dates?.[0].date ? <Text >{dateNumberToString(item?.dates?.[0].date)}</Text> : <></>}
                    {/* Sum of quantity of all items */}
                    <Text>Quantity : {item?.dates?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}</Text>
                  </View>
                </ListItem.Subtitle>
              </ListItem.Content>
            </>

          }
          isExpanded={expandedItemId === i}
          onPress={() => expandedItemId !== i ? setExpandedItemId(i) : setExpandedItemId(-1)}
        >
          <View >
            {item.dates.map((date, j) => (
              <ListItem.Swipeable
                topDivider
                bottomDivider
                key={j}
                leftContent={(reset) => (
                  <Button
                    title="Edit"
                    onPress={() => { onLeftButtonPress(i, j); reset() }}
                    icon={{ name: 'edit', color: 'white' }}
                    buttonStyle={{ minHeight: '100%' }}
                  />
                )}
                rightContent={(reset) => (
                  <Button
                    title="Delete"
                    onPress={() => { onRightButtonPress(i, j); reset() }}
                    icon={{ name: 'delete', color: 'white' }}
                    buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
                  />
                )}
              >
                <View style={{ ...styles.accordionListContainer, flexDirection: 'row' }}>
                  <Image
                    source={{ uri: date.image }}
                    style={styles.itemListImage} />
                  <ListItem.Content style={styles.listItemContent}>
                    <RenderExpiryDateLabel expiryDate={date.date} />
                    {date.date ?
                      <ListItem.Title>
                        <Text style={styles.bottomSheetText}>{dateNumberToString(date.date)}</Text>
                      </ListItem.Title> : <></>}
                    <ListItem.Subtitle>
                      Quantity: {date.quantity}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                </View>

              </ListItem.Swipeable>))}
          </View>

        </ListItem.Accordion>
        :
        // Only one Date
        <ListItem.Swipeable
          topDivider
          bottomDivider
          leftContent={(reset) => (
            <Button
              title="Edit"
              onPress={() => { onLeftButtonPress(i, 0); reset() }}
              icon={{ name: 'edit', color: 'white' }}
              buttonStyle={{ minHeight: '100%' }}
            />
          )}
          rightContent={(reset) => (
            <Button
              title="Delete"
              onPress={() => { onRightButtonPress(i, 0); reset() }}
              icon={{ name: 'delete', color: 'white' }}
              buttonStyle={{ minHeight: '100%', backgroundColor: 'red' }}
            />
          )}
        >
          <>
            <Image
              source={{ uri: item?.dates?.[0].image }}
              style={styles.itemListImage} />
            <ListItem.Content style={styles.listItemContent}>
              <RenderExpiryDateLabel expiryDate={item?.dates?.[0].date} />
              <ListItem.Title>
                <Text style={styles.bottomSheetBoldText}>{item?.itemName}</Text>
              </ListItem.Title>
              <ListItem.Subtitle>
                <View>
                  {item?.dates?.[0].date ? <Text>{dateNumberToString(item?.dates?.[0].date)}</Text> : <></>}
                  <Text>Quantity : {item?.dates?.[0].quantity}</Text>
                </View>

              </ListItem.Subtitle>
            </ListItem.Content>
          </>

        </ListItem.Swipeable>
    );
  };

  const ItemSeparatorView = () => {
    return (
      // Flat List Item Separator
      <View
        style={{
          height: 0.5,
          width: '100%',
          backgroundColor: '#C8C8C8',
        }}
      />
    );
  };


  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) => index.toString()}
      ItemSeparatorComponent={ItemSeparatorView}
      renderItem={ItemView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />}
    />
  )

}