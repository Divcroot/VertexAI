import { useState } from "react";

import toast from "react-hot-toast";

import { signInWithPopup } from "firebase/auth";

import { FcGoogle } from "react-icons/fc";

import { Loader2 } from "lucide-react";

import { auth, googleProvider } from "../utils/firebase";

import { useAuth } from "../context/AuthContext";

const Login = () => {

    const [loggingIn, setLoggingIn] = useState<boolean>(false);

    const { setUser, login } = useAuth();

    const handleLogin = async (): Promise<void> => {
        setLoggingIn(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);

            const token = await result.user.getIdToken();

            const data = await login(token);

            if (data?.success && data.data) {
                setUser(data.data);
            }

        } catch (error: unknown) {
            console.log("Login error:", error);

            const message = error instanceof Error ? error.message : "Login failed. Please try again.";

            toast.error(message);

        } finally {
            setLoggingIn(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#f4f6f8] px-4 transition-colors duration-300 dark:bg-[#07070c]">

            {/* Ambient glow */}

            <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-150 w-150 -translate-x-1/2 rounded-full bg-white/5 blur-[120px] dark:block" />

            {/* Login Card */}

            <div className="relative w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 dark:border-white/8 dark:bg-[#111113]">

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5 dark:border-transparent">

                    <span className="text-lg font-bold text-slate-900">
                        AI
                    </span>

                </div>

                <h2 className="mb-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Welcome to VertexAI
                </h2>

                <p className="mb-6 text-[13px] sm:text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Sign in to access your projects
                    and continue building.
                </p>

                <button
                    disabled={loggingIn}
                    onClick={handleLogin}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-[13.5px] font-medium text-slate-800 shadow-sm transition-colors duration-150 hover:bg-slate-50 disabled:opacity-70 dark:border-transparent dark:bg-white dark:hover:bg-slate-100">

                    {loggingIn ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <FcGoogle size={18} />
                    )}

                    {loggingIn ? "Logging in..." : "Continue with Google"}

                </button>

                <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-600">
                    By continuing you agree to our
                    Terms & Privacy Policy.
                </p>

            </div>

        </div>
    )
}

export default Login