document.getElementById('startSelection').addEventListener('click', async () => {
  // 获取当前激活的标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    try {
      // 向该标签页注入我们的内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (err) {
      console.error(`Failed to inject content script: ${err}`);
    }
  }

  // 关闭 popup 窗口
  window.close();
});
