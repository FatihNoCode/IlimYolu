# Releasing the Android app

The Android app is the same React web app wrapped in a Capacitor shell. `dist/`
is bundled into the `.aab`, so **a UI change only reaches phones via a new Play
release** — pushing to `main` updates rahmanegitim.com only.

## Testing before you release

Use the **Build Android Debug APK** workflow — it needs no keystore and no
secrets, and it runs automatically on PRs touching `android/` or `src/`.

1. Actions → **Build Android Debug APK** → Run workflow.
2. Download the `app-debug-*` artifact and unzip it.
3. Get the APK onto an Android phone (email/Drive it to yourself, or
   `adb install app-debug.apk`). Allow "install unknown apps" when prompted.

Step 3 of the one-time setup below (the Supabase redirect allowlist) applies to
debug builds too — without it, Google login fails in the APK.

### What to check on-device

The webview differs from a desktop browser, so test what the browser cannot:

- **Google login** — should open the system browser and land back in the app,
  signed in. This is the flow most likely to break.
- **Password reset** — the emailed link should reopen the app, not a browser
  showing `localhost`.
- **Hardware back button** — Android's back gesture, which has no web equivalent.
- **Offline launch** — airplane mode. The UI is bundled and should still render;
  anything hitting Supabase will fail, which is expected.

## One-time setup

### 1. Create the upload keystore

Generate this yourself and keep it safe — if you lose it you cannot ship updates
to the same listing without a Play key reset. Do not commit it (`.gitignore`
blocks `*.keystore` / `*.jks`).

```
keytool -genkey -v -keystore upload.keystore -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Add the GitHub secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i upload.keystore` output |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | key password |

### 3. Allowlist the native auth callback

The shell's page origin is `https://localhost`, which Google rejects as a
redirect target. Native builds redirect to `com.rahmanegitim.app://auth-callback`
instead (see `src/lib/native.ts`). This must be allowlisted or **Google login and
password reset will fail in the app while continuing to work on the web**:

- Supabase → Authentication → URL Configuration → Redirect URLs → add
  `com.rahmanegitim.app://auth-callback`

## Each release

1. Actions → **Build Android App Bundle** → Run workflow → enter the version name.
2. Download the `app-release-*` artifact.
3. Upload the `.aab` in the Play Console and submit for review.

`versionCode` comes from the workflow run number, so it always increases. The
workflow does not publish to Play — that step stays manual and yours.
