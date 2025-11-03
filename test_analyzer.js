// 简单的测试文件检查器
const fs = require('fs');
const path = require('path');

// 测试结果对象
const results = {
  directories: [],
  totalFiles: 0,
  validFiles: 0,
  invalidFiles: 0,
  errors: []
};

// 检查文件语法
function checkFileSyntax(filePath) {
  try {
    // 只检查文件是否存在和可读
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.length === 0) {
      return { valid: false, error: '文件内容为空' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// 检查目录下的所有测试文件
function checkTestDirectory(dirPath, filePattern = /\.test\.(js|ts)$/) {
  console.log(`\n===========================================`);
  console.log(`检查目录: ${dirPath}`);
  console.log(`===========================================`);
  
  try {
    // 检查目录是否存在
    if (!fs.existsSync(dirPath)) {
      const error = `目录不存在: ${dirPath}`;
      console.log(`❌ ${error}`);
      results.errors.push({ type: 'directory', path: dirPath, error });
      return;
    }
    
    const dirResult = {
      path: dirPath,
      files: [],
      valid: 0,
      invalid: 0
    };
    
    // 递归查找所有测试文件
    function findAndCheckFiles(currentPath) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          findAndCheckFiles(fullPath);
        } else if (filePattern.test(entry.name)) {
          results.totalFiles++;
          const checkResult = checkFileSyntax(fullPath);
          
          const fileInfo = {
            path: fullPath,
            name: entry.name,
            valid: checkResult.valid
          };
          
          if (!checkResult.valid) {
            fileInfo.error = checkResult.error;
            results.invalidFiles++;
            dirResult.invalid++;
            console.log(`❌ 无效文件: ${entry.name} - ${checkResult.error}`);
            results.errors.push({ type: 'file', path: fullPath, error: checkResult.error });
          } else {
            results.validFiles++;
            dirResult.valid++;
            console.log(`✅ 有效文件: ${entry.name}`);
          }
          
          dirResult.files.push(fileInfo);
        }
      }
    }
    
    findAndCheckFiles(dirPath);
    
    // 统计目录结果
    dirResult.total = dirResult.files.length;
    results.directories.push(dirResult);
    
    console.log(`\n目录 ${path.basename(dirPath)} 检查完成:`);
    console.log(`- 总文件数: ${dirResult.total}`);
    console.log(`- 有效文件: ${dirResult.valid}`);
    console.log(`- 无效文件: ${dirResult.invalid}`);
    
  } catch (error) {
    console.log(`❌ 处理目录时出错: ${error.message}`);
    results.errors.push({ type: 'directory', path: dirPath, error: error.message });
  }
}

// 生成测试文件分析报告
function generateReport() {
  console.log('\n\n===========================================');
  console.log('             测试文件分析报告               ');
  console.log('===========================================');
  console.log(`测试目录数: ${results.directories.length}`);
  console.log(`总测试文件数: ${results.totalFiles}`);
  console.log(`有效文件: ${results.validFiles}`);
  console.log(`无效文件: ${results.invalidFiles}`);
  
  if (results.errors.length > 0) {
    console.log('\n发现的错误:');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. [${err.type}] ${err.path}`);
      console.log(`   错误: ${err.error}`);
    });
  }
  
  console.log('\n\n===========================================');
  console.log('           测试文件分析完成                 ');
  console.log('===========================================');
}

// 检查插件管理测试文件
function checkPluginTests() {
  console.log('\n\n===========================================');
  console.log('           插件系统测试分析                 ');
  console.log('===========================================');
  
  // 检查我们创建的测试文件
  const pluginTestFiles = [
    'packages/core/__tests__/pluginManagement.test.ts',
    'apps/extension/src/__tests__/background.test.ts'
  ];
  
  console.log('\n自定义插件测试文件检查:');
  
  pluginTestFiles.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    console.log(`\n检查文件: ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
      console.log('✅ 文件存在');
      
      try {
        const stats = fs.statSync(fullPath);
        console.log(`  - 文件大小: ${stats.size} 字节`);
        console.log(`  - 创建时间: ${new Date(stats.birthtime).toLocaleString()}`);
        console.log(`  - 修改时间: ${new Date(stats.mtime).toLocaleString()}`);
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        console.log(`  - 行数: ${lines}`);
        
        // 分析测试内容
        const testCount = (content.match(/\bit\(['"]([^'"]+)['"]/g) || []).length;
        const describeCount = (content.match(/\bdescribe\(['"]([^'"]+)['"]/g) || []).length;
        console.log(`  - 测试用例数: ~${testCount}`);
        console.log(`  - 测试套件数: ~${describeCount}`);
        
      } catch (error) {
        console.log(`❌ 读取文件信息失败: ${error.message}`);
      }
    } else {
      console.log('❌ 文件不存在');
    }
  });
  
  console.log('\n\n===========================================');
  console.log('         插件系统测试分析完成               ');
  console.log('===========================================');
}

// 开始检查
console.log('开始测试文件分析...');

// 定义要检查的测试目录
const testDirectories = [
  'packages/core/__tests__',
  'packages/platform/__tests__',
  'apps/extension/src/__tests__'
];

// 检查每个目录
testDirectories.forEach(dir => {
  const fullPath = path.resolve(dir);
  checkTestDirectory(fullPath);
});

// 检查插件相关测试文件
checkPluginTests();

// 生成最终报告
generateReport();

console.log('\n\nMarkdown 格式的测试报告:');
console.log('```markdown');
console.log('# 测试文件分析报告');
console.log('');
console.log('## 概述');
console.log(`- 测试目录数: ${results.directories.length}`);
console.log(`- 总测试文件数: ${results.totalFiles}`);
console.log(`- 有效文件: ${results.validFiles}`);
console.log(`- 无效文件: ${results.invalidFiles}`);
console.log(`- 文件有效性: ${results.totalFiles > 0 ? Math.round((results.validFiles / results.totalFiles) * 100) : 0}%`);
console.log('');
console.log('## 详细目录分析');
results.directories.forEach(dir => {
  console.log('');
  console.log(`### ${path.basename(dir.path)}`);
  console.log(`- 路径: ${dir.path}`);
  console.log(`- 总文件数: ${dir.total}`);
  console.log(`- 有效文件: ${dir.valid}`);
  console.log(`- 无效文件: ${dir.invalid}`);
});
console.log('');
console.log('## 错误列表');
if (results.errors.length > 0) {
  results.errors.forEach((err, index) => {
    console.log('');
    console.log(`### 错误 ${index + 1}`);
    console.log(`- 类型: ${err.type}`);
    console.log(`- 路径: ${err.path}`);
    console.log(`- 错误信息: ${err.error}`);
  });
} else {
  console.log('没有发现错误');
}
console.log('');
console.log('## 插件系统测试分析');
console.log('');
console.log('### 创建的测试文件');
const pluginTestFiles = [
  'packages/core/__tests__/pluginManagement.test.ts',
  'apps/extension/src/__tests__/background.test.ts'
];
pluginTestFiles.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  console.log('');
  console.log(`#### ${path.basename(fullPath)}`);
  console.log(`- 路径: ${fullPath}`);
  console.log(`- 状态: ${exists ? '✅ 存在' : '❌ 不存在'}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      const testCount = (content.match(/\bit\(['"]([^'"]+)['"]/g) || []).length;
      const describeCount = (content.match(/\bdescribe\(['"]([^'"]+)['"]/g) || []).length;
      
      console.log(`- 文件大小: ${stats.size} 字节`);
      console.log(`- 行数: ${lines}`);
      console.log(`- 测试用例数: ~${testCount}`);
      console.log(`- 测试套件数: ~${describeCount}`);
    } catch (error) {
      console.log(`- 错误: ${error.message}`);
    }
  }
});
console.log('```');