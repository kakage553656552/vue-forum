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
    password: "$2a$10$hD7wvuddWHCSI19vxiuyo.aNSxYhztPs5/WcxZt4zwNG1x02.p13.", // encrypted "password"
    createdAt: new Date().toISOString(),
    role: "user"
  });
}

// Post title templates
const postTitles = [
  "Discussion about {topic}",
  "Any new developments in {topic}?",
  "Sharing my experience with {topic}",
  "Question about {topic}",
  "Some thoughts on {topic}",
  "Beginner's guide to {topic}",
  "Advanced techniques for {topic}",
  "Common problems with {topic} explained",
  "Future trends in {topic}",
  "Learning {topic} from scratch"
];

// Topic list
const topics = [
  "Vue.js", "React", "Angular", "Frontend Development", "Backend Development", "Python", "JavaScript",
  "Artificial Intelligence", "Machine Learning", "Blockchain", "Cloud Computing", "Big Data", "Microservices", "Mobile Development",
  "iOS Development", "Android Development", "Database Optimization", "Network Security", "DevOps", "Agile Development"
];

// Post content templates
const postContents = [
  "I recently started learning {topic} and find it really interesting. Can anyone recommend some good resources? I've already looked at the official documentation, but I'm hoping to find some more practical tutorials or project examples.",
  
  "Hello everyone, I'm new to the {topic} field and wondering about the future prospects. Is it still a good time to enter this field? What core skills should I master? I'd appreciate any advice from experienced professionals.",
  
  "I'd like to share an experience with {topic}: {experience}. Hope this helps someone, and I welcome any discussion or corrections.",
  
  "I've encountered a problem with {topic}: {problem}. I've tried {solution}, but the issue persists. Does anyone know how to solve this?",
  
  "{topic} has been developing rapidly in recent years. I think the main reasons are: first, {reason1}; second, {reason2}; and finally, {reason3}. What do you think about this trend?",
  
  "As a {topic} enthusiast, I want to share some resources I find valuable: {resource1}, {resource2}, and {resource3}. These have been extremely helpful to me, and I hope they help you too.",
  
  "There's a common misconception about {topic} that {misconception}. In reality, {reality}. I think it's important to clarify this, otherwise it leads to {consequence}.",
  
  "I just completed a project based on {topic} and learned a lot. The main challenge was {challenge}, which I solved by {solution}. The result was {result}.",
  
  "I'm optimistic about the future of {topic}, especially in terms of {aspect}. I predict that in the coming years, we'll see {prediction}. This will have a profound impact on the industry.",
  
  "I recently attended an online conference about {topic} and gained a lot of insights. The most valuable point was {insight}. The speaker also mentioned {point}, which gave me a new perspective on {topic}."
];

// Filler content
const experiences = [
  "keeping code simple and readable is more important than premature optimization",
  "regular code refactoring can greatly improve long-term development efficiency",
  "using appropriate design patterns can solve many complex problems",
  "test-driven development really does reduce the number of bugs",
  "investing time in learning shortcuts and tools can dramatically increase productivity"
];

const problems = [
  "component communication issues",
  "performance bottlenecks",
  "memory leaks",
  "routing configuration errors",
  "API integration difficulties"
];

const solutions = [
  "checking the official docs and Stack Overflow",
  "adjusting configuration parameters",
  "refactoring the code structure",
  "using developer tools for debugging",
  "consulting colleagues and the community"
];

const reasons = [
  "the ecosystem is maturing",
  "increasing business demand",
  "significant improvements in development efficiency",
  "active community support",
  "the learning curve has become smoother"
];

const resources = [
  "the official documentation",
  "quality GitHub projects",
  "technical blog articles",
  "YouTube tutorials",
  "interactive online courses"
];

const misconceptions = [
  "it's only suitable for large projects",
  "the learning curve is too steep",
  "it's not as performant as traditional methods",
  "the configuration is overly complex",
  "it's just a passing trend"
];

const realities = [
  "it's actually suitable for projects of all sizes",
  "the basics are quite simple to grasp",
  "when optimized, it performs excellently",
  "modern tools have simplified most of the configuration work",
  "it's been widely adopted and will remain relevant for a long time"
];

const consequences = [
  "missing opportunities for technological advancement",
  "making poor technology selection decisions",
  "unnecessary resistance to learning within teams",
  "reduced project development efficiency",
  "not fully leveraging the technology's advantages"
];

const challenges = [
  "performance optimization",
  "cross-platform compatibility",
  "complex state management",
  "security concerns",
  "team collaboration efficiency"
];

const results = [
  "a 40% improvement in system performance",
  "significantly enhanced user experience",
  "development cycle shortened by one-third",
  "greatly improved code maintainability",
  "successful deployment with positive client feedback"
];

const aspects = [
  "enterprise applications",
  "mobile development",
  "real-time data processing",
  "user experience design",
  "developer tooling"
];

const predictions = [
  "more intelligent development assistance tools",
  "deeper integration with artificial intelligence",
  "simplified development workflows",
  "stronger community support",
  "broader application scenarios"
];

const insights = [
  "technology selection should be based on actual needs rather than trends",
  "continuous learning is more important than mastering specific technologies",
  "soft skills are equally crucial in technical career development",
  "contributing to open source communities can accelerate career growth",
  "solving user problems is always the core purpose of technology"
];

const points = [
  "future development directions",
  "common implementation mistakes",
  "optimization techniques",
  "integration with other technologies",
  "successful case studies"
];

// Reply content templates
const replyContents = [
  "Thank you so much for sharing! This has been very helpful.",
  "I've encountered a similar problem and solved it using {solution}.",
  "One additional point about {topic}: you might also consider {point}.",
  "I don't quite agree with your view on {point}. I think {alternative}.",
  "Do you have any advanced resources about {topic} to recommend?",
  "This post is so well-written and exactly the information I needed.",
  "I'm just starting to learn {topic}, and this information is incredibly valuable.",
  "I've tried the {point} you mentioned, and it works great.",
  "I'm also interested in {topic} and would love to exchange more ideas.",
  "This solution is so innovative. I never thought it could be handled this way."
];

const alternatives = [
  "we should focus more on practicality rather than theoretical perfection",
  "this approach might have scalability issues in larger projects",
  "traditional methods still have advantages in certain scenarios",
  "we need to consider more edge cases",
  "technology selection should be based more on team familiarity"
];

// Random selection function
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Random post content generation
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

// Random reply content generation
function generateReplyContent(topic) {
  const template = getRandomItem(replyContents);
  return template
    .replace(/{topic}/g, topic)
    .replace(/{solution}/g, getRandomItem(solutions))
    .replace(/{point}/g, getRandomItem(points))
    .replace(/{alternative}/g, getRandomItem(alternatives));
}

// Generate 100 posts
const newPosts = [];
const newReplies = [];

for (let i = 0; i < 100; i++) {
  const topic = getRandomItem(topics);
  const titleTemplate = getRandomItem(postTitles);
  const title = titleTemplate.replace(/{topic}/g, topic);
  const content = generatePostContent(topic);
  
  const postId = uuidv4();
  const categoryId = String(Math.floor(Math.random() * 4) + 1); // Random category 1-4
  
  const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(); // Random time in the past 30 days
  
  const post = {
    id: postId,
    title,
    content,
    authorId: userId,
    categoryId,
    createdAt,
    updatedAt: createdAt,
    viewCount: Math.floor(Math.random() * 100) // Random view count 0-99
  };
  
  newPosts.push(post);
  
  // Generate 1-5 replies for each post
  const replyCount = Math.floor(Math.random() * 5) + 1;
  for (let j = 0; j < replyCount; j++) {
    const reply = {
      id: uuidv4(),
      postId,
      content: generateReplyContent(topic),
      authorId: userId,
      createdAt: new Date(Date.parse(createdAt) + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() // Reply time 0-5 days after post
    };
    
    newReplies.push(reply);
  }
}

// Update database
db.posts = newPosts;
db.replies = newReplies;

// Write to file
fs.writeFileSync('./db.json', JSON.stringify(db, null, 2), 'utf8');

console.log(`Successfully generated ${newPosts.length} posts and ${newReplies.length} replies`); 