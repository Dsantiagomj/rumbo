import { APP_NAME } from '@rumbo/shared';
import { StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Personal Finance</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Dashboard coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a0a0a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#737373',
  },
});
