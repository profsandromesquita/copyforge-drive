-- Create storage bucket for copy images
insert into storage.buckets (id, name, public)
values ('copy-images', 'copy-images', true)
on conflict (id) do nothing;

-- RLS policies for copy-images bucket
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'copy-images');

create policy "Images are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'copy-images');

create policy "Users can update their own images"
on storage.objects for update
to authenticated
using (bucket_id = 'copy-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using (bucket_id = 'copy-images' and auth.uid()::text = (storage.foldername(name))[1]);