import { supabase } from '@/integrations/supabase/client';
import React from 'react';

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file - Arquivo de imagem
 * @param userId - ID do usuário autenticado
 * @returns URL pública da imagem
 */
export const uploadImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Fazer upload para o bucket
    const { error: uploadError, data } = await supabase.storage
      .from('copy-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('copy-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Extrai arquivo de imagem de um evento de paste
 * @param event - ClipboardEvent
 * @returns File ou null
 */
export const getImageFromPaste = (event: ClipboardEvent): File | null => {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      return file;
    }
  }

  return null;
};

/**
 * Extrai arquivo de imagem de um evento de drop
 * @param event - React.DragEvent
 * @returns File ou null
 */
export const getImageFromDrop = (event: React.DragEvent): File | null => {
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.indexOf('image') !== -1) {
      return file;
    }
  }

  return null;
};

/**
 * Valida se o arquivo é uma imagem válida
 * @param file - File
 * @returns boolean
 */
export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};
