-- 0004_configuracion_plataforma.sql
-- Tabla para almacenar el hash del código de activación de la plataforma.

create extension if not exists pgcrypto;

create table configuracion_plataforma (
  id               integer primary key default 1,
  codigo_registro  text not null,
  constraint solo_una_fila check (id = 1)
);

-- Sin RLS de lectura: ningún usuario (anónimo ni autenticado) puede leer directamente la tabla.
alter table configuracion_plataforma enable row level security;
-- No se crean policies: por defecto todo acceso directo vía API queda denegado.
