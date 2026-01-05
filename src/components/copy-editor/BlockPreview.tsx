import { memo, useMemo } from 'react';
import { Block } from '@/types/copy-editor';
import { Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus } from 'phosphor-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BlockPreviewProps {
  block: Block;
}

// Funções puras extraídas para evitar recriação a cada render
const computeFontSizeClass = (type: string, fontSize: string = 'medium'): string => {
  switch (type) {
    case 'headline':
      switch (fontSize) {
        case 'small': return 'text-xl';
        case 'large': return 'text-3xl';
        default: return 'text-2xl';
      }
    case 'subheadline':
      switch (fontSize) {
        case 'small': return 'text-lg';
        case 'large': return 'text-2xl';
        default: return 'text-xl';
      }
    default:
      switch (fontSize) {
        case 'small': return 'text-sm';
        case 'large': return 'text-lg';
        default: return 'text-base';
      }
  }
};

const computeTextAlignClass = (textAlign?: string): string => {
  switch (textAlign) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    case 'justify': return 'text-justify';
    default: return 'text-left';
  }
};

const computeListAlignmentClass = (textAlign?: string): string => {
  switch (textAlign) {
    case 'center': return 'justify-center';
    case 'right': return 'justify-end';
    default: return 'justify-start';
  }
};

const computeFontWeightClass = (fontWeight?: string, blockType?: string): string => {
  switch (fontWeight) {
    case 'normal': return 'font-normal';
    case 'semibold': return 'font-semibold';
    case 'extrabold': return 'font-extrabold';
    default: return blockType === 'headline' ? 'font-bold' : 'font-semibold';
  }
};

export const BlockPreview = memo(({ block }: BlockPreviewProps) => {
  // Memoizar cálculos de classes CSS baseados nas dependências relevantes
  const fontSizeClass = useMemo(
    () => computeFontSizeClass(block.type, block.config?.fontSize),
    [block.type, block.config?.fontSize]
  );

  const textAlignClass = useMemo(
    () => computeTextAlignClass(block.config?.textAlign),
    [block.config?.textAlign]
  );

  const listAlignmentClass = useMemo(
    () => computeListAlignmentClass(block.config?.textAlign),
    [block.config?.textAlign]
  );

  const fontWeightClass = useMemo(
    () => computeFontWeightClass(block.config?.fontWeight, block.type),
    [block.config?.fontWeight, block.type]
  );

  const renderContent = () => {
    switch (block.type) {
      case 'headline':
        return (
          <div 
            className={`${fontSizeClass} ${textAlignClass} ${fontWeightClass}`}
            dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }}
          />
        );

      case 'subheadline':
        return (
          <div 
            className={`${fontSizeClass} ${textAlignClass} ${fontWeightClass}`}
            dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }}
          />
        );

      case 'text':
        return (
          <div 
            className={`${fontSizeClass} ${textAlignClass}`}
            dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }}
          />
        );

      case 'list':
        const items = Array.isArray(block.content) ? block.content : [];
        const listIconColor = block.config?.listIconColor || '#ff6b35';
        const showIcons = block.config?.showListIcons !== false;
        
        const getListIcon = (index: number) => {
          if (!showIcons) return null;
          
          const iconStyle = { color: listIconColor };
          
          switch (block.config?.listStyle) {
            case 'numbers':
              return <span style={iconStyle} className="font-medium mt-2">{index + 1}.</span>;
            case 'check':
              return <span style={iconStyle} className="text-lg mt-2">✓</span>;
            case 'arrow':
              return <span style={iconStyle} className="text-lg mt-2">→</span>;
            case 'star':
              return <span style={iconStyle} className="text-lg mt-2">★</span>;
            case 'heart':
              return <span style={iconStyle} className="text-lg mt-2">♥</span>;
            default:
              return <span style={iconStyle} className="mt-2">•</span>;
          }
        };

        return (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className={`flex gap-2 ${listAlignmentClass}`}>
                {getListIcon(index)}
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        );

      case 'button':
        const buttonBgColor = block.config?.backgroundColor || '#22c55e';
        const buttonTextColor = block.config?.textColor || '#ffffff';
        const buttonAlign = block.config?.textAlign || 'left';
        const buttonSubtitle = block.config?.buttonSubtitle;
        const buttonRounded = block.config?.buttonRounded !== false;
        const buttonIcon = block.config?.buttonIcon;
        
        const getButtonAlignClass = () => {
          switch (buttonAlign) {
            case 'center':
              return 'justify-center';
            case 'right':
              return 'justify-end';
            default:
              return 'justify-start';
          }
        };

        const getButtonSizeClass = () => {
          switch (block.config?.buttonSize) {
            case 'sm':
              return 'text-sm px-4 py-2';
            case 'lg':
              return 'text-lg px-8 py-4';
            default:
              return 'text-base px-6 py-3';
          }
        };

        const renderButtonIcon = () => {
          const iconSize = block.config?.buttonSize === 'sm' ? 16 : block.config?.buttonSize === 'lg' ? 24 : 20;
          switch (buttonIcon) {
            case 'check':
              return <Check size={iconSize} weight="bold" />;
            case 'arrow-right':
              return <ArrowRight size={iconSize} weight="bold" />;
            case 'star':
              return <Star size={iconSize} weight="fill" />;
            case 'heart':
              return <Heart size={iconSize} weight="fill" />;
            case 'download':
              return <DownloadSimple size={iconSize} weight="bold" />;
            case 'play':
              return <Play size={iconSize} weight="fill" />;
            case 'shopping-cart':
              return <ShoppingCart size={iconSize} weight="bold" />;
            case 'plus':
              return <Plus size={iconSize} weight="bold" />;
            default:
              return null;
          }
        };

        return (
          <div className={`flex ${getButtonAlignClass()}`}>
            <button 
              style={{
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
              }}
              className={`
                ${getButtonSizeClass()}
                ${buttonRounded ? 'rounded-2xl' : 'rounded-none'}
                font-medium transition-all hover:opacity-90
                inline-flex flex-col items-center justify-center gap-1
              `}
              disabled
            >
              <span className="flex items-center gap-2">
                {renderButtonIcon()}
                <span>{typeof block.content === 'string' ? block.content : 'Botão'}</span>
              </span>
              {buttonSubtitle && (
                <span className="text-xs opacity-80 font-normal">
                  {buttonSubtitle}
                </span>
              )}
            </button>
          </div>
        );

      case 'form':
        const formTitle = block.config?.formTitle;
        const formButtonText = block.config?.formButtonText || 'Enviar';
        const formButtonColor = block.config?.formButtonColor || '#22c55e';
        const formFields = block.config?.formFields || [];
        const formAlign = block.config?.textAlign || 'left';

        const getFormAlignClass = () => {
          switch (formAlign) {
            case 'center':
              return 'items-center';
            case 'right':
              return 'items-end';
            default:
              return 'items-start';
          }
        };

        return (
          <div className={`flex flex-col ${getFormAlignClass()} space-y-4 max-w-md w-full`}>
            {formTitle && formTitle.trim() && (
              <h3 className="text-lg font-semibold">{formTitle}</h3>
            )}
            <form className="w-full space-y-3" onSubmit={(e) => e.preventDefault()}>
              {formFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    disabled
                  />
                </div>
              ))}
              {formFields.length > 0 && (
                <button
                  type="submit"
                  className="w-full px-6 py-2 rounded-md font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: formButtonColor }}
                  disabled
                >
                  {formButtonText}
                </button>
              )}
            </form>
          </div>
        );

      case 'image':
        const imageUrl = block.config?.imageUrl || '';
        const imageDescription = block.config?.imageDescription || '';
        const aspectRatio = block.config?.aspectRatio || '16:9';
        const imageSize = block.config?.imageSize || 'md';
        const roundedBorders = block.config?.roundedBorders !== false;
        
        const getImageSizeClass = () => {
          switch (imageSize) {
            case 'sm':
              return 'max-w-xs';
            case 'lg':
              return 'max-w-4xl';
            default:
              return 'max-w-2xl';
          }
        };

        const getAspectRatioClass = () => {
          const ratios: Record<string, string> = {
            '2:1': 'aspect-[2/1]',
            '16:9': 'aspect-[16/9]',
            '3:2': 'aspect-[3/2]',
            '14:10': 'aspect-[14/10]',
            '4:3': 'aspect-[4/3]',
            '5:4': 'aspect-[5/4]',
            '1:1': 'aspect-square',
            '4:5': 'aspect-[4/5]',
            '3:4': 'aspect-[3/4]',
            '10:14': 'aspect-[10/14]',
            '2:3': 'aspect-[2/3]',
            '6:10': 'aspect-[6/10]',
            '9:16': 'aspect-[9/16]',
            '1:2': 'aspect-[1/2]',
          };
          return ratios[aspectRatio] || 'aspect-[16/9]';
        };

        return (
          <div className="space-y-2">
            <div className={`${getImageSizeClass()} w-full mx-auto ${getAspectRatioClass()} overflow-hidden ${roundedBorders ? 'rounded-lg' : ''}`}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageDescription || 'Imagem'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Sem imagem</span>
                </div>
              )}
            </div>
            {imageDescription && (
              <p className="text-sm text-muted-foreground text-center">{imageDescription}</p>
            )}
          </div>
        );

      case 'video':
        const videoUrl = block.config?.videoUrl || '';
        const videoTitle = block.config?.videoTitle || '';
        const videoSize = block.config?.videoSize || 'md';
        
        const getVideoSizeClass = () => {
          switch (videoSize) {
            case 'sm':
              return 'max-w-xs';
            case 'lg':
              return 'max-w-4xl';
            default:
              return 'max-w-2xl';
          }
        };

        const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' | null => {
          if (!url) return null;
          
          // YouTube
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          if (youtubeRegex.test(url)) return 'youtube';
          
          // Vimeo
          const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
          if (vimeoRegex.test(url)) return 'vimeo';
          
          // Vídeo direto (Supabase Storage, URLs diretas de arquivo)
          const directVideoRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
          const supabaseStorageRegex = /supabase\.co\/storage/;
          if (directVideoRegex.test(url) || supabaseStorageRegex.test(url)) {
            return 'direct';
          }
          
          return null;
        };

        const getEmbedUrl = (url: string, type: 'youtube' | 'vimeo' | null) => {
          if (!url || !type) return null;
          
          if (type === 'youtube') {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : null;
          }
          
          if (type === 'vimeo') {
            const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            return match ? `https://player.vimeo.com/video/${match[1]}` : null;
          }
          
          return null;
        };

        const videoType = getVideoType(videoUrl);
        const embedUrl = videoType && videoType !== 'direct' ? getEmbedUrl(videoUrl, videoType) : null;

        return (
          <div className="space-y-2">
            <div className={`${getVideoSizeClass()} w-full mx-auto`}>
              {videoType === 'direct' ? (
                // Vídeo hospedado diretamente (Supabase Storage)
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={videoUrl}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                  >
                    Seu navegador não suporta reprodução de vídeo.
                  </video>
                </div>
              ) : embedUrl ? (
                // YouTube / Vimeo
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // Erro ou vazio
                <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <span className="text-muted-foreground text-sm">
                    {videoUrl ? 'URL de vídeo inválida' : 'Sem vídeo'}
                  </span>
                </div>
              )}
            </div>
            {videoTitle && (
              <p className="text-sm text-muted-foreground text-center">{videoTitle}</p>
            )}
          </div>
        );

      case 'audio':
        const audioUrl = block.config?.audioUrl || '';
        const audioTitle = block.config?.audioTitle || '';
        const audioArtist = block.config?.audioArtist || '';
        const showControls = block.config?.showControls !== false;
        const showWaveform = block.config?.showWaveform !== false;

        return (
          <div className="space-y-3 max-w-2xl mx-auto">
            {(audioTitle || audioArtist) && (
              <div className="text-center space-y-1">
                {audioTitle && <h4 className="font-semibold text-lg">{audioTitle}</h4>}
                {audioArtist && <p className="text-sm text-muted-foreground">{audioArtist}</p>}
              </div>
            )}
            {showWaveform && audioUrl && (
              <div className="flex items-center gap-1 h-16 px-4 bg-muted rounded-lg">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary rounded-full"
                    style={{ height: `${Math.random() * 60 + 20}%`, opacity: 0.7 }}
                  />
                ))}
              </div>
            )}
            {audioUrl ? (
              <audio src={audioUrl} controls={showControls} className="w-full" />
            ) : (
              <div className="w-full h-12 bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground text-sm">Sem áudio</span>
              </div>
            )}
          </div>
        );

      case 'faq':
        const faqTitle = block.config?.faqTitle || '';
        const showNumbering = block.config?.showNumbering !== false;
        const expandedByDefault = block.config?.expandedByDefault === true;
        const faqItems = block.config?.faqItems || [];
        const faqAlign = block.config?.textAlign || 'left';

        const getFaqAlignClass = () => {
          switch (faqAlign) {
            case 'center':
              return 'items-center text-center';
            case 'right':
              return 'items-end text-right';
            default:
              return 'items-start text-left';
          }
        };

        return (
          <div className={`space-y-4 max-w-3xl w-full flex flex-col ${getFaqAlignClass()}`}>
            {faqTitle && <h3 className="text-xl font-bold">{faqTitle}</h3>}
            {faqItems.length > 0 ? (
              <Accordion 
                type="single" 
                collapsible 
                className="w-full space-y-2"
                defaultValue={expandedByDefault ? faqItems[0]?.id : undefined}
              >
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={item.id} 
                    value={item.id}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="font-medium text-left">
                        {showNumbering && <span className="text-primary mr-2">{index + 1}.</span>}
                        {item.question || 'Pergunta'}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-muted-foreground">
                      {item.answer || 'Resposta'}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="w-full p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground text-sm">
                Sem perguntas
              </div>
            )}
          </div>
        );

      case 'testimonial':
        const testimonialTitle = block.config?.testimonialTitle || '';
        const showPhotos = block.config?.showPhotos !== false;
        const showRatings = block.config?.showRatings !== false;
        const testimonialItems = block.config?.testimonialItems || [];

        return (
          <div className="space-y-6 max-w-4xl w-full">
            {testimonialTitle && <h3 className="text-2xl font-bold text-center">{testimonialTitle}</h3>}
            {testimonialItems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {testimonialItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6 bg-card space-y-4">
                    <div className="flex items-start gap-4">
                      {showPhotos && item.photo && (
                        <img 
                          src={item.photo} 
                          alt={item.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{item.name || 'Cliente'}</h4>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        {showRatings && (
                          <div className="flex gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                size={16}
                                weight={i < item.rating ? 'fill' : 'regular'}
                                className={i < item.rating ? 'text-yellow-500' : 'text-muted-foreground'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground italic">"{item.text || 'Depoimento'}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground text-sm">
                Sem depoimentos
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 rounded-lg bg-card">
      {renderContent()}
    </div>
  );
});
