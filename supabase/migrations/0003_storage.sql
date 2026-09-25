-- 0003_storage.sql
-- Bucket de almacenamiento para logos de vidrierías (público para visualización y PDFs).

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

-- Lectura pública para poder mostrar los logos en la app y en presupuestos PDF
create policy "logos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Solo el usuario autenticado de esa vidriería puede escribir
-- dentro de la ruta logos/{vidrieria_id}/
create policy "logos: escribir la propia"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );

-- Solo el usuario autenticado de esa vidriería puede actualizar o eliminar su logo
create policy "logos: actualizar la propia"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );

create policy "logos: eliminar la propia"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (
      select vidrieria_id::text from usuarios
      where auth_uid = auth.uid()
      limit 1
    )
  );
