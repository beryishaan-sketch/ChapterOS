/**
 * Capacitor native bridge service
 * Handles detection of native context and push notification setup
 */

// Detect if running inside a Capacitor native app (iOS/Android)
export const isNative = () => {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
};

// Get the platform (ios, android, or web)
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  return window.Capacitor?.getPlatform?.() || 'web';
};

// Register push notification listeners (requires @capacitor/push-notifications installed)
export const onPushNotification = (callback) => {
  if (!isNative()) return () => {};
  try {
    const { PushNotifications } = window.Capacitor.Plugins;
    if (!PushNotifications) return () => {};
    const listener = PushNotifications.addListener('pushNotificationReceived', callback);
    return () => listener.remove();
  } catch {
    return () => {};
  }
};

// Request push notification permission and get device token
export const requestPushPermission = async () => {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = window.Capacitor.Plugins;
    if (!PushNotifications) return null;

    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();

      return new Promise((resolve) => {
        const listener = PushNotifications.addListener('registration', (token) => {
          listener.remove();
          resolve(token.value);
        });
        // Timeout after 5s
        setTimeout(() => resolve(null), 5000);
      });
    }
    return null;
  } catch {
    return null;
  }
};

// Open native share sheet
export const share = async ({ title, text, url }) => {
  if (!isNative()) {
    if (navigator.share) return navigator.share({ title, text, url });
    return navigator.clipboard.writeText(url);
  }
  try {
    const { Share } = window.Capacitor.Plugins;
    if (Share) await Share.share({ title, text, url, dialogTitle: title });
  } catch {}
};

// Haptic feedback
export const haptic = async (type = 'impact') => {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
    if (Haptics) {
      if (type === 'impact') await Haptics.impact({ style: ImpactStyle?.Medium || 'MEDIUM' });
      else if (type === 'success') await Haptics.notification({ type: 'SUCCESS' });
      else if (type === 'error') await Haptics.notification({ type: 'ERROR' });
    }
  } catch {}
};

export default { isNative, getPlatform, onPushNotification, requestPushPermission, share, haptic };
