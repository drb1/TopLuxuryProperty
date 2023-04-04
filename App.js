/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {WebView} from 'react-native-webview';
import axios from 'axios';
import {UserTokenStorage} from './DeviceTokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import RNBootSplash from 'react-native-bootsplash';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */

const App = () => {
  const [companyId, setCompanyId] = useState();
  const [employeeId, setEmployeeId] = useState();
  const [longitude, setLongitudeId] = useState('');
  const [latitude, setLatitudeId] = useState('');

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  if (Platform.OS === 'android') {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Access Permission',
        message: 'We would like to use your current location',
        buttonPositive: 'Okay',
      },
    );
  }

  useEffect(() => {
    RNBootSplash.hide({fade: true}); // fade
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);

  const saveUserId = async userId => {
    const deviceId = await AsyncStorage.getItem('deviceId');

    try {
      if (userId) {
        UserTokenStorage(userId).then(response => {
          console.log(response);
          if (response === 'success') {
            setEmployeeId(userId);

            const data = {
              eid: userId,
              deviceid: deviceId,
            };

            let axiosConfig = {
              headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                Accept: 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              mode: 'no-cors',
              withCredentials: true,
              credentials: 'same-origin',
            };

            axios
              .post(
                `https://salesnayak.in/API/UpdateDeviceId`,
                data,
                axiosConfig,
              )
              .then(response => {
                console.log('response from Update Device Id api', response);
              })
              .catch(error => console.log(error.response));
          }
        });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const onMessageReceived = event => {
    let data = event.nativeEvent.data;
    console.log(event.nativeEvent.data);
    let dataArr = data.split(',');
    let cmpId = dataArr[0];
    let userId = dataArr[1];

    console.log('received from web', data);

    if (cmpId) {
      setCompanyId(cmpId);
    }
    if (userId) {
      saveUserId(userId);
    }
  };

  return (
    <>
      <StatusBar />
      <WebView
        originWhitelist={['http://*', 'https://*', 'intent://*']}
        startInLoadingState={true}
        javaScriptEnabled={true}
        source={{
          uri: 'https://portal.topluxuryproperty.com/TopLuxuryProperty',
        }}
        onLoadProgress={({nativeEvent}) => {
          return <ActivityIndicator size="large" />;
        }}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        onMessage={onMessageReceived}
      />
    </>
  );
};

export default App;
