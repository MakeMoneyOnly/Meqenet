/* eslint-disable no-console */
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../components/auth/Input';
import Button from '../components/auth/Button';
import { useAuthStore } from '@meqenet/mobile-state-management';
import { apiClient } from '@frontend/mobile-api-client';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

const LoginScreen = () => {
  const { login } = useAuthStore();

  const handleLogin = async (values, { setSubmitting, setStatus }) => {
    try {
      const response = await apiClient.post('/auth/login', values);
      const responseData = response.data; // API response is wrapped in 'data' property

      // Decode JWT token to get user information
      const token = responseData.accessToken;
      if (!token) {
        throw new Error('No access token received');
      }

      // Simple JWT decode (for mobile, we could use a library like jwt-decode)
      const decodeJWT = (token: string) => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''),
          );
          return JSON.parse(jsonPayload);
        } catch (error) {
          console.error('Failed to decode JWT token:', error);
          return null;
        }
      };

      const decodedToken = decodeJWT(token);
      if (!decodedToken) {
        throw new Error('Failed to decode authentication token');
      }

      // Create user object from decoded token
      const user = {
        id: decodedToken.sub,
        name: decodedToken.email, // Using email as name until we have display name
        email: decodedToken.email,
        roles: ['CUSTOMER'], // Default role, should be fetched from backend
      };

      // Login with user data and token
      await login(user, token, responseData.refreshToken);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
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
            <Button
              title="Login"
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

export default LoginScreen;
