/**
 * 链接转换模块
 * 处理相对链接转换为绝对链接，样式提取和内联
 */

const { IMPORTANT_STYLE_PROPERTIES, isSignificantStyleValue } = require('./styles');

// 提取伪元素样式
function extractPseudoElementStyles(element, cloneElement) {
  try {
    const pseudoElements = ['::before', '::after'];
    let pseudoElementsCreated = 0;
    
    pseudoElements.forEach(pseudo => {
      try {
        const pseudoStyles = window.getComputedStyle(element, pseudo);
        const content = pseudoStyles.getPropertyValue('content');
        
        // 只有当伪元素有内容时才处理
        if (content && content !== 'none' && content !== 'normal' && content !== '""' && content !== "''" ) {
          const pseudoSpan = document.createElement('span');
          pseudoSpan.className = `pseudo-${pseudo.replace('::', '')}`;
          pseudoSpan.textContent = content.replace(/^["']|["']$/g, ''); // 移除引号
          
          // 提取伪元素的样式
          const pseudoProperties = [
            'display', 'position', 'top', 'left', 'right', 'bottom',
            'width', 'height', 'margin', 'padding', 'border',
            'background', 'color', 'font-size', 'font-weight',
            'text-decoration', 'opacity', 'z-index', 'transform',
            'box-shadow', 'border-radius'
          ];
          
          const pseudoInlineStyles = [];
          pseudoProperties.forEach(property => {
            const value = pseudoStyles.getPropertyValue(property);
            if (isSignificantStyleValue(property, value, element)) {
              pseudoInlineStyles.push(`${property}: ${value}`);
            }
          });
          
          if (pseudoInlineStyles.length > 0) {
            pseudoSpan.style.cssText = pseudoInlineStyles.join('; ');
          }
          
          // 插入伪元素
          if (pseudo === '::before') {
            cloneElement.insertBefore(pseudoSpan, cloneElement.firstChild);
          } else {
            cloneElement.appendChild(pseudoSpan);
          }
          
          pseudoElementsCreated++;
        }
      } catch (err) {
        console.warn(`处理伪元素 ${pseudo} 时出错:`, err);
      }
    });
    
    return pseudoElementsCreated;
  } catch (error) {
    console.warn('提取伪元素样式时出错:', error);
    return 0;
  }
}

// 提取CSS动画和过渡效果
function extractAnimationStyles(element) {
  try {
    const computedStyle = window.getComputedStyle(element);
    const animationStyles = [];
    
    // 动画相关属性
    const animationProperties = [
      'animation', 'animation-name', 'animation-duration', 
      'animation-timing-function', 'animation-delay', 
      'animation-iteration-count', 'animation-direction',
      'animation-fill-mode', 'animation-play-state',
      'transition', 'transition-property', 'transition-duration',
      'transition-timing-function', 'transition-delay'
    ];
    
    animationProperties.forEach(property => {
      const value = computedStyle.getPropertyValue(property);
      if (value && value !== 'none' && value !== 'all 0s ease 0s' && value !== '0s') {
        animationStyles.push(`${property}: ${value}`);
      }
    });
    
    return animationStyles;
  } catch (error) {
    console.warn('提取动画样式时出错:', error);
    return [];
  }
}

// 提取并生成CSS关键帧动画
function extractKeyframes() {
  try {
    const styleSheets = Array.from(document.styleSheets);
    const keyframes = [];
    
    styleSheets.forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes.push(rule.cssText);
            }
          });
        }
      } catch (e) {
        // 跨域样式表可能无法访问，跳过
        console.warn('无法访问样式表:', e);
      }
    });
    
    return keyframes;
  } catch (error) {
    console.warn('提取关键帧动画时出错:', error);
    return [];
  }
}

// 提取并内联样式到元素
function extractAndInlineStyles(element, clone) {
  try {
    const elementsToProcess = [element, ...element.querySelectorAll('*')];
    const cloneElementsToProcess = [clone, ...clone.querySelectorAll('*')];
    let processedCount = 0;
    let pseudoElementsCount = 0;
    let animatedElementsCount = 0;
    
    // 首先提取页面中的关键帧动画
    const keyframes = extractKeyframes();
    let extractedKeyframes = '';
    
    if (keyframes.length > 0) {
      extractedKeyframes = `<style>\n${keyframes.join('\n')}\n</style>\n`;
      console.log(`🎬 提取了 ${keyframes.length} 个关键帧动画`);
    }
    
    elementsToProcess.forEach((el, index) => {
      try {
        const cloneEl = cloneElementsToProcess[index];
        // 获取计算后的样式
        const computedStyle = window.getComputedStyle(el);
        const inlineStyles = [];
        
        // 遍历重要样式属性
        IMPORTANT_STYLE_PROPERTIES.forEach(property => {
          const value = computedStyle.getPropertyValue(property);
          if (isSignificantStyleValue(property, value, el)) {
            inlineStyles.push(`${property}: ${value}`);
          }
        });
        
        // 提取动画样式
        const animationStyles = extractAnimationStyles(el);
        if (animationStyles.length > 0) {
          inlineStyles.push(...animationStyles);
          animatedElementsCount++;
        }
        
        // 应用内联样式
        if (inlineStyles.length > 0) {
          const styleString = inlineStyles.join('; ');
          cloneEl.style.cssText = styleString;
          processedCount++;
        }
        
        // 处理伪元素
        const pseudoCount = extractPseudoElementStyles(el, cloneEl);
        pseudoElementsCount += pseudoCount;
        
        // 删除 class 和 id 属性
        cloneEl.removeAttribute('class');
        cloneEl.removeAttribute('id');
        
      } catch (err) {
        console.warn(`处理元素样式时出错:`, err);
      }
    });
    
    console.log(`🎨 样式提取完成:`, {
      processedElements: processedCount,
      pseudoElements: pseudoElementsCount,
      animatedElements: animatedElementsCount
    });
    
    return {
      html: extractedKeyframes + clone.outerHTML,
      stats: {
        styledElements: processedCount,
        pseudoElements: pseudoElementsCount,
        animatedElements: animatedElementsCount,
        hasKeyframes: keyframes.length > 0
      }
    };
    
  } catch (error) {
    console.error('提取并内联样式时发生错误:', error);
    return {
      html: clone.outerHTML,
      stats: {
        styledElements: 0,
        pseudoElements: 0,
        animatedElements: 0,
        hasKeyframes: false
      }
    };
  }
}

module.exports = {
  extractPseudoElementStyles,
  extractAnimationStyles,
  extractKeyframes,
  extractAndInlineStyles
};
