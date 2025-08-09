const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// OAuth2 配置
const SCOPES = ['https://www.googleapis.com/auth/chromewebstore'];
const REDIRECT_URI = 'http://localhost:8080/callback';

class ChromeWebStoreAuthSetup {
  constructor() {
    this.oauth2Client = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(prompt) {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  async setup() {
    console.log('🚀 Chrome Web Store API 认证配置向导');
    console.log('=====================================\n');

    try {
      await this.getOAuthCredentials();
      await this.getAuthorizationCode();
      await this.getTokens();
      await this.getExtensionId();
      await this.saveConfiguration();
      
      console.log('\n✅ 配置完成！');
      console.log('📝 请将生成的 Secrets 添加到你的 GitHub 仓库中。');
      
    } catch (error) {
      console.error('❌ 配置过程中出现错误：', error.message);
    } finally {
      this.rl.close();
    }
  }

  async getOAuthCredentials() {
    console.log('📋 步骤 1: 获取 OAuth2 凭据');
    console.log('请先在 Google Cloud Console 中完成以下步骤：');
    console.log('1. 创建项目或选择现有项目');
    console.log('2. 启用 Chrome Web Store API');
    console.log('3. 创建 OAuth2 凭据（应用类型选择"桌面应用程序"）');
    console.log('4. 下载凭据 JSON 文件\n');

    const credentialsPath = await this.question('请输入凭据文件路径（或直接拖拽文件到此处）: ');
    
    try {
      const credentialsContent = await fs.readFile(credentialsPath.trim().replace(/'/g, ''), 'utf8');
      const credentials = JSON.parse(credentialsContent);
      
      this.clientId = credentials.installed.client_id;
      this.clientSecret = credentials.installed.client_secret;
      
      console.log('✅ OAuth2 凭据读取成功\n');
      
    } catch (error) {
      throw new Error('无法读取凭据文件，请检查文件路径是否正确');
    }
  }

  async getAuthorizationCode() {
    console.log('📋 步骤 2: 获取授权码');
    
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      REDIRECT_URI
    );

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // 强制显示同意屏幕以获取刷新令牌
    });

    console.log('🔗 请访问以下链接完成授权：');
    console.log(authUrl);
    console.log('\n授权后，你将被重定向到一个错误页面，这是正常的。');
    console.log('请从地址栏复制 "code=" 参数的值。\n');

    this.authCode = await this.question('请输入授权码: ');
    console.log('✅ 授权码获取成功\n');
  }

  async getTokens() {
    console.log('📋 步骤 3: 获取访问令牌');

    try {
      const { tokens } = await this.oauth2Client.getToken(this.authCode);
      this.tokens = tokens;
      
      console.log('✅ 访问令牌获取成功');
      console.log(`   刷新令牌: ${tokens.refresh_token ? '已获取' : '未获取'}\n`);
      
      if (!tokens.refresh_token) {
        console.log('⚠️  警告: 未获取到刷新令牌。这可能是因为：');
        console.log('   1. 之前已经获取过刷新令牌');
        console.log('   2. OAuth2 配置问题');
        console.log('   解决方案: 撤销应用授权后重新授权\n');
      }
      
    } catch (error) {
      throw new Error('无法获取访问令牌: ' + error.message);
    }
  }

  async getExtensionId() {
    console.log('📋 步骤 4: 获取扩展 ID');
    console.log('请在 Chrome Web Store Developer Dashboard 中找到你的扩展 ID。');
    console.log('扩展 ID 是一个 32 位的字符串，形如: abcdefghijklmnopqrstuvwxyz123456\n');

    this.extensionId = await this.question('请输入扩展 ID: ');
    
    if (!/^[a-z]{32}$/.test(this.extensionId)) {
      console.log('⚠️  警告: 扩展 ID 格式可能不正确');
      const confirm = await this.question('是否继续？(y/N): ');
      if (confirm.toLowerCase() !== 'y') {
        throw new Error('用户取消操作');
      }
    }
    
    console.log('✅ 扩展 ID 设置成功\n');
  }

  async saveConfiguration() {
    console.log('📋 步骤 5: 保存配置');

    // 生成配置对象
    const config = {
      google: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.tokens.refresh_token,
        access_token: this.tokens.access_token
      },
      extension: {
        id: this.extensionId
      },
      generated_at: new Date().toISOString()
    };

    // 保存到文件（用于备份，不要提交到版本控制）
    await fs.writeFile(
      path.join(__dirname, '../auth-config.json'),
      JSON.stringify(config, null, 2)
    );

    // 创建环境变量示例文件
    const envExample = `# Chrome Web Store API 配置
# 将这些值添加到你的 GitHub Secrets 中

GOOGLE_CLIENT_ID=${this.clientId}
GOOGLE_CLIENT_SECRET=${this.clientSecret}
GOOGLE_REFRESH_TOKEN=${this.tokens.refresh_token || 'YOUR_REFRESH_TOKEN'}
EXTENSION_ID=${this.extensionId}

# 注意：不要将此文件提交到版本控制系统！
`;

    await fs.writeFile(
      path.join(__dirname, '../.env.example'),
      envExample
    );

    console.log('✅ 配置文件已保存\n');
    
    // 显示需要添加到 GitHub Secrets 的信息
    console.log('📝 请将以下 Secrets 添加到你的 GitHub 仓库：');
    console.log('=====================================');
    console.log(`GOOGLE_CLIENT_ID: ${this.clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET: ${this.clientSecret}`);
    console.log(`GOOGLE_REFRESH_TOKEN: ${this.tokens.refresh_token || 'YOUR_REFRESH_TOKEN'}`);
    console.log(`EXTENSION_ID: ${this.extensionId}`);
    console.log('=====================================\n');

    if (!this.tokens.refresh_token) {
      console.log('⚠️  重要提醒：');
      console.log('由于未获取到刷新令牌，你需要：');
      console.log('1. 在 Google Cloud Console 中撤销应用的授权');
      console.log('2. 重新运行此脚本');
      console.log('3. 或者手动获取刷新令牌\n');
    }

    console.log('🔗 有用的链接：');
    console.log(`• GitHub Secrets 设置: https://github.com/your-username/your-repo/settings/secrets/actions`);
    console.log(`• Chrome Web Store 开发者控制台: https://chrome.google.com/webstore/devconsole/`);
    console.log(`• Google Cloud Console: https://console.cloud.google.com/`);
  }
}

// 主程序
if (require.main === module) {
  const setup = new ChromeWebStoreAuthSetup();
  setup.setup().catch(console.error);
}

module.exports = ChromeWebStoreAuthSetup;
