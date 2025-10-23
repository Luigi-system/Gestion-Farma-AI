import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { PillIcon } from '../components/icons';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPass = localStorage.getItem('rememberedPass');
        if (savedEmail && savedPass) {
            setEmail(savedEmail);
            setPassword(savedPass);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign in the user with their credentials
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            // 2. After successful sign-in, check if the user profile has company and branch assigned
            const { data: profile, error: profileError } = await supabase
                .from('usuarios')
                .select('empresa_id, sede_id')
                .eq('email', email)
                .single();
            
            if (profileError || !profile) {
                 await supabase.auth.signOut(); // Log out immediately for security
                 throw new Error("No se pudo verificar tu perfil de usuario. Asegúrate de estar registrado en la tabla de usuarios.");
            }
            
            // 3. If either company or branch is missing, deny access
            if (!profile.empresa_id || !profile.sede_id) {
                await supabase.auth.signOut(); // Log out immediately
                setError("No estás asignado a una empresa o sede. Contacta a un administrador para obtener acceso.");
                setLoading(false);
                return; // Stop the login process
            }
            
            // 4. If everything is correct, handle "remember me" and navigate to dashboard
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPass', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPass');
            }

            navigate('/app/dashboard');

        } catch (err: any) {
            console.error("Login error:", err);
            // Differentiate between a wrong password and a missing profile/assignment
            if (err.message.includes("No se pudo verificar") || err.message.includes("asignado")) {
                setError(err.message);
            } else {
                setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-soft-gray-100 dark:bg-gray-900 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <div className="flex flex-col items-center">
                    <PillIcon className="h-12 w-12 text-clinical-blue" />
                    <h1 className="mt-2 text-3xl font-bold text-gray-800 dark:text-gray-100">Gestion<span className="text-clinical-blue">Farma</span></h1>
                    <p className="text-gray-600 dark:text-gray-400">Accede a tu panel de administración</p>
                </div>
                
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900/40 dark:text-red-200">
                        {error}
                    </div>
                )}
                
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Email o Usuario
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="text"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>

                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                             className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-clinical-blue focus:ring-blue-500 border-gray-300 rounded" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}/>
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Recordar sesión
                            </label>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-clinical-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
                        >
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <Link to="/" className="font-medium text-clinical-blue hover:underline">
                        &larr; Volver a la página principal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;