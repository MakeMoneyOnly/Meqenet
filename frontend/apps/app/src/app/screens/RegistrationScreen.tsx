import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../components/auth/Input';
import Button from '../components/auth/Button';
import { apiClient } from '@frontend/mobile-api-client';

const RegistrationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

const RegistrationScreen = ({ navigation }) => {
  const handleRegister = async (values, { setSubmitting, setStatus }) => {
    try {
      await apiClient.post('/auth/register', {
        email: values.email,
        password: values.password,
      });
      navigation.navigate('Login');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Formik
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        validationSchema={RegistrationSchema}
        onSubmit={handleRegister}
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
            <Input
              placeholder="Password"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              secureTextEntry
              error={touched.password ? errors.password : null}
            />
            <Input
              placeholder="Confirm Password"
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              secureTextEntry
              error={touched.confirmPassword ? errors.confirmPassword : null}
            />
            <Button
              title="Register"
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

export default RegistrationScreen;
