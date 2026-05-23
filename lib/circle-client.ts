"use client";

import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

let _sdk: W3SSdk | null = null;

// Returns a singleton SDK instance. Lazily created so SSR doesn't try to
// instantiate it (the SDK assumes a browser window).
export function getCircleSdk(): W3SSdk {
  if (typeof window === "undefined") {
    throw new Error("Circle SDK can only be used in the browser");
  }
  if (!_sdk) {
    _sdk = new W3SSdk();
    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    if (!appId) {
      throw new Error(
        "NEXT_PUBLIC_CIRCLE_APP_ID is not set. Add it in Vercel env vars."
      );
    }
    _sdk.setAppSettings({ appId });
  }
  return _sdk;
}

export interface CircleSessionTokens {
  userToken: string;
  encryptionKey: string;
}

// Configures the SDK with a fresh session before executing any challenge.
export function authenticateSdk(tokens: CircleSessionTokens) {
  const sdk = getCircleSdk();
  sdk.setAuthentication({
    userToken: tokens.userToken,
    encryptionKey: tokens.encryptionKey,
  });
  return sdk;
}

// Wraps sdk.execute in a Promise so callers can await PIN setup completion.
export function executeChallenge(
  challengeId: string,
  tokens: CircleSessionTokens
): Promise<void> {
  const sdk = authenticateSdk(tokens);
  return new Promise((resolve, reject) => {
    sdk.execute(challengeId, (error: any, result: any) => {
      if (error) {
        reject(
          new Error(
            `${error?.code ?? "unknown"}: ${error?.message ?? "Challenge failed"}`
          )
        );
        return;
      }
      // Success path: result.status === "COMPLETE" typically. Resolve regardless
      // of finer-grained status because the caller will re-fetch wallet state.
      resolve();
    });
  });
}
