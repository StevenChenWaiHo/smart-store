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
import settingsStyles from '../../styles/global/settingsStyle';
import resetNotifications from '../../data/notification/resetNotifications';

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
        onPress={async () => { setLoading(true); await onPress() ; setLoading(false)}}
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
            <Text style={settingsStyles.sectionTitle}>Notification</Text>


            <View style={settingsStyles.sectionBody}>
              <SettingTab
                label="Reset Notification"
                icon={<Icon name='upload' type='font-awesome' />}
                onPress={resetNotifications}
                firstItem={true}
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
                onPress={() => {
                  // handle onPress
                }}
              />

            </View>

            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>Export</Text>

              <View style={settingsStyles.sectionBody}>
                <SettingTab
                  label="Export Item List"
                  icon={<Icon name='upload' type='font-awesome' />}
                  onPress={exportItemList}
                  firstItem={true}
                />

                <SettingTab
                  label="Export Saved Items"
                  icon={<Icon name='upload' type='font-awesome' />}
                  onPress={exportSavedItems}
                />

              </View>
            </View>
          </View>

          <Text style={settingsStyles.contentFooter}>Made by hohocomsci</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

