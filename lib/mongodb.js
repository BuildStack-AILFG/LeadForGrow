// lib/mongodb.js
import dns from "dns";
import mongoose from "mongoose";
import { requireEnv } from "./env";

const dnsServers = dns.getServers();
const publicDns = ['8.8.8.8', '1.1.1.1'];
if (
  process.env.NODE_ENV === 'development' &&
  (dnsServers.length === 0 ||
    (dnsServers.length === 1 && dnsServers[0] === '127.0.0.1'))
) {
  dns.setServers(publicDns);
} else if (process.env.NODE_ENV === 'development') {
  dns.setServers([...new Set([...dnsServers, ...publicDns])]);
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function getMongoUri() {
  return requireEnv("MONGODB_URI");
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = getMongoUri();
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      // Each serverless instance keeps this many idle sockets open; with many
      // instances at peak, 5 each can exhaust the Atlas connection limit.
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      ...(process.env.NODE_ENV === "development" && {
        tlsAllowInvalidCertificates: true,
      }),
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

export async function checkDBHealth() {
  try {
    if (!cached.conn) {
      await dbConnect();
    }
    await mongoose.connection.db.admin().ping();
    return { status: "healthy", message: "Database connection is active" };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error.message,
      error: error,
    };
  }
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("MongoDB disconnected");
  }
}
