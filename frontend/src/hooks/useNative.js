import { Capacitor } from '@capacitor/core';

let _cached = null;

export function getIsNative() {
  if (_cached !== null) return _cached;
  try {
    _cached = Capacitor.isNativePlatform();
  } catch {
    _cached = false;
  }
  return _cached;
}

export function useNative() {
  return getIsNative();
}
