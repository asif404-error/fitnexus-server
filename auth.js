import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "https://fitnexus-client-flame.vercel.app",
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        required: false,
      },
      trainerApplicationStatus: {
        type: "string",
        defaultValue: "none",
        required: false,
      },
      trainerExperience: {
        type: "number",
        required: false,
      },
      trainerSpecialty: {
        type: "string",
        required: false,
      },
      trainerFeedback: {
        type: "string",
        required: false,
      },
      image: {
        type: "string",
        required: false,
      },
    },
  },
});
