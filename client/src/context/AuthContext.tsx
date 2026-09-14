import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import api from "../utils/api";

export interface User {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    credits: number;
}

interface CurrentUserResponse {
    success: boolean;
    data?: User;
    message?: string;
}

interface LoginResponse {
    success: boolean;
    message?: string;
    data?: User;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    login: (token: string) => Promise<LoginResponse | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({
    children,
}: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const restoreSession = async (): Promise<void> => {
            try {
                const { data } = await api.get<CurrentUserResponse>(
                    "/api/user/me",
                );

                if (data.success && data.data) {
                    setUser(data.data);
                } else {
                    setUser(null);
                }
            } catch (error: unknown) {
                console.log("Session restore error:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (
        token: string,
    ): Promise<LoginResponse | null> => {
        try {
            const { data } = await api.post<LoginResponse>(
                "/api/auth/login",
                { token },
            );

            return data;
        } catch (error: unknown) {
            console.log("Login API error:", error);
            return null;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
        } catch (error: unknown) {
            console.log("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                setUser,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider",
        );
    }

    return context;
};