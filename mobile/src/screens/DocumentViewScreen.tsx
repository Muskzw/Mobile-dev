import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import api from '../api/client';

export default function DocumentViewScreen() {
  const route = useRoute();
  const { id } = route.params as { id: string };

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall">{document?.document_number}</Text>
          <Text variant="bodyMedium" style={styles.type}>
            {document?.type.replace('_', ' ')}
          </Text>
          <Text variant="titleLarge" style={styles.total}>
            {document?.currency} {parseFloat(document?.total || 0).toFixed(2)}
          </Text>
        </Card.Content>
      </Card>
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
  type: {
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 4
  },
  total: {
    marginTop: 16,
    fontWeight: 'bold'
  }
});

