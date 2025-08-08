document.getElementById('startSelection').addEventListener('click', () => {
  // 获取当前激活的标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // 向该标签页注入我们的内容脚本
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js']
    }).then(() => {
      console.log('Content script injected successfully');
    }).catch((error) => {
      console.error('Failed to inject content script:', error);
    });
    
    // 关闭 popup 窗口
    window.close();
  });
});
