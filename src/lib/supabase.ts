import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO CRÍTICO: Supabase URL ou Anon Key não configurados no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// Teste de conexão silencioso para logar erros detalhados no console
supabase.from('customers').select('id', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error) {
            console.error('Erro de conexão com Supabase:', error.message);
            if (error.message.includes('failed to fetch')) {
                console.warn('DICA: Verifique se a URL do Supabase está correta e se você tem conexão com a internet.');
            }
        } else {
            console.log('Conexão com Supabase estabelecida com sucesso.');
        }
    });
