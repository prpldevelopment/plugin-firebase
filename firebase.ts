let firebase;
if (typeof window === "undefined") {
  // Server-side - Node.js
  firebase = require("firebase-admin");
} else {
  // Client-side - Browser
  firebase = {}
}

export default firebase;
