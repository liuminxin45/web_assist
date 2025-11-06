#!/usr/bin/env node

/**
 * 清理脚本：清空整个项目的所有缓存和编译中间产物
 * 支持清理以下内容：
 * - 所有node_modules目录
 * - 构建输出目录（dist, build, out）
 * - TypeScript编译中间文件
 * - 各类缓存文件和临时文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保脚本在项目根目录运行
const projectRoot = path.resolve(__dirname, '..');
console.log(`正在清理项目: ${projectRoot}`);

// 要清理的目录列表
const directoriesToRemove = [
  'node_modules',
  'dist',
  'build',
  'out',
  '.pnpm-store',
  '.npm',
  '.yarn',
  '.rush',
  '.cache',
  '.idea',
  'coverage',
  '.nyc_output'
];

// 要清理的文件列表（使用通配符）
const filePatternsToRemove = [
  '*.tsbuildinfo',
  '.yarn-integrity',
  '*.swp',
  '*.swo',
  '*.log',
  '*.tmp',
  '*.temp'
];

// 清理函数
function cleanProject() {
  try {
    console.log('开始清理项目缓存和编译产物...');
    
    // 1. 首先清理根目录的node_modules
    const rootNodeModules = path.join(projectRoot, 'node_modules');
    if (fs.existsSync(rootNodeModules)) {
      console.log(`清理根目录 node_modules: ${rootNodeModules}`);
      removeDirectory(rootNodeModules);
    }
    
    // 2. 遍历所有子目录，清理指定的目录
    console.log('清理所有子目录中的指定目录...');
    const directoriesToClean = directoriesToRemove.filter(dir => dir !== 'node_modules');
    
    // 使用简化的PowerShell命令处理每个目录
    directoriesToClean.forEach(dir => {
      try {
        const simpleDirCommand = `Get-ChildItem -Path "${projectRoot}" -Directory -Recurse -Name "${dir}" | ForEach-Object { 
          $fullPath = Join-Path "${projectRoot}" $_; 
          Write-Host "删除: $fullPath"; 
          Remove-Item -Path $fullPath -Recurse -Force 
        }`;
        execSync(`powershell -Command "${simpleDirCommand.replace(/[\r\n]/g, ' ')}"`, { shell: true });
      } catch (error) {
        console.log(`处理目录 ${dir} 时出错，但继续执行...`);
      }
    });
    
    // 3. 清理文件
    console.log('清理指定的文件模式...');
    filePatternsToRemove.forEach(pattern => {
      try {
        const simpleFileCommand = `Get-ChildItem -Path "${projectRoot}" -File -Recurse -Include "${pattern}" | ForEach-Object { 
          Write-Host "删除文件: $($_.FullName)"; 
          Remove-Item -Path $_.FullName -Force 
        }`;
        execSync(`powershell -Command "${simpleFileCommand.replace(/[\r\n]/g, ' ')}"`, { shell: true });
      } catch (error) {
        console.log(`处理文件模式 ${pattern} 时出错，但继续执行...`);
      }
    });
    
    // 4. 备用方案：手动遍历关键目录进行清理
    const importantDirs = ['apps', 'packages'];
    importantDirs.forEach(dir => {
      const fullDir = path.join(projectRoot, dir);
      if (fs.existsSync(fullDir)) {
        console.log(`手动清理 ${fullDir} 中的关键目录...`);
        const subdirs = fs.readdirSync(fullDir).filter(item => {
          const itemPath = path.join(fullDir, item);
          return fs.statSync(itemPath).isDirectory();
        });
        
        subdirs.forEach(subdir => {
          directoriesToRemove.forEach(target => {
            const targetPath = path.join(fullDir, subdir, target);
            if (fs.existsSync(targetPath)) {
              console.log(`手动删除: ${targetPath}`);
              try {
                removeDirectory(targetPath);
              } catch (e) {
                console.log(`删除 ${targetPath} 失败: ${e.message}`);
              }
            }
          });
        });
      }
    });
    
    console.log('\n✅ 项目清理完成！');
    console.log('\n提示：清理完成后，您需要重新运行 `pnpm install` 安装依赖。');
  } catch (error) {
    console.error('❌ 清理过程中出现严重错误:', error.message);
    process.exit(1);
  }
}

// 删除目录的辅助函数
function removeDirectory(dirPath) {
  try {
    // 使用Windows的rmdir命令，添加/s/q参数进行静默递归删除
    execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit', shell: true });
  } catch (error) {
    console.log(`使用rmdir命令删除失败，尝试使用fs模块: ${error.message}`);
    try {
      // 备用方案：使用fs模块
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.log(`使用fs模块删除也失败: ${e.message}`);
    }
  }
}

// 执行清理
cleanProject();
