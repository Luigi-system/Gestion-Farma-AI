import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { Navigate, Outlet } from 'react-router-dom';
import { Usuario, Sede, Empresa } from '../types';

type UserProfile = Usuario & {
    sedes: Sede | null;
    empresas: Empresa | null;
};

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    empresa: Empresa | null;
    sede: Sede | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [sede, setSede] = useState<Sede | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionAndProfile = async () => {
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error("Error fetching session:", sessionError);
                setLoading(false);
                return;
            }

            setSession(currentSession);
            const authUser = currentSession?.user ?? null;
            setUser(authUser);

            if (authUser) {
                const { data: profileData, error: profileError } = await supabase
                    .from('usuarios')
                    .select('*, sedes(*), empresas(*)')
                    .eq('email', authUser.email)
                    .single();

                if (profileError) {
                    console.error("Error fetching user profile:", profileError);
                } else if (profileData) {
                    setProfile(profileData as UserProfile);
                    setEmpresa(profileData.empresas);
                    setSede(profileData.sedes);
                }
            } else {
                setProfile(null);
                setEmpresa(null);
                setSede(null);
            }
            setLoading(false);
        };

        fetchSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const authUser = session?.user ?? null;
            setUser(authUser);

            if (authUser) {
                supabase
                    .from('usuarios')
                    .select('*, sedes(*), empresas(*)')
                    .eq('email', authUser.email)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error("Error fetching profile on auth change:", error);
                            setProfile(null);
                            setEmpresa(null);
                            setSede(null);
                        } else if (data) {
                            setProfile(data as UserProfile);
                            setEmpresa(data.empresas);
                            setSede(data.sedes);
                        }
                    });
            } else {
                setProfile(null);
                setEmpresa(null);
                setSede(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        profile,
        empresa,
        sede,
        loading,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const ProtectedRoute: React.FC = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-soft-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-clinical-blue"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};