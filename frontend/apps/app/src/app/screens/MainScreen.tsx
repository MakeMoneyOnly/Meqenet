import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/auth/Button';
import { useAuthStore } from '@meqenet/mobile-state-management';

const MainScreen = () => {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {user?.name}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2D3436',
  },
});

export default MainScreen;
