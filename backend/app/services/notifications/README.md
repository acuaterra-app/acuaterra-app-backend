# Firebase Cloud Messaging (FCM) Notification System

## Overview

This module provides a flexible notification system using Firebase Cloud Messaging (FCM) for sending push notifications to mobile devices. The system follows an object-oriented approach with:

- An abstract `BaseNotification` class that defines the common structure and behavior for all notifications
- Concrete notification classes that extend the base class for specific notification types:
  - `ModuleNotification`: For notifications related to modules
  - `HighMeasurementNotification`: For notifications about high measurements exceeding thresholds
  - `FarmNotification`: For notifications related to farm events

The notification payload follows this structure:
```json
{
  "to": "DEVICE_TOKEN",
  "notification": {
    "title": "Notification Title",
    "body": "Notification Body"
  },
  "data": {
    "notification_type": "notification_type_identifier",
    "payload": "additional_data",
    "url": "optional_deep_link_url"
  }
}
```

The Android app can process these notifications based on the `notification_type` field and handle them accordingly.

## Installation and Setup

### 1. Install Required Dependencies

```bash
npm install --save firebase-admin
```

### 2. Firebase Service Account Setup

1. Obtain a Firebase service account key:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Navigate to your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. Set up environment variables in your `.env` file:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="your-private-key"
   ```
   
   Alternatively, you can reference the service account JSON file directly:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
   ```

### 3. Firebase Initialization

The system uses a singleton `FirebaseService` to manage the connection to Firebase:

```javascript
// This is handled internally by the FirebaseService class
const admin = require('firebase-admin');

// Initialize with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
```

## Usage Examples

### Basic Usage Pattern

```javascript
const { sendNotification } = require('./app/services/notifications');
const { ModuleNotification, HighMeasurementNotification, FarmNotification } = require('./app/services/notifications');

// Create the appropriate notification object
const notification = new FarmNotification('farmId123', 'Green Valley Farm', 'update');

// Send to a specific device
sendNotification('deviceToken123', notification)
  .then(() => console.log('Notification sent successfully'))
  .catch(error => console.error('Error sending notification:', error));

// Send to multiple devices
sendNotification(['deviceToken1', 'deviceToken2'], notification)
  .then(() => console.log('Notifications sent successfully'))
  .catch(error => console.error('Error sending notifications:', error));
```

### Module Notification Example

Use this for notifications related to modules (e.g., module updates, status changes):

```javascript
const { ModuleNotification } = require('./app/services/notifications');

// Create a module notification
const notification = new ModuleNotification(
  'module123',
  'Module Update', 
  'The module has been updated successfully'
);

// Customize with additional data if needed
notification.setData({
  moduleType: 'sensor',
  updatedFields: ['name', 'description']
});

// Send the notification
sendNotification(userDeviceToken, notification);
```

### High Measurement Notification Example

Use this for alerting users about measurements exceeding thresholds:

```javascript
const { HighMeasurementNotification } = require('./app/services/notifications');

// Create a high measurement notification
const notification = new HighMeasurementNotification(
  'module123',
  'temperature', 
  35.5,
  30.0
);

// Additional customization
notification.setAdditionalContext('Greenhouse A');
notification.setRecommendedAction('Consider turning on cooling system');

// Send the notification
sendNotification(userDeviceToken, notification);
```

### Farm Notification Example

Use this for farm-related events:

```javascript
const { FarmNotification } = require('./app/services/notifications');

// Using the constructor
const notification = new FarmNotification(
  'farm123',
  'Green Valley Farm',
  'update'
);

// Using factory methods
const newMemberNotification = FarmNotification.newMemberAdded('farm123', 'Green Valley Farm', 'John Doe');
const statusChangeNotification = FarmNotification.statusChanged('farm123', 'Green Valley Farm', 'active');

// Send the notification
sendNotification(userDeviceToken, notification);
```

## Environment Configuration

The following environment variables must be set in your `.env` file:

```
# Firebase configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Optional: Alternative path to service account JSON file
# FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json

# FCM configuration (optional)
FCM_API_URL=https://fcm.googleapis.com/fcm/send  # Default FCM API URL
FCM_TIMEOUT=5000  # Timeout in milliseconds for FCM requests
```

## Error Handling

The notification system includes comprehensive error handling:

```javascript
sendNotification(token, notification)
  .then(response => {
    console.log('Successfully sent message:', response);
  })
  .catch(error => {
    if (error.code === 'messaging/invalid-registration-token') {
      // Token is invalid or expired - remove from database
      removeInvalidToken(token);
    } else if (error.code === 'messaging/registration-token-not-registered') {
      // Token is no longer registered - remove from database
      removeInvalidToken(token);
    } else {
      console.error('Error sending message:', error);
    }
  });
```

## Best Practices

1. **Token Management**: Maintain a database of valid device tokens. Remove invalid tokens when detected.
2. **Batch Processing**: For sending to many devices, use `sendMulticast` instead of sending individual messages.
3. **Payload Size**: Keep notification payloads small (< 4KB) for optimal delivery.
4. **Silent Notifications**: For data-only updates, omit the `notification` field and only use the `data` field.
5. **Notification Groups**: For applications with high notification volume, use notification groups to avoid overwhelming users.

