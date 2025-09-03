import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../../../libs/shared/src/i18n';

const AppContent = (): React.JSX.Element => {
  const { t, i18n: i18nInstance } = useTranslation();

  const changeLanguage = (lng: string): void => {
    i18nInstance.changeLanguage(lng);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.section}>
        <Text style={styles.textLg}>{t('greeting')}</Text>
        <View style={styles.langButtonContainer}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => changeLanguage('en')}
          >
            <Text>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => changeLanguage('am')}
          >
            <Text>Amharic</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export const App = (): React.JSX.Element => {
  return (
    <I18nextProvider i18n={i18n}>
      <AppContent />
    </I18nextProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  textLg: {
    fontSize: 24,
  },
  langButtonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  langButton: {
    marginHorizontal: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});

export default App;
