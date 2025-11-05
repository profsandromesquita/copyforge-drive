import { Block } from '@/types/copy-editor';

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
        const buttonBgColor = block.config?.backgroundColor || '#ff6b35';
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

        return (
          <div className={getButtonAlignClass()}>
            <button 
              style={{
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
              }}
              className={`
                ${getButtonSizeClass()}
                ${buttonRounded ? 'rounded-lg' : 'rounded-none'}
                font-medium transition-all hover:opacity-90
                inline-flex items-center gap-2 flex-col sm:flex-row
              `}
              disabled
            >
              <span className="flex items-center gap-2">
                {buttonIcon && <span>{buttonIcon}</span>}
                {typeof block.content === 'string' ? block.content : 'Botão'}
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
