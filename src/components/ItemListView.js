import dateNumberToString from "../data/date/dateNumberToString";
import { styles } from "../styles/global/globalStyle";
import { useState } from "react";

export default function ItemListView({
  list,
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
      data={list}
      keyExtractor={(item, index) => index.toString()}
      includeseparatorComponent={ItemSeparatorView}
      renderItem={ItemView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />}
    />
  )

}