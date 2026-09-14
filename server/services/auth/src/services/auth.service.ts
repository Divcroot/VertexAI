import crypto from "node:crypto";

import { getAuth } from "firebase-admin/auth";

import redis from "../../../../shared/redis/index.js";
import firebaseApp from "../config/firebase.js";
import { AppError } from "../error/AppError.js";
import { User } from "../models/user.model.js";

const firebaseAuth = getAuth(firebaseApp);

const SESSION_TTL = 7 * 24 * 60 * 60;

type UserPlan = "free" | "pro" | "team";

interface SessionData {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  credits: number;
  plan: UserPlan;
}

interface LoginUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  credits: number;
  plan: UserPlan;
}

interface LoginResult {
  user: LoginUser;
  sessionId: string;
}

interface CreditResult {
  credits: number;
  plan: UserPlan;
}

// =====================================================
// SESSION
// =====================================================

const getSession = async (
  sessionId: string,
): Promise<SessionData> => {
  const sessionKey = `session:${sessionId}`;

  const sessionData =
    await redis.get(sessionKey);

  if (!sessionData) {
    throw new AppError(
      "Session expired or invalid",
      401,
    );
  }

  try {
    const session =
      JSON.parse(sessionData) as SessionData;

    if (
      !session.userId ||
      !session.name ||
      !session.email
    ) {
      throw new AppError(
        "Invalid session data",
        500,
      );
    }

    return session;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Invalid session data",
      500,
    );
  }
};

const updateSession = async (
  sessionId: string,
  session: SessionData,
): Promise<void> => {
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify(session),
    "EX",
    SESSION_TTL,
  );
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (
  token: string,
): Promise<LoginResult> => {
  let decodedToken;

  try {
    decodedToken =
      await firebaseAuth.verifyIdToken(
        token,
      );
  } catch {
    throw new AppError(
      "Invalid or expired Firebase token",
      401,
    );
  }

  const firebaseUid =
    decodedToken.uid;

  let user =
    await User.findOne({
      firebaseUid,
    });

  if (!user) {
    if (!decodedToken.email) {
      throw new AppError(
        "Firebase account does not have an email",
        400,
      );
    }

    user = await User.create({
      firebaseUid,
      name:
        decodedToken.name ?? "User",
      email: decodedToken.email,
      avatar:
        decodedToken.picture ?? "",
    });
  }

  const sessionId =
    crypto.randomUUID();

  const session: SessionData = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    credits: user.credits,
    plan: user.plan,
  };

  await updateSession(
    sessionId,
    session,
  );

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      credits: user.credits,
      plan: user.plan,
    },
    sessionId,
  };
};

// =====================================================
// LOGOUT
// =====================================================

export const logout = async (
  sessionId: string,
): Promise<void> => {
  await redis.del(
    `session:${sessionId}`,
  );
};

// =====================================================
// DEDUCT CREDITS
// =====================================================

export const deductCredits = async (
  userId: string,
  sessionId: string,
  amount: number,
): Promise<CreditResult> => {
  const session =
    await getSession(sessionId);

  if (
    session.userId !== userId
  ) {
    throw new AppError(
      "Invalid session",
      401,
    );
  }

  const user =
    await User.findOneAndUpdate(
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
    ).select("credits plan");

  if (!user) {
    throw new AppError(
      "Insufficient credits",
      402,
    );
  }

  await updateSession(
    sessionId,
    {
      ...session,
      credits: user.credits,
      plan: user.plan,
    },
  );

  return {
    credits: user.credits,
    plan: user.plan,
  };
};

// =====================================================
// ADD CREDITS
// =====================================================

export const addCredits = async (
  userId: string,
  sessionId: string,
  plan: UserPlan,
  credits: number,
): Promise<CreditResult> => {
  const session =
    await getSession(sessionId);

  if (
    session.userId !== userId
  ) {
    throw new AppError(
      "Invalid session",
      401,
    );
  }

  const user =
    await User.findById(userId);

  if (!user) {
    throw new AppError(
      "User not found",
      404,
    );
  }

  user.credits =
    user.credits + credits;

  user.plan = plan;

  await user.save();

  await updateSession(
    sessionId,
    {
      ...session,
      credits: user.credits,
      plan: user.plan,
    },
  );

  return {
    credits: user.credits,
    plan: user.plan,
  };
};