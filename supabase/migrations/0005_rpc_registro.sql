-- 0005_rpc_registro.sql
-- Funciones almacenadas para registro seguro, validación de código y vinculación de usuarios.

-- 1. Verifica el código de activación. Accesible por clientes anónimos y autenticados.
create or replace function verificar_codigo_registro(codigo text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from configuracion_plataforma
    where id = 1
      and codigo_registro = crypt(codigo, codigo_registro)
  );
$$;

-- 2. Crea la vidriería y el usuario en una sola transacción.
-- Solo ejecutable con sesión activa (auth.uid() no nulo).
create or replace function crear_vidrieria(
  p_nombre          text,
  p_nombre_usuario  text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_vidrieria_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into vidrierias (nombre)
  values (p_nombre)
  returning id into v_vidrieria_id;

  insert into usuarios (auth_uid, vidrieria_id, nombre)
  values (auth.uid(), v_vidrieria_id, p_nombre_usuario);

  return v_vidrieria_id;
end;
$$;

-- 3. Vincula a un usuario invitado con la vidriería correspondiente
create or replace function vincular_usuario_invitado(
  p_vidrieria_id uuid,
  p_nombre       text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_usuario_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into usuarios (auth_uid, vidrieria_id, nombre)
  values (
    auth.uid(),
    p_vidrieria_id,
    coalesce(p_nombre, (select raw_user_meta_data->>'nombre' from auth.users where id = auth.uid()))
  )
  on conflict (auth_uid) do update
    set vidrieria_id = excluded.vidrieria_id,
        activo = true
  returning id into v_usuario_id;

  return v_usuario_id;
end;
$$;

-- Otorgar permisos de ejecución explícitos
grant execute on function verificar_codigo_registro(text) to anon, authenticated;
grant execute on function crear_vidrieria(text, text) to authenticated;
grant execute on function vincular_usuario_invitado(uuid, text) to authenticated;
