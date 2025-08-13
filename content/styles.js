/**
 * 样式定义模块
 * 包含所有CSS样式定义和样式相关常量
 */

// 高亮类名
const HIGHLIGHT_CLASS = 'dom-catcher-highlight';

// 重要样式属性列表 - 这些属性对视觉效果最重要
const IMPORTANT_STYLE_PROPERTIES = [
  // 布局相关
  'display', 'position', 'top', 'left', 'right', 'bottom',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-width', 'border-style', 'border-color',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
  'float', 'clear', 'z-index',
  
  // 字体和文本相关
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'line-height', 'text-align', 'text-decoration', 'text-transform',
  'text-indent', 'text-shadow', 'letter-spacing', 'word-spacing',
  'color', 'white-space', 'word-wrap', 'word-break',
  
  // 背景相关
  'background', 'background-color', 'background-image', 'background-repeat',
  'background-position', 'background-size', 'background-attachment',
  
  // 视觉效果
  'opacity', 'visibility', 'transform', 'transform-origin',
  'box-shadow', 'text-shadow', 'filter',
  
  // 弹性布局
  'flex', 'flex-direction', 'flex-wrap', 'flex-basis', 'flex-grow', 'flex-shrink',
  'justify-content', 'align-items', 'align-self', 'align-content',
  
  // 网格布局
  'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap',
  'grid-column', 'grid-row', 'grid-area'
];

// 创建并注入样式
function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px dashed #ff4444 !important;
      background-color: rgba(255, 68, 68, 0.1) !important;
      cursor: crosshair !important;
      position: relative !important;
    }
    
    .${HIGHLIGHT_CLASS}::before {
      content: "点击选择此元素";
      position: absolute;
      top: -25px;
      left: 0;
      background: #ff4444;
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 3px;
      z-index: 10000;
      pointer-events: none;
    }

    .dom-catcher-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
      white-space: pre-line;
    }
    .dom-catcher-notification.info { background: #2196f3; }
    .dom-catcher-notification.success { background: #4caf50; }
    .dom-catcher-notification.error { background: #f44336; }
  `;
  document.head.appendChild(style);
}

// 判断样式值是否有意义
function isSignificantStyleValue(property, value, element) {
  if (!value || value === 'none' || value === 'auto' || value === 'normal' || value === 'initial' || value === 'unset' || value === 'inherit') {
    return false;
  }
  
  // 针对不同属性的特殊处理
  const specialChecks = {
    'margin': () => value !== '0px',
    'padding': () => value !== '0px',
    'border': () => value !== '0px none rgb(0, 0, 0)' && value !== 'medium none currentcolor',
    'border-width': () => value !== '0px',
    'border-radius': () => value !== '0px',
    'background': () => !value.includes('rgba(0, 0, 0, 0)') && value !== 'none',
    'background-color': () => !value.includes('rgba(0, 0, 0, 0)'),
    'background-image': () => value !== 'none',
    'transform': () => value !== 'none' && value !== 'matrix(1, 0, 0, 1, 0, 0)',
    'box-shadow': () => value !== 'none',
    'text-shadow': () => value !== 'none',
    'opacity': () => value !== '1',
    'z-index': () => value !== 'auto',
    'display': (() => {
      // 对于特殊元素，display: block 可能不重要
      if (element.tagName === 'DIV' && value === 'block') return false;
      if (element.tagName === 'SPAN' && value === 'inline') return false;
      return true;
    })()
  };
  
  const checker = specialChecks[property];
  return checker ? checker() : true;
}

module.exports = {
  HIGHLIGHT_CLASS,
  IMPORTANT_STYLE_PROPERTIES,
  injectStyles,
  isSignificantStyleValue
};
