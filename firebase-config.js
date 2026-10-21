// Firebase Console → Project settings → Your apps → SDK setup.
// Keep Gemini API keys out of this file. Firebase AI Logic manages the proxy path.
window.SEOHYEON_FIREBASE = {
  firebaseConfig: {
    apiKey: "AIzaSyBNv-Yb1X9tpYkuOVCoghnRB389fAl6vKc",
    authDomain: "seohyun-wiki.firebaseapp.com",
    projectId: "seohyun-wiki",
    storageBucket: "seohyun-wiki.firebasestorage.app",
    messagingSenderId: "30484472118",
    appId: "1:30484472118:web:ee1e1a9a8bfebe14251397"
  },
  // Public reCAPTCHA Enterprise site key registered in Firebase App Check for this web app.
  // Never put the matching secret key in this file.
  appCheckSiteKey: ""
};
window.SEOHYEON_FIREBASE.isFirebaseConfigured = Boolean(
  window.SEOHYEON_FIREBASE.firebaseConfig.apiKey
  && window.SEOHYEON_FIREBASE.firebaseConfig.projectId
  && window.SEOHYEON_FIREBASE.firebaseConfig.appId
);
