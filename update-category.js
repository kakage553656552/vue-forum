import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置数据库
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { users: [], categories: [], posts: [], replies: [] };
const db = new Low(adapter, defaultData);

// 初始化数据库
await db.read();

// 更新分类
console.log('开始更新分类...');

if (db.data && db.data.categories) {
  // 查找ID为4的分类（站务公告）
  const categoryIndex = db.data.categories.findIndex(cat => cat.id === '4');
  
  if (categoryIndex !== -1) {
    console.log(`找到分类: ${db.data.categories[categoryIndex].name}`);
    
    // 更新分类名称和描述
    db.data.categories[categoryIndex].name = '资源共享';
    db.data.categories[categoryIndex].description = '分享各类有用的资源和工具';
    
    // 保存更改
    await db.write();
    console.log('分类已更新: "站务公告" -> "资源共享"');
  } else {
    console.log('找不到ID为4的分类');
  }
} else {
  console.log('数据库结构不正确或为空');
} 