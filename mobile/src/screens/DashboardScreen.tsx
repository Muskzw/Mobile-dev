import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

export default function DashboardScreen() {
  const navigation = useNavigation();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Dashboard
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats?.quotations?.total || 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Quotations
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats?.invoices?.total || 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Invoices
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats?.upcomingDeadlines || 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Upcoming Deadlines
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.quickActions}>
          <Card.Title title="Quick Actions" />
          <Card.Content>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('DocumentCreate' as never)}
              style={styles.actionButton}
            >
              Create Quotation
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Documents' as never)}
              style={styles.actionButton}
            >
              View Documents
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('DocumentCreate' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  header: {
    padding: 16
  },
  title: {
    fontWeight: 'bold'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8
  },
  statCard: {
    width: '47%',
    margin: 4
  },
  statLabel: {
    color: '#666',
    marginTop: 4
  },
  quickActions: {
    margin: 16
  },
  actionButton: {
    marginVertical: 4
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});

