import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export default function ClientsScreen() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
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
      <FlatList
        data={clients || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              {item.email && (
                <Text variant="bodySmall" style={styles.email}>
                  {item.email}
                </Text>
              )}
              {item.phone && (
                <Text variant="bodySmall" style={styles.phone}>
                  {item.phone}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No clients found</Text>
          </View>
        }
      />
      <FAB icon="plus" style={styles.fab} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  card: {
    margin: 8,
    elevation: 2
  },
  email: {
    color: '#666',
    marginTop: 4
  },
  phone: {
    color: '#666',
    marginTop: 2
  },
  empty: {
    padding: 32,
    alignItems: 'center'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});

