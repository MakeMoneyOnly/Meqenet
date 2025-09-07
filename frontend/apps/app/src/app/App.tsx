import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import RequestPasswordResetScreen from './screens/RequestPasswordResetScreen';
import ConfirmPasswordResetScreen from './screens/ConfirmPasswordResetScreen';
import MainScreen from './screens/MainScreen';
import { useAuthStore } from '@meqenet/mobile-state-management/lib/auth-store';
import Spinner from './components/auth/Spinner';

const App = (): React.JSX.Element => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState('Login');

  useEffect(() => {
    const check = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    check();
  }, [checkAuth]);

  const navigation = {
    navigate: (screenName) => setScreen(screenName),
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    const renderScreen = () => {
      switch (screen) {
        case 'Login':
          return <LoginScreen navigation={navigation} />;
        case 'Register':
          return <RegistrationScreen navigation={navigation} />;
        case 'RequestPasswordReset':
          return <RequestPasswordResetScreen navigation={navigation} />;
        case 'ConfirmPasswordReset':
          return <ConfirmPasswordResetScreen navigation={navigation} />;
        default:
          return <LoginScreen navigation={navigation} />;
      }
    };

    return (
      <View style={{ flex: 1 }}>
        {renderScreen()}
        <View style={styles.navContainer}>
          <TouchableOpacity onPress={() => setScreen('Login')}>
            <Text style={styles.navText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('Register')}>
            <Text style={styles.navText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('RequestPasswordReset')}>
            <Text style={styles.navText}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <MainScreen />;
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  navText: {
    color: '#6C5CE7',
  },
});

export default App;
