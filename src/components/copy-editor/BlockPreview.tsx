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
        return (
          <div className={getTextAlignClass()}>
            <button 
              className={`
                px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium
                ${block.config?.buttonSize === 'sm' ? 'text-sm px-4 py-1.5' : ''}
                ${block.config?.buttonSize === 'lg' ? 'text-lg px-8 py-3' : ''}
              `}
              disabled
            >
              {typeof block.content === 'string' ? block.content : ''}
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
