import { Block } from '@/types/copy-editor';
import { Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus } from 'phosphor-react';

interface BlockPreviewProps {
  block: Block;
}

export const BlockPreview = ({ block }: BlockPreviewProps) => {
  const getFontSizeClass = () => {
    switch (block.config?.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const getTextAlignClass = () => {
    switch (block.config?.textAlign) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  const getFontWeightClass = () => {
    switch (block.config?.fontWeight) {
      case 'normal':
        return 'font-normal';
      case 'semibold':
        return 'font-semibold';
      case 'extrabold':
        return 'font-extrabold';
      default:
        return 'font-bold';
    }
  };

  const renderContent = () => {
    switch (block.type) {
      case 'headline':
        return (
          <h2 
            className={`text-2xl ${getFontWeightClass()} ${getTextAlignClass()}`}
            dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }}
          />
        );

      case 'subheadline':
        return (
          <h3 
            className={`text-xl ${getFontWeightClass()} ${getTextAlignClass()}`}
            dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }}
          />
        );

      case 'text':
        return (
          <div 
            className={`${getFontSizeClass()} ${getTextAlignClass()}`}
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
              return <span style={iconStyle} className="font-medium">{index + 1}.</span>;
            case 'check':
              return <span style={iconStyle} className="text-lg">✓</span>;
            case 'arrow':
              return <span style={iconStyle} className="text-lg">→</span>;
            case 'star':
              return <span style={iconStyle} className="text-lg">★</span>;
            case 'heart':
              return <span style={iconStyle} className="text-lg">♥</span>;
            default:
              return <span style={iconStyle}>•</span>;
          }
        };

        return (
          <ul className={`space-y-1 ${showIcons ? 'pl-4' : ''} ${getTextAlignClass()}`}>
            {items.map((item, index) => (
              <li key={index} className="flex gap-2">
                {getListIcon(index)}
                <span>{item}</span>
              </li>
            ))}
          </ul>
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
              return 'text-center';
            case 'right':
              return 'text-right';
            default:
              return 'text-left';
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
          <div className={getButtonAlignClass()}>
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
            <div className={`${getImageSizeClass()} w-full mx-auto`}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageDescription || 'Imagem'}
                  className={`w-full h-full object-cover ${getAspectRatioClass()} ${
                    roundedBorders ? 'rounded-lg' : ''
                  }`}
                />
              ) : (
                <div
                  className={`w-full ${getAspectRatioClass()} bg-muted flex items-center justify-center ${
                    roundedBorders ? 'rounded-lg' : ''
                  }`}
                >
                  <span className="text-muted-foreground text-sm">Sem imagem</span>
                </div>
              )}
            </div>
            {imageDescription && (
              <p className="text-sm text-muted-foreground text-center">{imageDescription}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-3 rounded-lg border bg-background/50">
      {renderContent()}
    </div>
  );
};
