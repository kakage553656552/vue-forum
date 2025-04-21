import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 读取当前的db.json文件
const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

// 确保至少有一个用户
const userId = db.users.length > 0 ? db.users[0].id : uuidv4();
if (db.users.length === 0) {
  db.users.push({
    id: userId,
    username: "testuser",
    email: "test@example.com",
    password: "$2a$10$hD7wvuddWHCSI19vxiuyo.aNSxYhztPs5/WcxZt4zwNG1x02.p13.", // 加密的"password"
    createdAt: new Date().toISOString(),
    role: "user"
  });
}

// 帖子标题模板
const postTitles = [
  "关于{topic}的讨论",
  "{topic}有什么新进展吗？",
  "分享一下我的{topic}经验",
  "请教关于{topic}的问题",
  "对{topic}的一些思考",
  "{topic}入门指南",
  "{topic}高级技巧分享",
  "解析{topic}的常见问题",
  "{topic}的未来发展趋势",
  "从零开始学习{topic}"
];

// 主题列表
const topics = [
  "Vue.js", "React", "Angular", "前端开发", "后端开发", "Python", "JavaScript",
  "人工智能", "机器学习", "区块链", "云计算", "大数据", "微服务", "移动开发",
  "iOS开发", "Android开发", "数据库优化", "网络安全", "DevOps", "敏捷开发"
];

// 帖子内容模板
const postContents = [
  "我最近开始学习{topic}，感觉非常有趣。有没有人可以推荐一些好的学习资源？我已经看了官方文档，但是希望能找到一些更实用的教程或者项目案例。",
  
  "大家好，我是{topic}领域的新手，想请教一下这个领域的发展前景如何？现在入行是否还有机会？需要掌握哪些核心技能？希望有经验的朋友能给一些建议。",
  
  "分享一个我在{topic}方面的经验：{experience}。希望对大家有所帮助，也欢迎讨论和指正。",
  
  "我在使用{topic}时遇到了一个问题：{problem}。我已经尝试了{solution}，但是问题依然存在。有没有人知道该如何解决？",
  
  "{topic}技术在最近几年发展迅速，我认为主要原因有：首先，{reason1}；其次，{reason2}；最后，{reason3}。大家怎么看这个趋势？",
  
  "作为一个{topic}的爱好者，我想分享一些我认为很有价值的资源：{resource1}、{resource2}和{resource3}。这些资源对我帮助很大，希望也能帮到你们。",
  
  "关于{topic}，有一个常见的误解是{misconception}。实际上，{reality}。我认为澄清这一点很重要，否则会导致{consequence}。",
  
  "我刚完成了一个基于{topic}的项目，过程中学到了很多。主要的挑战是{challenge}，我通过{solution}解决了这个问题。项目的成果是{result}。",
  
  "我对{topic}的未来发展很乐观，特别是在{aspect}方面。我预测在未来几年，我们会看到{prediction}。这对行业将产生深远影响。",
  
  "最近我参加了一个关于{topic}的线上会议，收获颇丰。其中最有价值的观点是{insight}。演讲者还提到了{point}，这让我对{topic}有了新的认识。"
];

// 一些填充内容
const experiences = [
  "始终保持代码的简洁和可读性比追求过度优化更重要",
  "定期重构代码可以大大提高长期的开发效率",
  "使用合适的设计模式可以解决很多复杂问题",
  "测试驱动开发确实可以减少bug数量",
  "花时间学习快捷键和工具可以大幅提高生产力"
];

const problems = [
  "组件间通信不正常",
  "性能优化遇到瓶颈",
  "内存泄漏问题",
  "路由配置错误",
  "API集成困难"
];

const solutions = [
  "查看官方文档和Stack Overflow",
  "调整配置参数",
  "重构代码结构",
  "使用开发者工具调试",
  "咨询同事和社区"
];

const reasons = [
  "技术生态系统日益成熟",
  "企业需求不断增加",
  "开发效率显著提升",
  "社区支持非常活跃",
  "学习曲线变得平缓"
];

const resources = [
  "官方文档",
  "GitHub优质项目",
  "技术博客文章",
  "YouTube教学视频",
  "在线交互式课程"
];

const misconceptions = [
  "只适合大型项目",
  "学习曲线太陡峭",
  "性能不如传统方法",
  "配置过于复杂",
  "只是一时的技术潮流"
];

const realities = [
  "其实适用于各种规模的项目",
  "入门其实很简单，掌握核心概念就能上手",
  "经过优化后性能表现非常出色",
  "现代工具已经简化了大部分配置工作",
  "已经被业界广泛接受并会长期存在"
];

const consequences = [
  "错过技术发展的机会",
  "做出错误的技术选型决策",
  "团队产生不必要的学习阻力",
  "项目开发效率降低",
  "无法充分发挥技术优势"
];

const challenges = [
  "性能优化",
  "跨平台兼容性",
  "复杂状态管理",
  "安全性问题",
  "团队协作效率"
];

const results = [
  "系统性能提升了40%",
  "用户体验得到显著改善",
  "开发周期缩短了三分之一",
  "代码可维护性大幅提高",
  "成功上线并获得客户好评"
];

const aspects = [
  "企业应用",
  "移动开发",
  "实时数据处理",
  "用户体验设计",
  "开发者工具链"
];

const predictions = [
  "更多智能化的开发辅助工具",
  "与人工智能的深度融合",
  "更简化的开发流程",
  "更强大的社区支持",
  "更广泛的应用场景"
];

const insights = [
  "技术选型应该基于实际需求而非流行趋势",
  "持续学习比掌握特定技术更重要",
  "软技能在技术职业发展中同样关键",
  "开源社区贡献可以加速职业成长",
  "解决用户问题永远是技术的核心目的"
];

const points = [
  "未来的发展方向",
  "常见的实施错误",
  "优化技巧",
  "与其他技术的集成",
  "成功案例分析"
];

// 评论内容模板
const replyContents = [
  "非常感谢分享！这对我帮助很大。",
  "我也遇到过类似的问题，最后是通过{solution}解决的。",
  "有一点补充：关于{topic}，还可以考虑{point}。",
  "我不太同意你关于{point}的看法，我认为{alternative}。",
  "请问有没有关于{topic}的进阶资料推荐？",
  "这篇帖子写得太好了，正是我需要的信息。",
  "我刚开始学习{topic}，这些信息对我非常有价值。",
  "你提到的{point}我试过，确实效果很好。",
  "我对{topic}也很感兴趣，希望能交流更多。",
  "这个解决方案很创新，我从来没想过可以这样处理。"
];

const alternatives = [
  "应该更注重实用性而非理论完美",
  "这种方法在大型项目中可能存在扩展性问题",
  "传统方法在某些场景下仍然更有优势",
  "需要考虑更多的边界情况",
  "技术选型应该更多地基于团队熟悉度"
];

// 随机选择函数
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 随机生成帖子内容
function generatePostContent(topic) {
  const template = getRandomItem(postContents);
  return template
    .replace(/{topic}/g, topic)
    .replace(/{experience}/g, getRandomItem(experiences))
    .replace(/{problem}/g, getRandomItem(problems))
    .replace(/{solution}/g, getRandomItem(solutions))
    .replace(/{reason1}/g, getRandomItem(reasons))
    .replace(/{reason2}/g, getRandomItem(reasons))
    .replace(/{reason3}/g, getRandomItem(reasons))
    .replace(/{resource1}/g, getRandomItem(resources))
    .replace(/{resource2}/g, getRandomItem(resources))
    .replace(/{resource3}/g, getRandomItem(resources))
    .replace(/{misconception}/g, getRandomItem(misconceptions))
    .replace(/{reality}/g, getRandomItem(realities))
    .replace(/{consequence}/g, getRandomItem(consequences))
    .replace(/{challenge}/g, getRandomItem(challenges))
    .replace(/{result}/g, getRandomItem(results))
    .replace(/{aspect}/g, getRandomItem(aspects))
    .replace(/{prediction}/g, getRandomItem(predictions))
    .replace(/{insight}/g, getRandomItem(insights))
    .replace(/{point}/g, getRandomItem(points));
}

// 随机生成评论内容
function generateReplyContent(topic) {
  const template = getRandomItem(replyContents);
  return template
    .replace(/{topic}/g, topic)
    .replace(/{solution}/g, getRandomItem(solutions))
    .replace(/{point}/g, getRandomItem(points))
    .replace(/{alternative}/g, getRandomItem(alternatives));
}

// 生成100个帖子
const newPosts = [];
const newReplies = [];

for (let i = 0; i < 100; i++) {
  const topic = getRandomItem(topics);
  const titleTemplate = getRandomItem(postTitles);
  const title = titleTemplate.replace(/{topic}/g, topic);
  const content = generatePostContent(topic);
  
  const postId = uuidv4();
  const categoryId = String(Math.floor(Math.random() * 4) + 1); // 随机分类1-4
  
  const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(); // 随机时间在过去30天内
  
  const post = {
    id: postId,
    title,
    content,
    authorId: userId,
    categoryId,
    createdAt,
    updatedAt: createdAt,
    viewCount: Math.floor(Math.random() * 100) // 随机浏览次数0-99
  };
  
  newPosts.push(post);
  
  // 为每个帖子生成1-5条评论
  const replyCount = Math.floor(Math.random() * 5) + 1;
  for (let j = 0; j < replyCount; j++) {
    const reply = {
      id: uuidv4(),
      postId,
      content: generateReplyContent(topic),
      authorId: userId,
      createdAt: new Date(Date.parse(createdAt) + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() // 评论时间在帖子发布后0-5天
    };
    
    newReplies.push(reply);
  }
}

// 更新数据库
db.posts = [...db.posts, ...newPosts];
db.replies = [...db.replies, ...newReplies];

// 写入文件
fs.writeFileSync('./db.json', JSON.stringify(db, null, 2), 'utf8');

console.log(`成功生成 ${newPosts.length} 条帖子和 ${newReplies.length} 条评论`); 