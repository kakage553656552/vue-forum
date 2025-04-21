import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/zh_CN';

// 设置中文语言环境
faker.locale = 'zh_CN';

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置数据库
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { users: [], categories: [], posts: [], replies: [] };
const db = new Low(adapter, defaultData);

// 初始化数据库
await db.read();

// 确保数据库中有所需的集合
if (!db.data) {
  db.data = { users: [], categories: [], posts: [], replies: [] };
}

// 如果没有分类，添加一些默认分类
if (!db.data.categories || db.data.categories.length === 0) {
  db.data.categories = [
    { id: '1', name: '综合讨论', description: '各种话题的综合讨论区' },
    { id: '2', name: '技术交流', description: '分享和讨论各种技术问题' },
    { id: '3', name: '问答专区', description: '提问和解答各种问题' },
    { id: '4', name: '站务公告', description: '网站公告和规则' }
  ];
}

// 清空现有用户、帖子和回复
db.data.users = [];
db.data.posts = [];
db.data.replies = [];

console.log('开始生成测试数据...');

// 生成100个用户
const users = [];
for (let i = 0; i < 100; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = `${lastName}${firstName}${Math.floor(Math.random() * 1000)}`;
  const email = faker.internet.email({ firstName, lastName });
  // 统一密码为123456，方便测试
  const password = await bcrypt.hash('123456', 10);
  
  const user = {
    id: uuidv4(),
    username,
    email,
    password,
    createdAt: faker.date.past({ years: 2 }).toISOString(), // 过去2年内的随机日期
    role: i < 5 ? 'admin' : 'user' // 前5个用户设为管理员
  };
  
  users.push(user);
  
  if (i % 10 === 0) {
    console.log(`已生成 ${i + 1} 个用户...`);
  }
}

// 将用户添加到数据库
db.data.users = users;

// 生成帖子（每个用户10个帖子）
const posts = [];
for (const user of users) {
  for (let i = 0; i < 10; i++) {
    const categoryId = String(Math.floor(Math.random() * 4) + 1); // 随机分类1-4
    
    const post = {
      id: uuidv4(),
      title: faker.lorem.sentence({ min: 5, max: 10 }), // 5-10个词的标题
      content: faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n'), // 3-6段内容
      authorId: user.id,
      categoryId,
      createdAt: faker.date.between({ 
        from: new Date(user.createdAt), 
        to: new Date() 
      }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(), // 最近30天内的更新
      viewCount: Math.floor(Math.random() * 1000) // 随机浏览量
    };
    
    posts.push(post);
  }
}

// 将帖子添加到数据库
db.data.posts = posts;
console.log(`已生成 ${posts.length} 个帖子...`);

// 生成回复（确保每个帖子至少有2-5条回复）
const replies = [];
for (const post of posts) {
  // 为每个帖子随机生成2-5条回复
  const replyCount = Math.floor(Math.random() * 4) + 2;
  
  for (let i = 0; i < replyCount; i++) {
    // 随机选择一个用户（不是帖子作者）作为回复者
    let randomUser;
    do {
      randomUser = users[Math.floor(Math.random() * users.length)];
    } while (randomUser.id === post.authorId);
    
    const reply = {
      id: uuidv4(),
      postId: post.id,
      content: faker.lorem.paragraph({ min: 1, max: 3 }),
      authorId: randomUser.id,
      createdAt: faker.date.between({ 
        from: new Date(post.createdAt), 
        to: new Date() 
      }).toISOString()
    };
    
    replies.push(reply);
  }
  
  if (posts.indexOf(post) % 100 === 0) {
    console.log(`已为 ${posts.indexOf(post) + 1} 个帖子生成回复...`);
  }
}

// 生成回复的回复，增加互动性
// 遍历每个用户，让他们互相评论
for (let i = 0; i < users.length; i++) {
  const user = users[i];
  // 每个用户对30个随机帖子进行评论
  for (let j = 0; j < 30; j++) {
    // 选择一个随机帖子
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    
    // 不对自己的帖子评论
    if (randomPost.authorId === user.id) continue;
    
    const reply = {
      id: uuidv4(),
      postId: randomPost.id,
      content: faker.lorem.paragraph({ min: 1, max: 2 }),
      authorId: user.id,
      createdAt: faker.date.between({ 
        from: new Date(randomPost.createdAt), 
        to: new Date() 
      }).toISOString()
    };
    
    replies.push(reply);
  }
  
  if (i % 10 === 0) {
    console.log(`已为 ${i + 1} 个用户生成互动评论...`);
  }
}

// 将回复添加到数据库
db.data.replies = replies;

// 保存到数据库
await db.write();

console.log('测试数据生成完成！');
console.log(`- 用户数量: ${users.length}`);
console.log(`- 帖子数量: ${posts.length}`);
console.log(`- 回复数量: ${replies.length}`);
console.log('所有用户的密码都是: 123456');
console.log('前5个用户是管理员，其余为普通用户'); 