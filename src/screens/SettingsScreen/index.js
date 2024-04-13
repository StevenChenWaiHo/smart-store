import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator
} from 'react-native';

import { Icon } from '@rneui/themed';
import exportItemList from '../../data/SQLite/exportItemList';
import exportSavedItems from '../../data/SQLite/exportSavedItems';
import importItemList from '../../data/SQLite/importItemList';
import importSavedItems from '../../data/SQLite/importSavedItems';
import settingsStyles from '../../styles/global/settingsStyle';
import resetNotifications from '../../data/notification/resetNotifications';
import getAllNotifications from '../../data/notification/getAllNotifications';
import getList from '../../data/SQLite/getList';
import getSavedItems from '../../data/SQLite/getSavedItems';

const SettingTab = ({
  onPress,
  icon,
  label,
  firstItem = false,
}) => {
  const [loading, setLoading] = useState(false)
  return (
    <View style={firstItem ? [settingsStyles.rowWrapper, settingsStyles.rowFirst] : [settingsStyles.rowWrapper]}>
      <TouchableOpacity
        onPress={async () => { setLoading(true); await onPress(); setLoading(false) }}
        style={settingsStyles.row}
        disabled={loading}>
        <View
          style={settingsStyles.rowIcon}>
          {icon}
        </View>

        <Text style={loading ? settingsStyles.rowLabelLoading : settingsStyles.rowLabel}>{label} </Text>
        {loading ? <ActivityIndicator color={'orange'} /> : <></>}

        <View style={settingsStyles.rowSpacer} />

      </TouchableOpacity>
    </View>
  )
}

export default function SettingsScreen({ route }) {

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <View style={settingsStyles.container}>

        <ScrollView>
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Items</Text>

            <View style={settingsStyles.sectionBody}>
              <SettingTab
                label="Get List"
                icon={<Icon name='list' type='font-awesome' />}
                onPress={getList}
                firstItem={true}
              />

              <SettingTab
                label="Get Saved Items"
                icon={<Icon name='list' type='font-awesome' />}
                onPress={getSavedItems}
              />

            </View>
          </View>

          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Notification</Text>


            <View style={settingsStyles.sectionBody}>
              <SettingTab
                label="Reset Notification"
                icon={<Icon name='rotate-right' type='font-awesome' />}
                onPress={resetNotifications}
                firstItem={true}
              />
              <SettingTab
                label="Get All Scheduled Notification"
                icon={<Icon name='list' type='font-awesome' />}
                onPress={getAllNotifications}
              />
            </View>
          </View>

          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Import</Text>

            <View style={settingsStyles.sectionBody}>
              <SettingTab
                label="Import Item List"
                icon={<Icon name='download' type='font-awesome' />}
                onPress={importItemList}
                firstItem={true}
              />

              <SettingTab
                label="Import Saved Items"
                icon={<Icon name='download' type='font-awesome' />}
                onPress={importSavedItems}
              />

            </View>
          </View>

          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Export</Text>

            <View style={settingsStyles.sectionBody}>
              <SettingTab
                label="Export Item List"
                icon={<Icon name='share' type='font-awesome' />}
                onPress={exportItemList}
                firstItem={true}
              />

              <SettingTab
                label="Export Saved Items"
                icon={<Icon name='share' type='font-awesome' />}
                onPress={exportSavedItems}
              />

            </View>
          </View>
        </ScrollView>

      </View>

      <Text style={settingsStyles.contentFooter}>Made by hohocomsci</Text>
    </SafeAreaView >
  );
}

