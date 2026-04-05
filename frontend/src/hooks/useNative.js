import { useState, useEffect } from 'react';

let _isNative = null;

export function useNative() {
  const [isNative, setIsNative] = useState(() => {
    if (_isNative !== null) return _isNative;
    try {
      const { Capacitor } = require('@capacitor/core');
      _isNative = Capacitor.isNativePlatform();
      return _isNative;
    } catch {
      _isNative = false;
      return false;
    }
  });
  return isNative;
}

export function getIsNative() {
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
