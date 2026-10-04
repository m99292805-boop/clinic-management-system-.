import { createClient } from '@supabase/supabase-js'

// القيم تأتي من .env؛ وإن غاب الملف وقت البناء نستخدم القيم الافتراضية أدناه
// (المفتاح publishable مخصص للعميل بطبيعته، والحماية الفعلية عبر سياسات RLS في Supabase)
const FALLBACK_URL = 'https://qdthcaucbfabscwyjuqz.supabase.co'
const FALLBACK_KEY = 'sb_publishable_an-5nPu05ddG7AM54aF0oA_hwYNBGyl'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('تنبيه: ملف .env غير موجود وقت البناء، تم استخدام الإعدادات الافتراضية')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
