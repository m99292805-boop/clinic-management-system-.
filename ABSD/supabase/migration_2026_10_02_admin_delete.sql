-- إصلاح حذف الحسابات من لوحة الأدمن (كان يفشل بسبب مفاتيح FK وعدم حذف حسابات السكرتيرات)
-- (مُطبَّق على قاعدة البيانات أصلاً؛ هذا الملف للتوثيق وإعادة التطبيق)
alter table public.agent_rewards alter column doctor_id drop not null;
alter table public.agent_rewards drop constraint if exists agent_rewards_doctor_id_fkey;
alter table public.agent_rewards add constraint agent_rewards_doctor_id_fkey foreign key (doctor_id) references public.profiles(id) on delete set null;
alter table public.specialties drop constraint if exists specialties_created_by_fkey;
alter table public.specialties add constraint specialties_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.referral_rewards drop constraint if exists referral_rewards_referrer_id_fkey;
alter table public.referral_rewards add constraint referral_rewards_referrer_id_fkey foreign key (referrer_id) references public.profiles(id) on delete cascade;
alter table public.referral_rewards drop constraint if exists referral_rewards_referred_id_fkey;
alter table public.referral_rewards add constraint referral_rewards_referred_id_fkey foreign key (referred_id) references public.profiles(id) on delete cascade;
alter table public.profiles drop constraint if exists profiles_referred_by_fkey;
alter table public.profiles add constraint profiles_referred_by_fkey foreign key (referred_by) references public.profiles(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_agent_id_fkey;
alter table public.profiles add constraint profiles_agent_id_fkey foreign key (agent_id) references public.agents(id) on delete set null;

create or replace function public.admin_delete_doctor(p_profile_id uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_user_id uuid; v_deleted_count int; v_other_profiles_count int;
begin
  if not public.is_admin() then raise exception 'الأدمن فقط يقدر يحذف حساب طبيب'; end if;
  select user_id into v_user_id from public.profiles where id = p_profile_id and is_admin = false;
  if v_user_id is null then return false; end if;
  delete from auth.users where id in (select user_id from public.secretaries where doctor_id = p_profile_id);
  delete from public.profiles where id = p_profile_id;
  get diagnostics v_deleted_count = row_count;
  if v_deleted_count = 0 then return false; end if;
  select count(*) into v_other_profiles_count from public.profiles where user_id = v_user_id;
  if v_other_profiles_count = 0 then delete from auth.users where id = v_user_id; end if;
  return true;
end;
$function$;
revoke all on function public.admin_delete_doctor(uuid) from public, anon;
grant execute on function public.admin_delete_doctor(uuid) to authenticated;

-- حذف حساب موظف/مسوّق من لوحة الأدمن (مُطبَّق على القاعدة أصلاً)
alter table public.agent_rewards drop constraint if exists agent_rewards_agent_id_fkey;
alter table public.agent_rewards add constraint agent_rewards_agent_id_fkey foreign key (agent_id) references public.agents(id) on delete cascade;

create or replace function public.admin_delete_agent(p_agent_id uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_user_id uuid; v_deleted int;
begin
  if not public.is_admin() then raise exception 'الأدمن فقط يقدر يحذف حساب موظف/مسوّق'; end if;
  select user_id into v_user_id from public.agents where id = p_agent_id;
  if v_user_id is null then return false; end if;
  delete from public.agents where id = p_agent_id;
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then return false; end if;
  if not exists (select 1 from public.profiles where user_id = v_user_id)
     and not exists (select 1 from public.secretaries where user_id = v_user_id) then
    delete from auth.users where id = v_user_id;
  end if;
  return true;
end;
$function$;
revoke all on function public.admin_delete_agent(uuid) from public, anon;
grant execute on function public.admin_delete_agent(uuid) to authenticated;
