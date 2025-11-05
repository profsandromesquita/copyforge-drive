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
