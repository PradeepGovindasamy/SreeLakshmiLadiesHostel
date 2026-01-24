import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Title, Paragraph, Card } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { validatePhoneNumber } from '../../utils/validation';

const LoginScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { sendOTP, login } = useAuth();

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(phoneNumber);
      setOtpSent(true);
      Alert.alert('Success', 'OTP sent to your phone number');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await login(phoneNumber, otp);
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome to</Title>
            <Title style={styles.appName}>Sree Lakshmi Hostel</Title>
            <Paragraph style={styles.subtitle}>
              {otpSent ? 'Enter the OTP sent to your phone' : 'Login with your phone number'}
            </Paragraph>

            <TextInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              disabled={otpSent}
              style={styles.input}
              mode="outlined"
            />

            {otpSent && (
              <TextInput
                label="Enter OTP"
                value={otp}
                onChangeText={setOTP}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                mode="outlined"
              />
            )}

            {!otpSent ? (
              <Button
                mode="contained"
                onPress={handleSendOTP}
                loading={loading}
                disabled={loading}
                style={styles.button}>
                Send OTP
              </Button>
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}>
                  Verify & Login
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setOtpSent(false);
                    setOTP('');
                  }}
                  disabled={loading}
                  style={styles.textButton}>
                  Change Phone Number
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 5,
  },
  appName: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    padding: 5,
  },
  textButton: {
    marginTop: 10,
  },
});

export default LoginScreen;
