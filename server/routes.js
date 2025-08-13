/**
 * Express 路由处理模块
 * 定义所有 API 端点和路由逻辑
 */

const express = require('express');
const path = require('path');
const { saveFiles, getFileDetails } = require('./file-handler');

const router = express.Router();

// DOM接收处理路由
function createReceiveDomRoute(outputDir) {
  return async (req, res) => {
    try {
      const { html, info } = req.body;

      if (!html) {
        return res.status(400).send('没有收到 HTML 数据。');
      }

      // 保存文件
      const result = await saveFiles(outputDir, html, info);
      
      const logInfo = {
        timestamp: new Date().toISOString(),
        htmlFilename: result.htmlFilename,
        markdownFilename: result.markdownFilename,
        elementInfo: info,
        success: true
      };

      // 动态获取 baseUrl，避免硬编码 localhost
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      console.log('✅ 成功保存元素 (HTML + Markdown):', logInfo);
      
      res.status(200).json({
        success: true,
        message: `成功保存文件: ${result.htmlFilename} 和 ${result.markdownFilename}`,
        files: {
          html: {
            filename: result.htmlFilename,
            filepath: result.htmlFilepath,
            viewUrl: `${baseUrl}/view/${result.htmlFilename}`
          },
          markdown: {
            filename: result.markdownFilename,
            filepath: result.markdownFilepath
          }
        }
      });
      
    } catch (error) {
      console.error('❌ 文件保存失败:', error);
      res.status(500).json({
        success: false,
        message: '文件保存失败',
        error: error.message
      });
    }
  };
}

// 状态检查路由
function createStatusRoute(outputDir) {
  return (req, res) => {
    res.json({
      status: 'running',
      message: 'DOM Catcher 本地服务运行中',
      timestamp: new Date().toISOString(),
      outputDir: outputDir
    });
  };
}

// 文件列表路由
function createFilesRoute(outputDir) {
  return async (req, res) => {
    try {
      const details = await getFileDetails(outputDir);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // 添加viewUrl到每个HTML文件
      const filesWithUrls = details.files.map(file => ({
        ...file,
        html: {
          ...file.html,
          viewUrl: `${baseUrl}/view/${file.html.name}`
        }
      }));
      
      res.json({
        success: true,
        count: details.files.length,
        htmlFiles: details.htmlFiles,
        markdownFiles: details.markdownFiles,
        files: filesWithUrls,
        baseUrl: baseUrl
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '无法获取文件列表',
        error: error.message
      });
    }
  };
}

// 文件管理界面路由
function createManageRoute() {
  return (req, res) => {
    // 使用静态 HTML 文件提供服务，提高代码可维护性
    const managePath = path.join(__dirname, '..', 'public', 'manage.html');
    res.sendFile(managePath, (err) => {
      if (err) {
        console.error('发送文件管理页面失败:', err);
        res.status(500).json({
          success: false,
          message: '无法加载文件管理页面',
          error: err.message
        });
      }
    });
  };
}

// 注册所有路由
function setupRoutes(app, outputDir) {
  // DOM 数据接收端点
  app.post('/receive-dom', createReceiveDomRoute(outputDir));
  
  // 状态检查端点
  app.get('/status', createStatusRoute(outputDir));
  
  // 文件列表端点
  app.get('/files', createFilesRoute(outputDir));
  
  // 文件管理界面
  app.get('/manage', createManageRoute());
  
  // 静态文件服务 - 查看保存的 HTML 文件
  app.use('/view', (req, res, next) => {
    // 设置严格的CSP策略，禁止执行任何脚本，防止XSS攻击
    res.setHeader('Content-Security-Policy', "script-src 'none'; object-src 'none';");
    next();
  }, express.static(outputDir));

  // 提供 public 目录的静态文件服务（用于管理界面等）
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));
}

module.exports = {
  setupRoutes,
  createReceiveDomRoute,
  createStatusRoute,
  createFilesRoute,
  createManageRoute
};
