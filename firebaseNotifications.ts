import payload from "payload";
import { Config } from "payload/config";
import { AfterChangeHook } from "payload/dist/collections/config/types";
import { Notification, User } from "./../payload-types";
import { extendWebpackConfig } from "./extendWebpackConfig";
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

/**
 *
 * Notifications Plugin
 *
 * Should exist a notification collection
 * with the following fields:
 *  - data: object
 *  - tokens: array
 *
 * data contains any data you want to send to the client
 */

export interface PluginOptions {
  enabled?: boolean;
  firebase: {
    serviceAccount: string | ServiceAccount;
  };
  messageCollection: {
    slug: string;
  };
}

const afterChangeHook: AfterChangeHook<Notification> = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== "create") {
    return doc;
  }
  const { data, users } = doc;

  // if users is string array
  // we need to fetch the users
  let userDocs =
    typeof users[0] === "string"
      ? await payload
          .find({
            collection: "users",
            where: {
              id: {
                in: users,
              },
            },
          })
          .then((res) => res.docs)
      : (users as User[]);

  const tokens = userDocs.reduce((acc, user) => {
    if (user.tokens) {
      return [...acc, ...user.tokens.map((token) => token.token)];
    }
    return acc;
  }, []);

  //const messaging = admin.messaging();

  const notificationData: { [key: string]: string } = {
    test: "test",
  };

  const message = {
    data: notificationData,
    tokens,
  };
  console.log("Sent notification", notificationData, tokens);

  if (typeof window !== "undefined") {
    return doc;
  }
  // TODO: If we have more than 500 tokens, we need to split the message

  const { failureCount, responses, successCount } =
    await getMessaging().sendEachForMulticast(message);

  console.log("successCount", responses, successCount, failureCount);

  if (failureCount > 0) {
    // TODO: Handle failures
    // https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.sendresponse.md#sendresponse_interface
    // TODO: Clear failed tokens from users
  }

  return doc;
};

const firebaseNotifications =
  (options: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const { enabled = true, firebase } = options;
    if (!enabled) {
      return incomingConfig;
    }

    // If we're in the browser, we don't want to import firebase-admin
    // because it will throw an error
    if (typeof window !== "undefined") {
      return incomingConfig;
    }

    initializeApp({
      credential: cert(firebase.serviceAccount),
    });

    const config: Config = {
      ...incomingConfig,
      admin: {
        ...incomingConfig.admin,
        webpack: extendWebpackConfig(incomingConfig),
      },
      collections: incomingConfig.collections.map((collection) => {
        if (collection.slug !== options.messageCollection.slug) {
          return collection;
        }

        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [afterChangeHook],
          },
        };
      }),
    };

    return config;
  };

export default firebaseNotifications;
