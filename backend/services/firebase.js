const admin = require('firebase-admin');

// initialize firebase admin using service account environment variables
let isFirebaseInitialized = false;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

if (projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isFirebaseInitialized = true;
    console.log('[firebase] initialized successfully');
  } catch (err) {
    console.error(`[firebase error] initialization failed: ${err.message}`);
  }
} else {
  console.log('[firebase warning] credentials missing in env, push notifications disabled');
}

const sendDetectionPush = async (fcmToken, detection) => {
  // gracefully skip sending if no token is provided instead of throwing
  if (!fcmToken) {
    console.log('[fcm] skipped push notification: no token provided');
    return null;
  }

  if (!isFirebaseInitialized) {
    console.log('[fcm] skipped push notification: firebase admin not initialized');
    return null;
  }

  const payload = {
    token: fcmToken,
    notification: {
      title: 'Animal Intrusion Detected!',
      body: `A ${detection.animal || 'target animal'} was detected with ${detection.confidence}% confidence.`,
    },
    data: {
      animal: String(detection.animal || ''),
      confidence: String(detection.confidence || ''),
      camera: String(detection.camera_id || ''),
      zone: String(detection.zone || ''),
      detection_id: String(detection.id || ''),
      image_url: String(detection.image_url || ''),
    },
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log(`[fcm] push notification sent successfully (id: ${response})`);
    return response;
  } catch (err) {
    console.error(`[fcm error] push notification failed for token ${fcmToken.substring(0, 10)}...: ${err.message}`);
    return null;
  }
};

module.exports = { sendDetectionPush };
