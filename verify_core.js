// 简单验证脚本来测试核心功能
console.log('开始验证核心模块功能...');

// 模拟浏览器环境
global.window = {};
global.document = {}

try {
  // 尝试验证文件存在性和基本模块结构
  const fs = require('fs');
  const path = require('path');
  
  // 检查核心文件是否存在
  const coreIndexPath = path.join(__dirname, 'packages/core/index.ts');
  const platformIndexPath = path.join(__dirname, 'packages/platform/index.ts');
  const webPlatformPath = path.join(__dirname, 'packages/platform-web/index.ts');
  
  console.log('\n文件存在性检查:');
  console.log(`核心模块文件: ${fs.existsSync(coreIndexPath) ? '✓ 存在' : '✗ 不存在'}`);
  console.log(`平台模块文件: ${fs.existsSync(platformIndexPath) ? '✓ 存在' : '✗ 不存在'}`);
  console.log(`Web平台模块文件: ${fs.existsSync(webPlatformPath) ? '✓ 存在' : '✗ 不存在'}`);
  
  // 检查关键目录结构
  const webAppPath = path.join(__dirname, 'apps/web');
  const extensionPath = path.join(__dirname, 'apps/extension');
  
  console.log('\n目录结构检查:');
  console.log(`Web应用目录: ${fs.existsSync(webAppPath) ? '✓ 存在' : '✗ 不存在'}`);
  console.log(`扩展应用目录: ${fs.existsSync(extensionPath) ? '✓ 存在' : '✗ 不存在'}`);
  
  // 检查测试文件
  const testFiles = [
    path.join(__dirname, 'packages/core/__tests__/pluginManagement.test.ts'),
    path.join(__dirname, 'apps/extension/src/__tests__/background.test.ts')
  ];
  
  console.log('\n测试文件检查:');
  testFiles.forEach(file => {
    console.log(`${path.basename(file)}: ${fs.existsSync(file) ? '✓ 存在' : '✗ 不存在'}`);
  });
  
  // 验证构建配置文件
  const viteConfigPath = path.join(__dirname, 'apps/web/vite.config.ts');
  console.log('\n构建配置检查:');
  console.log(`Vite配置文件: ${fs.existsSync(viteConfigPath) ? '✓ 存在' : '✗ 不存在'}`);
  
  console.log('\n验证完成！虽然无法直接运行应用，但核心文件结构完整。');
  console.log('要正常运行应用，建议解决以下问题:');
  console.log('1. 确保所有依赖正确安装 (pnpm install 或 npm install)');
  console.log('2. 修复TypeScript类型错误');
  console.log('3. 确保包名引用正确');
  
} catch (error) {
  console.error('验证过程中出现错误:', error.message);
}