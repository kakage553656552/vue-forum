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
const db = new Low(adapter);

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
    { id: '4', name: '资源共享', description: '分享各类有用的资源和工具' }
  ];
}

// 清空现有用户、帖子和回复
db.data.users = [];
db.data.posts = [];
db.data.replies = [];

// 生成100个用户
const users = [];
for (let i = 0; i < 100; i++) {
  const username = faker.internet.userName();
  const email = faker.internet.email();
  // 统一密码为123456，方便测试
  const password = await bcrypt.hash('123456', 10);
  
  const user = {
    id: uuidv4(),
    username,
    email,
    password,
    createdAt: faker.date.past(2).toISOString(), // 过去2年内的随机日期
    role: i < 5 ? 'admin' : 'user' // 前5个用户设为管理员
  };
  
  users.push(user);
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
      title: faker.lorem.sentence(5, 10), // 5-10个单词的标题
      content: faker.lorem.paragraphs(3, '\n\n'), // 3段内容
      authorId: user.id,
      categoryId,
      createdAt: faker.date.between(user.createdAt, new Date()).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(), // 最近30天内的更新
      viewCount: Math.floor(Math.random() * 500) // 随机浏览量
    };
    
    posts.push(post);
  }
}

// 将帖子添加到数据库
db.data.posts = posts;

// 生成回复（确保每个帖子至少有1-5条回复）
const replies = [];
for (const post of posts) {
  // 为每个帖子随机生成1-5条回复
  const replyCount = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < replyCount; i++) {
    // 随机选择一个用户（不是帖子作者）作为回复者
    let randomUser;
    do {
      randomUser = users[Math.floor(Math.random() * users.length)];
    } while (randomUser.id === post.authorId);
    
    const reply = {
      id: uuidv4(),
      postId: post.id,
      content: faker.lorem.paragraph(),
      authorId: randomUser.id,
      createdAt: faker.date.between(post.createdAt, new Date()).toISOString()
    };
    
    replies.push(reply);
  }
}

// 再随机生成一些回复的回复，增加互动性
for (let i = 0; i < 500; i++) { // 额外添加500条回复
  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  const randomUser = users[Math.floor(Math.random() * users.length)];
  
  const reply = {
    id: uuidv4(),
    postId: randomPost.id,
    content: faker.lorem.paragraph(),
    authorId: randomUser.id,
    createdAt: faker.date.between(randomPost.createdAt, new Date()).toISOString()
  };
  
  replies.push(reply);
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