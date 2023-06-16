# PayloadCMS Plugin for Firebase

## Example usage:

```ts
plugins: [
  firebaseNotifications({
      enabled: true,
      firebase: {
        serviceAccount: require("./firebase-credentials.json"),
      },
      messageCollection: {
        slug: "notifications",
      },
    }),
]
```