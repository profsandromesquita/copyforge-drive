export type BlockType = 'text' | 'headline' | 'subheadline' | 'list' | 'button';

export interface BlockConfig {
  // Text block
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  
  // Headline/Subheadline
  fontWeight?: string;
  
  // List
  listStyle?: 'bullets' | 'numbers' | 'check' | 'arrow' | 'star' | 'heart';
  showListIcons?: boolean;
  listIconColor?: string;
  
  // Button
  backgroundColor?: string;
  textColor?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  link?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string | string[]; // string for most, string[] for lists
  config: BlockConfig;
}

export interface Session {
  id: string;
  title: string;
  blocks: Block[];
}

export type CopyType = 'landing_page' | 'anuncio' | 'vsl' | 'email' | 'webinar' | 'conteudo' | 'mensagem' | 'outro';

export interface Copy {
  id: string;
  workspace_id: string;
  title: string;
  copy_type?: CopyType;
  sessions: Session[];
  status?: 'draft' | 'published';
  is_template?: boolean;
  is_public?: boolean;
  public_password?: string | null;
  show_in_discover?: boolean;
  copy_count?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}
