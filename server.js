import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置数据库
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { users: [], categories: [], posts: [], replies: [] };
const db = new Low(adapter, defaultData);

// 初始化数据库
await db.read();

// 如果没有分类，添加一些默认分类
if (!db.data.categories || db.data.categories.length === 0) {
  db.data.categories = [
    { id: '1', name: '综合讨论', description: '各种话题的综合讨论区' },
    { id: '2', name: '技术交流', description: '分享和讨论各种技术问题' },
    { id: '3', name: '问答专区', description: '提问和解答各种问题' },
    { id: '4', name: '站务公告', description: '网站公告和规则' }
  ];
  await db.write();
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// JWT密钥
const JWT_SECRET = 'your-secret-key'; // 实际应用中应该使用环境变量

// 验证Token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未授权' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的Token' });
    }
    
    req.user = user;
    next();
  });
};

// 中间件：检查是否是管理员
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: '权限不足，需要管理员权限' });
  }
};

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成文件名: 时间戳 + 随机字符串 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 过滤文件类型
const fileFilter = (req, file, cb) => {
  // 只接受图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上传图片文件！'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 路由

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    
    // 验证用户名和邮箱是否已存在
    const existingUser = db.data.users.find(
      user => user.username === username || user.email === email
    );
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      role: 'user', // 默认角色
      avatar: avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' // 默认头像
    };
    
    db.data.users.push(newUser);
    await db.write();
    
    // 生成Token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 返回用户信息（不包含密码）和Token
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: '注册成功',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = db.data.users.find(user => user.username === username);
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    
    // 生成Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 返回用户信息（不包含密码）和Token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: '登录成功',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  // 计算每个分类的帖子数量和主题数量
  const categoriesWithStats = db.data.categories.map(category => {
    // 该分类下的所有帖子
    const categoryPosts = db.data.posts.filter(post => post.categoryId === category.id);
    
    // 帖子数量
    const postCount = categoryPosts.length;
    
    // 主题数量（去重，一个主题可能有多个帖子）
    // 在这个简单论坛中，我们把每个帖子都视为一个主题
    const topicCount = categoryPosts.length;
    
    return {
      ...category,
      postCount,
      topicCount
    };
  });
  
  res.json(categoriesWithStats);
});

// 获取单个分类详情
app.get('/api/categories/:id', (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = db.data.categories.find(category => category.id === categoryId);
    
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    
    // 计算该分类下的帖子数量和主题数量
    const categoryPosts = db.data.posts.filter(post => post.categoryId === category.id);
    const postCount = categoryPosts.length;
    const topicCount = categoryPosts.length; // 在这个简单论坛中，我们把每个帖子都视为一个主题
    
    res.json({
      ...category,
      postCount,
      topicCount
    });
  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取帖子列表
app.get('/api/posts', (req, res) => {
  try {
    const { categoryId, page = 1, pageSize = 10, sort = 'newest' } = req.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    
    // 验证分页参数
    if (isNaN(pageNum) || isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({ message: '无效的分页参数' });
    }
    
    // 筛选帖子 - 如果有categoryId参数，则按分类筛选
    let filteredPosts = db.data.posts;
    if (categoryId) {
      filteredPosts = filteredPosts.filter(post => post.categoryId === categoryId);
    }
    
    // 获取帖子并添加作者信息和回复数
    const allPosts = filteredPosts.map(post => {
      const author = db.data.users.find(user => user.id === post.authorId);
      const replyCount = db.data.replies.filter(reply => reply.postId === post.id).length;
      
      // 不返回作者密码
      const { password, ...authorWithoutPassword } = author || { password: '' };
      
      return {
        ...post,
        author: authorWithoutPassword,
        replyCount
      };
    });
    
    // 首先按置顶状态排序
    let sortedPosts = [...allPosts];
    
    // 先按照isPinned排序，置顶的排在前面
    sortedPosts.sort((a, b) => {
      // 如果a置顶而b没有置顶，a排在前面
      if (a.isPinned && !b.isPinned) return -1;
      // 如果b置顶而a没有置顶，b排在前面
      if (!a.isPinned && b.isPinned) return 1;
      // 如果都置顶，按照置顶时间从新到旧排序
      if (a.isPinned && b.isPinned) {
        return new Date(b.pinnedAt) - new Date(a.pinnedAt);
      }
      // 如果都没置顶，按照其他排序规则
      return 0;
    });
    
    // 然后按照指定的排序方式对非置顶帖子排序
    // 对于置顶的帖子，保持它们的置顶顺序
    const pinnedPosts = sortedPosts.filter(post => post.isPinned);
    const unpinnedPosts = sortedPosts.filter(post => !post.isPinned);
    
    // 对非置顶帖子按照排序方式排序
    switch (sort) {
      case 'newest': // 最新
        unpinnedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'hot': // 最热（按浏览量）
        unpinnedPosts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case 'replies': // 回复最多
        unpinnedPosts.sort((a, b) => b.replyCount - a.replyCount);
        break;
      default:
        unpinnedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // 合并置顶和非置顶帖子
    sortedPosts = [...pinnedPosts, ...unpinnedPosts];
    
    // 计算总页数
    const totalPosts = sortedPosts.length;
    const totalPages = Math.ceil(totalPosts / pageSizeNum);
    
    // 分页
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex);
    
    res.json({
      posts: paginatedPosts,
      pagination: {
        total: totalPosts,
        totalPages,
        currentPage: pageNum,
        pageSize: pageSizeNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取帖子详情
app.get('/api/posts/:id', (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.data.posts.find(post => post.id === postId);
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 获取作者信息
    const author = db.data.users.find(user => user.id === post.authorId);
    const { password, ...authorWithoutPassword } = author;
    
    // 增加浏览次数
    post.viewCount = (post.viewCount || 0) + 1;
    db.write();
    
    res.json({
      ...post,
      author: authorWithoutPassword
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建帖子
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const authorId = req.user.id;
    
    // 验证分类是否存在
    const categoryExists = db.data.categories.some(category => category.id === categoryId);
    
    if (!categoryExists) {
      return res.status(400).json({ message: '分类不存在' });
    }
    
    // 创建新帖子
    const newPost = {
      id: uuidv4(),
      title,
      content,
      authorId,
      categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0
    };
    
    db.data.posts.push(newPost);
    await db.write();
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取帖子回复
app.get('/api/posts/:id/replies', (req, res) => {
  try {
    const postId = req.params.id;
    
    // 获取帖子的所有回复
    const replies = db.data.replies
      .filter(reply => reply.postId === postId)
      .map(reply => {
        const author = db.data.users.find(user => user.id === reply.authorId);
        const { password, ...authorWithoutPassword } = author;
        
        // 计算每个回复的子回复数量
        const childRepliesCount = db.data.replies.filter(r => r.parentId === reply.id).length;
        
        return {
          ...reply,
          author: authorWithoutPassword,
          childRepliesCount
        };
      });
    
    // 只返回顶级回复（没有parentId的回复）
    const topLevelReplies = replies.filter(reply => !reply.parentId);
    
    // 按创建时间升序排序
    topLevelReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(topLevelReplies);
  } catch (error) {
    console.error('获取回复错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取回复的子回复
app.get('/api/replies/:id/children', (req, res) => {
  try {
    const parentReplyId = req.params.id;
    
    // 获取指定回复的所有子回复
    const childReplies = db.data.replies
      .filter(reply => reply.parentId === parentReplyId)
      .map(reply => {
        const author = db.data.users.find(user => user.id === reply.authorId);
        const { password, ...authorWithoutPassword } = author;
        
        // 计算每个回复的子回复数量
        const childRepliesCount = db.data.replies.filter(r => r.parentId === reply.id).length;
        
        return {
          ...reply,
          author: authorWithoutPassword,
          childRepliesCount
        };
      });
    
    // 按创建时间升序排序
    childReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(childReplies);
  } catch (error) {
    console.error('获取子回复错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建回复
app.post('/api/posts/:id/replies', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, parentId } = req.body;
    const authorId = req.user.id;
    
    // 验证帖子是否存在
    const post = db.data.posts.find(post => post.id === postId);
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 如果提供了parentId，验证父回复是否存在
    if (parentId) {
      const parentReply = db.data.replies.find(reply => reply.id === parentId);
      if (!parentReply) {
        return res.status(404).json({ message: '父回复不存在' });
      }
      
      // 确保父回复属于同一个帖子
      if (parentReply.postId !== postId) {
        return res.status(400).json({ message: '父回复不属于该帖子' });
      }
    }
    
    // 创建新回复
    const newReply = {
      id: uuidv4(),
      postId,
      content,
      authorId,
      parentId: parentId || null, // 如果没有parentId则设为null
      createdAt: new Date().toISOString()
    };
    
    db.data.replies.push(newReply);
    await db.write();
    
    // 获取作者信息
    const author = db.data.users.find(user => user.id === authorId);
    const { password, ...authorWithoutPassword } = author;
    
    res.status(201).json({
      ...newReply,
      author: authorWithoutPassword,
      childRepliesCount: 0 // 新回复没有子回复
    });
  } catch (error) {
    console.error('创建回复错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户信息
app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.params.id;
    
    // 只允许获取自己的信息或管理员可以获取任何人的信息
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const user = db.data.users.find(user => user.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不返回密码
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前登录用户的个人资料
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.data.users.find(user => user.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不返回密码
    const { password, ...userWithoutPassword } = user;
    
    // 获取用户发布的帖子数量
    const postCount = db.data.posts.filter(post => post.authorId === userId).length;
    
    // 获取用户的回复数量
    const replyCount = db.data.replies.filter(reply => reply.authorId === userId).length;
    
    res.json({
      ...userWithoutPassword,
      postCount,
      replyCount
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前登录用户发布的帖子
app.get('/api/user/posts', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户发布的所有帖子
    const userPosts = db.data.posts
      .filter(post => post.authorId === userId)
      .map(post => {
        // 获取每个帖子的回复数量
        const replyCount = db.data.replies.filter(reply => reply.postId === post.id).length;
        
        return {
          ...post,
          replyCount
        };
      });
    
    // 先按置顶状态排序，然后按创建时间排序
    userPosts.sort((a, b) => {
      // 置顶的排在前面
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 如果都置顶，按置顶时间从新到旧
      if (a.isPinned && b.isPinned) {
        return new Date(b.pinnedAt) - new Date(a.pinnedAt);
      }
      // 如果都不置顶，按创建时间从新到旧
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json(userPosts);
  } catch (error) {
    console.error('获取用户帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有用户（仅管理员可访问）
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  try {
    // 为每个用户计算发帖数和回复数
    const usersWithStats = db.data.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      
      // 计算用户发帖数
      const postCount = db.data.posts.filter(post => post.authorId === user.id).length;
      
      // 计算用户回复数
      const replyCount = db.data.replies.filter(reply => reply.authorId === user.id).length;
      
      return {
        ...userWithoutPassword,
        postCount,
        replyCount
      };
    });
    
    res.json(usersWithStats);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个用户的帖子（仅管理员可访问）
app.get('/api/users/:id/posts', authenticateToken, isAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    
    // 验证用户是否存在
    const user = db.data.users.find(user => user.id === userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 获取用户的所有帖子
    const userPosts = db.data.posts
      .filter(post => post.authorId === userId)
      .map(post => {
        // 获取分类信息
        const category = db.data.categories.find(cat => cat.id === post.categoryId);
        
        return {
          ...post,
          categoryName: category ? category.name : '未知分类'
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 按创建时间降序排列
    
    res.json(userPosts);
  } catch (error) {
    console.error('获取用户帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户角色（仅管理员可访问）
app.put('/api/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // 验证角色值
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: '无效的角色值' });
    }
    
    // 查找用户
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新用户角色
    db.data.users[userIndex].role = role;
    await db.write();
    
    res.json({ message: '用户角色更新成功' });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户（仅管理员可访问）
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 验证用户是否存在
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不允许删除自己
    if (userId === req.user.id) {
      return res.status(400).json({ message: '不能删除自己的账号' });
    }
    
    // 删除用户
    db.data.users.splice(userIndex, 1);
    
    // 删除用户的所有帖子和回复
    db.data.posts = db.data.posts.filter(post => post.authorId !== userId);
    db.data.replies = db.data.replies.filter(reply => reply.authorId !== userId);
    
    await db.write();
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户个人资料
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;
    
    // 验证用户名是否已被其他用户使用
    const existingUser = db.data.users.find(
      u => u.username === username && u.id !== userId
    );
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名已被使用' });
    }
    
    // 验证邮箱是否已被其他用户使用
    const existingEmail = db.data.users.find(
      u => u.email === email && u.id !== userId
    );
    
    if (existingEmail) {
      return res.status(400).json({ message: '邮箱已被使用' });
    }
    
    // 更新用户资料
    const userIndex = db.data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    db.data.users[userIndex].username = username;
    db.data.users[userIndex].email = email;
    
    await db.write();
    
    res.json({ 
      success: true, 
      message: '个人资料已更新',
      user: {
        id: db.data.users[userIndex].id,
        username: db.data.users[userIndex].username,
        email: db.data.users[userIndex].email,
        role: db.data.users[userIndex].role,
        avatar: db.data.users[userIndex].avatar
      }
    });
  } catch (error) {
    console.error('更新个人资料错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户头像
app.put('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;
    
    // 更新用户头像
    const userIndex = db.data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    db.data.users[userIndex].avatar = avatar;
    
    await db.write();
    
    res.json({ 
      success: true, 
      message: '头像已更新',
      avatar: db.data.users[userIndex].avatar
    });
  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传头像
app.post('/api/upload/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    // 生成文件URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 图片上传接口
app.post('/api/upload/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        errno: 1, 
        message: '没有收到文件或文件类型不正确'
      });
    }
    
    // 返回图片访问路径（相对路径转为URL）
    const imgUrl = `/uploads/${req.file.filename}`;
    
    // 按照wangEditor格式返回
    res.json({
      errno: 0,
      data: {
        url: imgUrl,
        alt: req.file.originalname,
        href: imgUrl
      }
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.status(500).json({ 
      errno: 1,
      message: '服务器错误，上传失败'
    });
  }
});

// 静态文件目录，用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 删除帖子
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // 查找帖子
    const postIndex = db.data.posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 验证是当前用户的帖子或管理员
    if (db.data.posts[postIndex].authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此帖子' });
    }
    
    // 删除帖子的所有回复
    db.data.replies = db.data.replies.filter(reply => reply.postId !== postId);
    
    // 删除帖子
    db.data.posts.splice(postIndex, 1);
    await db.write();
    
    res.json({ message: '帖子删除成功' });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新帖子
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { title, content, categoryId } = req.body;
    
    // 查找帖子
    const postIndex = db.data.posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 验证是当前用户的帖子或管理员
    if (db.data.posts[postIndex].authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权编辑此帖子' });
    }
    
    // 验证分类是否存在
    if (categoryId) {
      const categoryExists = db.data.categories.some(category => category.id === categoryId);
      if (!categoryExists) {
        return res.status(400).json({ message: '分类不存在' });
      }
    }
    
    // 更新帖子
    const updatedPost = {
      ...db.data.posts[postIndex],
      title: title || db.data.posts[postIndex].title,
      content: content || db.data.posts[postIndex].content,
      categoryId: categoryId || db.data.posts[postIndex].categoryId,
      updatedAt: new Date().toISOString()
    };
    
    db.data.posts[postIndex] = updatedPost;
    await db.write();
    
    res.json({ 
      message: '帖子更新成功',
      post: updatedPost
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新帖子的置顶状态
app.patch('/api/posts/:id/toggle-pinned', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // 查找帖子
    const postIndex = db.data.posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 验证是当前用户的帖子或管理员
    if (db.data.posts[postIndex].authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此帖子的置顶状态' });
    }
    
    // 切换置顶状态
    const currentPinnedStatus = db.data.posts[postIndex].isPinned || false;
    db.data.posts[postIndex].isPinned = !currentPinnedStatus;
    db.data.posts[postIndex].pinnedAt = !currentPinnedStatus ? new Date().toISOString() : null;
    
    await db.write();
    
    res.json({ 
      message: !currentPinnedStatus ? '帖子已置顶' : '帖子已取消置顶',
      isPinned: !currentPinnedStatus
    });
  } catch (error) {
    console.error('更新帖子置顶状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});