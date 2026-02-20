import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '@/config/theme';

export default function ProductsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.background,
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.light.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.light.mutedForeground,
  },
});
