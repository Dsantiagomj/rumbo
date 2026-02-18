import { APP_NAME } from '@rumbo/shared';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius } from '@/config/theme';

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
    backgroundColor: colors.light.background,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.light.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.light.mutedForeground,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.light.mutedForeground,
  },
});
