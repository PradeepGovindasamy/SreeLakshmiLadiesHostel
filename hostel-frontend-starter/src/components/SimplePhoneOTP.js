import React, { useState } from 'react';
import { firebaseAPI } from '../api';

const SimplePhoneOTP = ({ onSuccess, onError }) => {
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!phoneNumber) {
      onError?.('Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await firebaseAPI.sendOTP(phoneNumber);
      setSessionInfo(response.data.session_info);
      setStep(2);
      onSuccess?.('OTP sent successfully');
    } catch (error) {
      onError?.(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      onError?.('Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await firebaseAPI.verifyOTP(phoneNumber, otp, sessionInfo);
      
      // Store auth data
      localStorage.setItem('access', response.data.access_token);
      localStorage.setItem('refresh', response.data.refresh_token);
      
      onSuccess?.(response.data);
    } catch (error) {
      onError?.(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Phone Number Verification</h3>
        <input
          type="tel"
          placeholder="Enter phone number (+919876543210)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button 
          onClick={sendOTP} 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none' }}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Enter OTP</h3>
      <p>Code sent to {phoneNumber}</p>
      <input
        type="text"
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', textAlign: 'center', fontSize: '1.2em' }}
      />
      <button 
        onClick={verifyOTP} 
        disabled={loading || otp.length !== 6}
        style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', marginBottom: '10px' }}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <button 
        onClick={() => setStep(1)} 
        style={{ width: '100%', padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none' }}
      >
        Back to Phone Number
      </button>
    </div>
  );
};

export default SimplePhoneOTP;
