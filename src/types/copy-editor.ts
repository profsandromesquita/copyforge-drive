export type BlockType = 'text' | 'headline' | 'subheadline' | 'list' | 'button' | 'form' | 'image' | 'video' | 'audio' | 'faq' | 'testimonial';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  description: string;
  text: string;
  rating: number;
  photo?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone';
  label: string;
  placeholder: string;
  required: boolean;
}

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
  buttonSubtitle?: string;
  buttonRounded?: boolean;
  buttonIcon?: 'none' | 'check' | 'arrow-right' | 'star' | 'heart' | 'download' | 'play' | 'shopping-cart' | 'plus';
  
  // Form
  formTitle?: string;
  formButtonText?: string;
  formButtonColor?: string;
  formFields?: FormField[];
  
  // Image
  imageUrl?: string;
  imageDescription?: string;
  aspectRatio?: string;
  imageSize?: 'sm' | 'md' | 'lg';
  roundedBorders?: boolean;
  
  // Video
  videoUrl?: string;
  videoTitle?: string;
  videoSize?: 'sm' | 'md' | 'lg';
  
  // Audio
  audioUrl?: string;
  audioTitle?: string;
  audioArtist?: string;
  showControls?: boolean;
  showWaveform?: boolean;
  
  // FAQ
  faqTitle?: string;
  showNumbering?: boolean;
  expandedByDefault?: boolean;
  faqItems?: FAQItem[];
  
  // Testimonial
  testimonialTitle?: string;
  showPhotos?: boolean;
  showRatings?: boolean;
  testimonialItems?: TestimonialItem[];
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
