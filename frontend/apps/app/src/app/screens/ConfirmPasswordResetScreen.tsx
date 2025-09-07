import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../components/auth/Input';
import Button from '../components/auth/Button';

const ConfirmPasswordResetSchema = Yup.object().shape({
  token: Yup.string().required('Required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

const ConfirmPasswordResetScreen = ({ navigation }) => {
  const handleConfirmPasswordReset = async (values, { setSubmitting }) => {
    try {
      const response = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: values.token,
          password: values.password,
        }),
      });
      const _data = await response.json();
      // Handle successful password reset, e.g., navigate to login
      // TODO: Implement proper success handling
      navigation.navigate('Login');
    } catch (error) {
      // Handle error
      // TODO: Implement proper error handling
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Reset</Text>
      <Formik
        initialValues={{ token: '', password: '', confirmPassword: '' }}
        validationSchema={ConfirmPasswordResetSchema}
        onSubmit={handleConfirmPasswordReset}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
        }) => (
          <>
            <Input
              placeholder="Reset Token"
              onChangeText={handleChange('token')}
              onBlur={handleBlur('token')}
              value={values.token}
              error={touched.token ? errors.token : null}
            />
            <Input
              placeholder="New Password"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              secureTextEntry
              error={touched.password ? errors.password : null}
            />
            <Input
              placeholder="Confirm New Password"
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              secureTextEntry
              error={touched.confirmPassword ? errors.confirmPassword : null}
            />
            <Button
              title="Reset Password"
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
});

export default ConfirmPasswordResetScreen;
