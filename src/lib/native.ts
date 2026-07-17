import { Capacitor } from '@capacitor/core';

export function isNative() {
  return Capacitor.isNativePlatform();
}

// On the web the app is served from its own origin, so Supabase can redirect
// straight back to it. Inside the Capacitor shell the origin is
// https://localhost, which Google rejects as a redirect target and which turns
// password-reset links into dead ends on the user's phone. Native builds route
// back through a custom scheme instead, registered in AndroidManifest.xml.
export const NATIVE_AUTH_SCHEME = 'com.rahmanegitim.app';
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://auth-callback`;

export function getAuthRedirectTo() {
  return isNative() ? NATIVE_AUTH_REDIRECT : window.location.origin;
}
