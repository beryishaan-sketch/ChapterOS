import { useState, useEffect } from 'react';
import client from '../api/client';

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const { data } = await client.get('/push/vapid-key');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.data.publicKey),
      });
      await client.post('/push/subscribe', { subscription: sub.toJSON() });
      setSubscribed(true);
      return true;
    } catch (e) {
      console.error('Push subscribe error:', e);
      return false;
    } finally { setLoading(false); }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await client.post('/push/unsubscribe');
      setSubscribed(false);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
