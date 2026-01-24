import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Icon size={80} icon="account" />
          <Title style={styles.name}>{user?.name || 'User'}</Title>
          <Paragraph>{user?.phone_number || ''}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Account Information</Title>
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Email:</Paragraph>
            <Paragraph>{user?.email || 'N/A'}</Paragraph>
          </View>
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Phone:</Paragraph>
            <Paragraph>{user?.phone_number || 'N/A'}</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout">
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 15,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    marginTop: 10,
    fontSize: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
    width: 80,
  },
  logoutButton: {
    margin: 15,
    padding: 5,
  },
});

export default ProfileScreen;
