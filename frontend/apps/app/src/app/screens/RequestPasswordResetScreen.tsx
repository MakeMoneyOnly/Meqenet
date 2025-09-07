import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../components/auth/Input';
import Button from '../components/auth/Button';
import { apiClient } from '@frontend/mobile-api-client';

const RequestPasswordResetSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
});

const RequestPasswordResetScreen = ({ navigation }) => {
  const handleRequestPasswordReset = async (
    values,
    { setSubmitting, setStatus },
  ) => {
    try {
      await apiClient.post('/auth/password-reset-request', values);
      navigation.navigate('ConfirmPasswordReset');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={RequestPasswordResetSchema}
        onSubmit={handleRequestPasswordReset}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
          status,
        }) => (
          <>
            {status ? <Text style={styles.errorText}>{status}</Text> : null}
            <Input
              placeholder="Email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              error={touched.email ? errors.email : null}
            />
            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isSubmitting}
            />
          </>
        )}
      </Formik>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2D3436',
  },
  errorText: {
    color: '#E84393',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RequestPasswordResetScreen;
