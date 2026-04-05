import { useCallback } from 'react';

export function useHaptic() {
  const impact = useCallback(async (style = 'medium') => {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] ?? ImpactStyle.Medium });
    } catch { /* browser — no haptics */ }
  }, []);

  const notification = useCallback(async (type = 'success') => {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] ?? NotificationType.Success });
    } catch { /* browser */ }
  }, []);

  const selection = useCallback(async () => {
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
    } catch { /* browser */ }
  }, []);

  return { impact, notification, selection };
}
