import crypto from "crypto";

import { getAuth } from "firebase-admin/auth";

import firebaseApp from "../config/firebase.js";
import { AppError } from "../error/AppError.js";
import { User } from "../models/user.model.js";
import redis from "../../../../shared/redis/index.js";

const firebaseAuth = getAuth(firebaseApp);

interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    credits: number;
  };
  sessionId: string;
}

export const login = async (token: string): Promise<LoginResult> => {
  let decodedToken;

  try {
    decodedToken = await firebaseAuth.verifyIdToken(token);
  } catch {
    throw new AppError("Invalid or expired Firebase token", 401);
  }

  const firebaseUid = decodedToken.uid;

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    if (!decodedToken.email) {
      throw new AppError("Firebase account does not have an email", 400);
    }

    user = await User.create({
      firebaseUid,
      name: decodedToken.name ?? "User",
      email: decodedToken.email,
      avatar: decodedToken.picture ?? "",
    });
  }

  const sessionId = crypto.randomUUID();

  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({
      name: user.name,
      userId: user._id.toString(),
      email: user.email,
      avatar: user.avatar,
      credits: user.credits,
    }),
    "EX",
    7 * 24 * 60 * 60,
  );

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      credits: user.credits,
    },
    sessionId,
  };
};

export const logout = async (sessionId: string): Promise<void> => {
  await redis.del(`session:${sessionId}`);
};

export const deductCredits = async (
  userId: string,
  sessionId: string,
  amount: number,
): Promise<{ credits: number }> => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      credits: {
        $gte: amount,
      },
    },
    {
      $inc: {
        credits: -amount,
      },
    },
    {
      new: true,
    },
  ).select("credits");

  if (!user) {
    throw new AppError("Insufficient credits", 402);
  }

  const sessionKey = `session:${sessionId}`;

  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    throw new AppError("Session expired or invalid", 401);
  }

  let session: {
    userId: string;
    name: string;
    email: string;
    avatar: string;
    credits?: number;
  };

  try {
    session = JSON.parse(sessionData);
  } catch {
    throw new AppError("Invalid session data", 500);
  }

  await redis.set(
    sessionKey,
    JSON.stringify({
      ...session,
      credits: user.credits,
    }),
    "EX",
    7 * 24 * 60 * 60,
  );

  return {
    credits: user.credits,
  };
};

export const addCredits = async (
  userId: string,
  sessionId: string,
  credits: number,
): Promise<{ credits: number; }> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.credits = (user.credits || 0) + credits;

  await user.save();

  const sessionKey = `session:${sessionId}`;

  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    throw new AppError("Session expired or invalid", 401);
  }

  let session: {
    userId: string;
    name: string;
    email: string;
    avatar: string;
    credits?: number;
  };

  try {
    session = JSON.parse(sessionData);
  } catch {
    throw new AppError("Invalid session data", 500);
  }

  await redis.set(
    sessionKey,
    JSON.stringify({
      ...session,
      credits: user.credits,
    }),
    "EX",
    7 * 24 * 60 * 60,
  );

  return {
    credits: user.credits,
  };
};