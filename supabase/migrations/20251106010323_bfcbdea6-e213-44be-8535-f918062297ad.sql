-- Criar bucket para vídeos de copy
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'copy-videos',
  'copy-videos',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi']
);

-- Política de upload: usuários autenticados podem fazer upload dos próprios vídeos
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'copy-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política de leitura: qualquer pessoa pode visualizar (bucket público)
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'copy-videos');

-- Política de atualização: usuários podem atualizar próprios vídeos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'copy-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política de exclusão: usuários podem deletar próprios vídeos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'copy-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);