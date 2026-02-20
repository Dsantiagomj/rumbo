import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, radius } from '@/config/theme';

const DRAWER_WIDTH = 288;

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setModalVisible(true);
    setClosing(false);
    slideAnim.setValue(-DRAWER_WIDTH);
    overlayAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    if (closing) return;
    setClosing(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      setClosing(false);
    });
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Avatar button */}
        <Pressable onPress={openDrawer} style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </Pressable>

        {/* Centered logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>R</Text>
          </View>
          <Text style={styles.logoText}>Rumbo</Text>
        </View>

        {/* Spacer for centering */}
        <View style={styles.spacer} />
      </View>

      {/* User drawer */}
      <Modal visible={modalVisible} animationType="none" transparent onRequestClose={closeDrawer}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* Drawer panel */}
        <Animated.View
          style={[
            styles.drawer,
            { paddingTop: insets.top, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Drawer header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Account</Text>
            <Pressable onPress={closeDrawer} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.light.foreground} />
            </Pressable>
          </View>

          {/* User info */}
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>U</Text>
            </View>
            <View>
              <Text style={styles.userName}>User</Text>
              <Text style={styles.userEmail}>user@rumbo.app</Text>
            </View>
          </View>

          {/* Settings link */}
          <View style={styles.drawerNav}>
            <Pressable
              onPress={() => {
                closeDrawer();
                router.push('/settings');
              }}
              style={styles.drawerItem}
            >
              <Ionicons name="settings-outline" size={20} color={colors.light.mutedForeground} />
              <Text style={styles.drawerItemText}>Settings</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.light.accentForeground,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.light.primaryForeground,
  },
  logoText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.light.foreground,
  },
  spacer: {
    width: 36,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  drawerTitle: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.light.foreground,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.light.accentForeground,
  },
  userName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.light.foreground,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.light.mutedForeground,
  },
  drawerNav: {
    padding: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  drawerItemText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.light.mutedForeground,
  },
});
