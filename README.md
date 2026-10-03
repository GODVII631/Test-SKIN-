# Minecraft Bedrock SkinAddon Portal (Supabase)

เว็บพอร์ทัลส่งไฟล์สกิน `.mcaddon` — React + Vite, **Supabase** (Auth/Postgres/Storage/Edge Functions), Discord Login, แจ้งเตือน Discord Webhook

| ชั้น | ใช้อะไร |
|---|---|
| Front end | React + Vite (deploy บน Vercel / Cloudflare Pages) |
| Auth | Supabase Auth + Discord provider |
| Authorization | RLS + ตาราง `profiles.role` (แก้จาก browser ไม่ได้) |
| Database | Postgres (`profiles`, `user_webhooks`, `skin_submissions`, `bot_logs`) |
| ไฟล์ | Storage bucket `addons` (private, 50 MB, signed URL) |
| API | PostgREST + Edge Function `send-discord-webhook` |
| Validation | CHECK constraints + trigger โควตาในฐานข้อมูล |

## ตั้งค่า

1. สร้าง Supabase project ใหม่ แล้วรัน `supabase/migrations/0001_init.sql` (SQL Editor หรือ `supabase db push`)
2. ตั้ง Admin คนแรก **ก่อนล็อกอิน**:
   ```sql
   insert into public.app_config(key, value) values ('initial_admin_discord_id', 'DISCORD_USER_ID_ของคุณ');
   ```
3. Discord Developer Portal → OAuth2 → Redirect: `https://<project-ref>.supabase.co/auth/v1/callback`
   แล้วใส่ Client ID/Secret ที่ Supabase → Authentication → Providers → Discord
4. Supabase → Authentication → URL Configuration: ใส่ Site URL และ Redirect URLs (โดเมนเว็บ + `http://localhost:3000`)
5. Deploy Edge Function: `supabase functions deploy send-discord-webhook` (ตั้ง `ALLOWED_ORIGIN` เป็นโดเมนเว็บด้วย `supabase secrets set`)
6. `cp .env.example .env` ใส่ URL + anon key → `npm install && npm run dev`
7. Deploy หน้าเว็บ (Vercel: ตั้ง `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## ความปลอดภัย
- ห้ามใส่ service_role key / Discord secret / webhook ใน frontend หรือ GitHub
- Webhook URL เก็บในตาราง `user_webhooks` (เจ้าของอ่านได้คนเดียว) และ Edge Function อ่านเองฝั่ง server
- Role, quota, is_blocked แก้ได้เฉพาะ admin (trigger + RLS)
- หลังรัน migration ให้เช็ก Supabase Advisors (Security) และทดสอบด้วยบัญชี member ว่าอ่านข้อมูลคนอื่นไม่ได้

> หมายเหตุ: ข้อมูลเดิมใน Firestore ไม่ถูกย้ายอัตโนมัติ (ผู้ใช้ต้องล็อกอินใหม่ผ่าน Supabase)
