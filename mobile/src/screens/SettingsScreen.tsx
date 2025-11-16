import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Switch, List, Button } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuthStore();
  const [aiEnabled, setAiEnabled] = React.useState(true);

  const handleLogout = () => {
    logout();
    navigation.navigate('Login' as never);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="AI Features" />
        <Card.Content>
          <List.Item
            title="Enable AI Features"
            description="AI document writing, price estimation, and insights"
            right={() => (
              <Switch value={aiEnabled} onValueChange={setAiEnabled} />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Notifications" />
        <Card.Content>
          <List.Item
            title="Quotation Acceptance"
            right={() => <Switch value={true} />}
          />
          <List.Item
            title="Payment Reminders"
            right={() => <Switch value={true} />}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#dc2626"
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  card: {
    margin: 16,
    elevation: 2
  },
  logoutButton: {
    margin: 16,
    marginTop: 8
  }
});

