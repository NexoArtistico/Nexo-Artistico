-- =====================================================================
-- NEXO ARTÍSTICO — Esquema Supabase (paso 1 de 2). Ejecutar completo en SQL Editor.
-- =====================================================================

create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());
alter table public.admins enable row level security;
create or replace function public.is_admin() returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (user_id = auth.uid());

create table if not exists public.configuracion (
  clave text primary key,
  valor text,
  created_at timestamptz default now()
);
alter table public.configuracion enable row level security;
drop policy if exists configuracion_read on public.configuracion;
create policy configuracion_read on public.configuracion for select using (true);
drop policy if exists configuracion_write on public.configuracion;
create policy configuracion_write on public.configuracion for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.obras (
  id text primary key,
  titulo text,
  autor text,
  imagen text,
  etiquetas text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.obras enable row level security;
drop policy if exists obras_read on public.obras;
create policy obras_read on public.obras for select using (visible or public.is_admin());
drop policy if exists obras_write on public.obras;
create policy obras_write on public.obras for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.proyectos (
  id text primary key,
  titulo text,
  descripcion text,
  categoria text,
  estado text,
  fecha_inicio date,
  fecha_final date,
  participantes integer,
  obras integer,
  ganadores integer,
  enlace text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.proyectos enable row level security;
drop policy if exists proyectos_read on public.proyectos;
create policy proyectos_read on public.proyectos for select using (visible or public.is_admin());
drop policy if exists proyectos_write on public.proyectos;
create policy proyectos_write on public.proyectos for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.libros (
  id text primary key,
  titulo text,
  autores text,
  idioma text,
  enlace text,
  orden integer,
  visible boolean not null default true,
  nueva_pestana boolean not null default true,
  created_at timestamptz default now()
);
alter table public.libros enable row level security;
drop policy if exists libros_read on public.libros;
create policy libros_read on public.libros for select using (visible or public.is_admin());
drop policy if exists libros_write on public.libros;
create policy libros_write on public.libros for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.recursos (
  id text primary key,
  titulo text,
  tipo text,
  categoria text,
  descripcion text,
  imagen text,
  enlace text,
  etiquetas text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.recursos enable row level security;
drop policy if exists recursos_read on public.recursos;
create policy recursos_read on public.recursos for select using (visible or public.is_admin());
drop policy if exists recursos_write on public.recursos;
create policy recursos_write on public.recursos for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.pines (
  id text primary key,
  titulo text,
  descripcion text,
  portada text,
  mini_1 text,
  mini_2 text,
  enlace text,
  cantidad_pines text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.pines enable row level security;
drop policy if exists pines_read on public.pines;
create policy pines_read on public.pines for select using (visible or public.is_admin());
drop policy if exists pines_write on public.pines;
create policy pines_write on public.pines for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.videos (
  id text primary key,
  titulo text,
  autor text,
  categoria text,
  youtube_url text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.videos enable row level security;
drop policy if exists videos_read on public.videos;
create policy videos_read on public.videos for select using (visible or public.is_admin());
drop policy if exists videos_write on public.videos;
create policy videos_write on public.videos for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.playlists (
  id text primary key,
  titulo text,
  autor text,
  descripcion text,
  nivel text,
  imagen text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.playlists enable row level security;
drop policy if exists playlists_read on public.playlists;
create policy playlists_read on public.playlists for select using (visible or public.is_admin());
drop policy if exists playlists_write on public.playlists;
create policy playlists_write on public.playlists for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.playlist_videos (
  id text primary key,
  playlist_id text not null references public.playlists(id) on delete cascade on update cascade,
  titulo text,
  youtube_url text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.playlist_videos enable row level security;
drop policy if exists playlist_videos_read on public.playlist_videos;
create policy playlist_videos_read on public.playlist_videos for select using (visible or public.is_admin());
drop policy if exists playlist_videos_write on public.playlist_videos;
create policy playlist_videos_write on public.playlist_videos for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.equipo (
  id text primary key,
  nombre text,
  rol text,
  descripcion text,
  imagen text,
  contribuciones text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.equipo enable row level security;
drop policy if exists equipo_read on public.equipo;
create policy equipo_read on public.equipo for select using (visible or public.is_admin());
drop policy if exists equipo_write on public.equipo;
create policy equipo_write on public.equipo for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.testimonios (
  id text primary key,
  nombre text,
  rol text,
  texto text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.testimonios enable row level security;
drop policy if exists testimonios_read on public.testimonios;
create policy testimonios_read on public.testimonios for select using (visible or public.is_admin());
drop policy if exists testimonios_write on public.testimonios;
create policy testimonios_write on public.testimonios for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.sobre (
  id text primary key,
  tipo text,
  titulo text,
  descripcion text,
  icono text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table public.sobre enable row level security;
drop policy if exists sobre_read on public.sobre;
create policy sobre_read on public.sobre for select using (visible or public.is_admin());
drop policy if exists sobre_write on public.sobre;
create policy sobre_write on public.sobre for all using (public.is_admin()) with check (public.is_admin());
