export type BlockType = 'text' | 'headline' | 'subheadline' | 'list' | 'button';

export interface BlockConfig {
  // Text block
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  
  // Headline/Subheadline
  fontWeight?: string;
  
  // List
  listStyle?: 'bullets' | 'numbers';
  
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

export interface Copy {
  id: string;
  workspace_id: string;
  title: string;
  sessions: Session[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
