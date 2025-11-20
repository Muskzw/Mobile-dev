import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { setAuth } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      console.log('Attempting to register with API...');
      console.log('Request data:', { email, password, fullName });

      const response = await api.post('/auth/register', {
        email,
        password,
        fullName
      });
      console.log('Registration successful:', response.data);
      const { token, user } = response.data;

      setAuth(token, user, []);
      navigation.navigate('Companies' as never);
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        // Server responded with error
        const data = error.response.data;

        // Check for validation errors
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((err: any) => err.msg || err.message).join('\n');
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.surface}>
        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Start creating professional quotations
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.linkButton}
          >
            Already have an account? Sign in
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    elevation: 4
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666'
  },
  form: {
    gap: 16
  },
  input: {
    marginBottom: 8
  },
  button: {
    marginTop: 8,
    paddingVertical: 4
  },
  linkButton: {
    marginTop: 8
  }
});
