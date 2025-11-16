import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, List } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

export default function DocumentsScreen() {
  const navigation = useNavigation();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents');
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
        data={documents || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('DocumentView' as never, { id: item.id } as never)}
          >
            <Card.Content>
              <Text variant="titleMedium">{item.document_number}</Text>
              <Text variant="bodySmall" style={styles.type}>
                {item.type.replace('_', ' ')}
              </Text>
              <Text variant="bodyMedium" style={styles.amount}>
                {item.currency} {parseFloat(item.total).toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.status}>
                {item.status}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No documents found</Text>
          </View>
        }
      />
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
  type: {
    color: '#666',
    textTransform: 'capitalize'
  },
  amount: {
    marginTop: 8,
    fontWeight: 'bold'
  },
  status: {
    marginTop: 4,
    color: '#666'
  },
  empty: {
    padding: 32,
    alignItems: 'center'
  }
});

