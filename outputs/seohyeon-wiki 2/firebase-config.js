// Firebase Console → Project settings → Your apps → SDK setup.
// Keep Gemini API keys out of this file. Firebase AI Logic manages the proxy path.
window.SEOHYEON_FIREBASE = {
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  // Optional: register a reCAPTCHA v3 site key in Firebase App Check for production.
  appCheckSiteKey: ""
};
window.SEOHYEON_FIREBASE.isFirebaseConfigured = Boolean(
  window.SEOHYEON_FIREBASE.firebaseConfig.apiKey
  && window.SEOHYEON_FIREBASE.firebaseConfig.projectId
  && window.SEOHYEON_FIREBASE.firebaseConfig.appId
);
