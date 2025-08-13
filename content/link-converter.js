/**
 * 链接转换模块
 * 处理相对链接转换为绝对链接
 */

const { extractAndInlineStyles } = require('./style-extractor');

// 链接转换统计信息
function createLinkStats() {
  return {
    totalImages: 0,
    totalLinks: 0,
    convertedImages: 0,
    convertedLinks: 0,
    hasBackgroundImages: false,
    styledElements: 0,
    pseudoElements: 0,
    animatedElements: 0,
    hasKeyframes: false
  };
}

// 检查URL是否需要转换
function needsConversion(url) {
  return url && 
         !url.startsWith('http') && 
         !url.startsWith('data:') && 
         !url.startsWith('//') && 
         !url.startsWith('mailto:') && 
         !url.startsWith('tel:') && 
         !url.startsWith('#') && 
         !url.startsWith('javascript:');
}

// 安全地转换URL
function convertUrl(url, currentPath, context = '') {
  try {
    return new URL(url, currentPath).href;
  } catch (e) {
    console.warn(`无法转换${context}:`, url, e);
    return url; // 返回原始URL
  }
}

// 处理相对链接转绝对链接的主函数
function convertRelativeToAbsolute(element) {
  const clone = element.cloneNode(true);
  const currentPath = window.location.href;
  const linkStats = createLinkStats();
  
  // 先提取并内联样式
  console.log('🎨 开始提取样式...');
  const styleResult = extractAndInlineStyles(element, clone);
  
  // 合并样式统计信息
  Object.assign(linkStats, styleResult.stats);
  
  // 然后处理链接转换
  console.log('🔗 开始转换链接...');
  
  // 单次遍历处理所有元素
  const elementsToProcess = [clone, ...clone.querySelectorAll('*')];
  elementsToProcess.forEach(el => {
    // 处理 img 标签的 src 属性
    if (el.tagName === 'IMG') {
      linkStats.totalImages++;
      const src = el.getAttribute('src');
      if (needsConversion(src)) {
        el.setAttribute('src', convertUrl(src, currentPath, 'img src'));
        linkStats.convertedImages++;
      }
    }
    
    // 处理 a 标签的 href 属性
    if (el.tagName === 'A') {
      linkStats.totalLinks++;
      const href = el.getAttribute('href');
      if (needsConversion(href)) {
        el.setAttribute('href', convertUrl(href, currentPath, 'a href'));
        linkStats.convertedLinks++;
      }
    }
    
    // 处理 CSS 背景图片
    const style = el.getAttribute('style');
    if (style && style.includes('url(')) {
      linkStats.hasBackgroundImages = true;
      const updatedStyle = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
        if (needsConversion(url)) {
          const absoluteUrl = convertUrl(url, currentPath, 'CSS background');
          return `url('${absoluteUrl}')`;
        }
        return match;
      });
      el.setAttribute('style', updatedStyle);
    }
    
    // 处理其他URL属性
    const urlAttributes = ['srcset', 'data-src', 'data-original', 'data-lazy'];
    urlAttributes.forEach(attr => {
      const value = el.getAttribute(attr);
      if (needsConversion(value)) {
        if (attr === 'srcset') {
          // 处理srcset可能包含多个URL的情况
          const srcsetValue = value.replace(/(\S+)(\s+\S+)?/g, (match, url, descriptor) => {
            if (needsConversion(url)) {
              const absoluteUrl = convertUrl(url, currentPath, `srcset ${attr}`);
              return absoluteUrl + (descriptor || '');
            }
            return match;
          });
          el.setAttribute(attr, srcsetValue);
        } else {
          el.setAttribute(attr, convertUrl(value, currentPath, attr));
        }
      }
    });
  });
  
  console.log('🔗 链接转换完成:', {
    totalImages: linkStats.totalImages,
    convertedImages: linkStats.convertedImages,
    totalLinks: linkStats.totalLinks,
    convertedLinks: linkStats.convertedLinks,
    hasBackgroundImages: linkStats.hasBackgroundImages
  });
  
  return {
    element: clone,
    html: styleResult.html,
    linkStats: linkStats
  };
}

module.exports = {
  convertRelativeToAbsolute,
  needsConversion,
  convertUrl,
  createLinkStats
};
