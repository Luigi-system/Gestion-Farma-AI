import { createClient } from '@supabase/supabase-js';

// --- INSTRUCCIONES ---
// Pega aquí las credenciales de tu proyecto de Supabase.
//
// 1. URL del Proyecto:
//    La encontrarás en tu Dashboard de Supabase > Settings > API > Project URL.
//
// 2. Clave Pública (anon key):
//    La encontrarás en el mismo lugar, en la sección Project API Keys.
//    Usa la clave que dice 'anon' y 'public'.
//
// ¡ADVERTENCIA DE SEGURIDAD!
// NUNCA uses la clave 'service_role' (la secreta) aquí. Es solo para servidores.

const supabaseUrl = 'https://qohzstheshebjlscuihc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaHpzdGhlc2hlYmpsc2N1aWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODY3NDEsImV4cCI6MjA3MTY2Mjc0MX0.eNT-YtX0ALCky-dHTmM9GaTXfcCCdTEn0n8hwpyWneU'

// Se eliminó el bloque de verificación erróneo que causaba un falso error.
// La inicialización ahora es directa.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
