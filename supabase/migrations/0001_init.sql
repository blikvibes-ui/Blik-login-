create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id         uuid        primary key references auth.users(id) on delete cascade,
    username   text        not null,
    role       text        not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
    on public.profiles for select
    using (auth.uid() = id or public.is_admin());

revoke update on public.profiles from authenticated;
grant update (username) on public.profiles to authenticated;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create table if not exists public.invites (
    code_hash  text        primary key,
    created_by uuid        references public.profiles(id) on delete set null,
    used_by    uuid        references public.profiles(id) on delete set null,
    used_at    timestamptz,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

alter table public.invites enable row level security;
revoke all on public.invites from authenticated, anon;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_invite_code text;
    v_code_hash   text;
    v_username    text;
    v_expires_at  timestamptz;
    v_used_by     uuid;
begin
    v_invite_code := new.raw_user_meta_data ->> 'invite_code';
    v_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));

    if v_invite_code is null or length(v_invite_code) < 8 then
        raise exception 'INVITE_REQUIRED: a valid invite code is required to register';
    end if;

    v_code_hash := encode(digest(v_invite_code, 'sha256'), 'hex');

    select expires_at, used_by into v_expires_at, v_used_by
    from public.invites
    where code_hash = v_code_hash
    for update;

    if not found or v_used_by is not null or v_expires_at < now() then
        raise exception 'INVITE_INVALID: this invite code is invalid, already used, or expired';
    end if;

    insert into public.profiles (id, username, role)
    values (new.id, v_username, 'user');

    update public.invites
    set used_by = new.id, used_at = now()
    where code_hash = v_code_hash;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function public.check_invite(raw_code text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1 from public.invites
        where code_hash = encode(digest(raw_code, 'sha256'), 'hex')
          and used_by is null
          and expires_at > now()
    );
$$;

grant execute on function public.check_invite(text) to anon, authenticated;

create or replace function public.create_invite(expires_in_hours integer default 168)
returns table(raw_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_raw    text;
    v_hash   text;
    v_expiry timestamptz;
begin
    if not public.is_admin() then
        raise exception 'FORBIDDEN: admin role required';
    end if;

    v_raw := encode(gen_random_bytes(32), 'hex');
    v_hash := encode(digest(v_raw, 'sha256'), 'hex');
    v_expiry := now() + make_interval(hours => expires_in_hours);

    insert into public.invites (code_hash, created_by, expires_at)
    values (v_hash, auth.uid(), v_expiry);

    return query select v_raw, v_expiry;
end;
$$;

grant execute on function public.create_invite(integer) to authenticated;

create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_target_id uuid;
begin
    if not public.is_admin() then
        raise exception 'FORBIDDEN: admin role required';
    end if;

    select id into v_target_id from auth.users where email = lower(target_email);
    if v_target_id is null then
        raise exception 'NOT_FOUND: no user with that email';
    end if;

    update public.profiles set role = 'admin' where id = v_target_id;
end;
$$;

grant execute on function public.promote_to_admin(text) to authenticated;
