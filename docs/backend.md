下面是一份**个人博客网站设计文档 v1.0**，偏工程落地。

# 个人博客网站设计文档

## 1. 项目定位

个人博客网站用于展示个人信息、技术文章、项目经历与作品内容，同时支持后台登录、文章发布、编辑、分类管理、评论管理等功能。

核心目标：

展示个人品牌；沉淀技术文章；支持后台内容管理；具备可扩展、可维护、可部署的工程结构。

---

# 2. 技术架构

## 2.1 整体架构

```text
用户浏览器
   ↓
前端应用 Vue / React
   ↓ HTTP API
后端服务 FastAPI
   ↓
数据库 PostgreSQL
   ↓
对象存储 / 本地存储
```

推荐初版架构：

```text
前端：Vue 3 + Vite + TypeScript
后端：FastAPI
数据库：PostgreSQL
缓存：Redis，可后期加入
部署：Docker + Nginx + HTTPS
```

---

# 3. 后端模块设计

## 3.1 用户与登录模块

### 功能

用于管理员登录后台，普通访客不需要登录。

### 基本能力

```text
管理员登录
JWT Token 鉴权
Token 过期刷新
修改密码
退出登录
权限校验
```

### 表设计：user

```sql
user
- id
- username
- password_hash
- nickname
- avatar
- role
- status
- created_at
- updated_at
```

### 权限模型

初版可以只做三角色：

```text
admin：拥有全部后台权限
visitor：匿名访问者，仅浏览
user：已登录，可创建可阅读可评论
```



---

## 3.2 主页展示模块

主页是个人博客的核心入口。

### 展示内容

```text
个人介绍
头像 / 背景图
技术栈标签
精选文章
精选项目
最新动态
联系方式
GitHub / 邮箱 / 简历入口
```

### 后端支持

可以设计一个站点配置表，用来动态管理主页内容。

### 表设计：site_config

```sql
site_config
- id
- key
- value
- description
- updated_at
```

示例：

```text
site_title = "Mahmud's Blog"
site_subtitle = "Backend / AI / Web Design"
home_intro = "专注于后端工程、AI Agent 与系统设计"
github_url = "..."
email = "..."
```

---

## 3.3 文章发布模块

这是博客系统的核心模块。

### 功能

```text
创建文章
编辑文章
删除文章
文章草稿
文章发布
文章置顶
文章推荐
文章封面图
Markdown 内容
文章预览
文章阅读量统计
```

### 表设计：article

```sql
article
- id
- title
- slug
- summary
- content
- cover_image
- status
- is_top
- is_featured
- view_count
- author_id
- category_id
- created_at
- updated_at
- published_at
```

### status 字段

```text
draft：草稿
published：已发布
hidden：隐藏
deleted：软删除
```

### slug 作用

例如：

```text
/blog/docker-deploy-guide
/blog/llm-agent-routing-design
```

比直接用 ID 更适合 SEO 和分享。

---

## 3.4 分类与标签模块

### 分类 Category

用于文章主分类。

```text
后端工程
AI Agent
前端设计
部署运维
学习笔记
```

### 标签 Tag

用于更细粒度的内容标记。

```text
Docker
PostgreSQL
FastAPI
LangChain
Vue
CI/CD
```

### 表设计

```sql
category
- id
- name
- slug
- description
- sort_order
```

```sql
tag
- id
- name
- slug
```

```sql
article_tag
- article_id
- tag_id
```

---

## 3.5 评论模块

初版可以选择不开启，或者只做简单评论。

### 功能

```text
游客评论
评论审核
评论删除
防垃圾评论
回复评论
```

### 表设计：comment

```sql
comment
- id
- article_id
- parent_id
- nickname
- email
- content
- status
- ip_address
- user_agent
- created_at
```

### 工程注意

评论模块容易被刷，需要考虑：

```text
验证码
IP 限流
敏感词过滤
人工审核
邮箱格式校验
```

---

## 3.6 文件上传模块

用于上传文章封面、Markdown 图片、头像等。

### 功能

```text
图片上传
文件类型校验
文件大小限制
图片压缩
生成访问 URL
```

### 存储方案

初版：

```text
服务器本地存储 + Nginx 静态资源访问
```

后期：

```text
OSS / S3 / Cloudflare R2
```

### 表设计：media

```sql
media
- id
- filename
- original_name
- url
- mime_type
- size
- uploader_id
- created_at
```

---

# 4. API 设计

## 4.1 登录接口

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## 4.2 文章接口

```http
GET    /api/articles
GET    /api/articles/{slug}
POST   /api/admin/articles
PUT    /api/admin/articles/{id}
DELETE /api/admin/articles/{id}
```

## 4.3 分类标签接口

```http
GET  /api/categories
GET  /api/tags
POST /api/admin/categories
POST /api/admin/tags
```

## 4.4 文件上传接口

```http
POST /api/admin/upload/image
```

## 4.5 主页配置接口

```http
GET /api/site/config
PUT /api/admin/site/config
```

---

# 5. 前端页面设计

## 5.1 访客端页面

```text
首页 /
文章列表 /blog
文章详情 /blog/:slug
分类页 /category/:slug
标签页 /tag/:slug
项目展示 /projects
关于我 /about
归档页 /archive
搜索页 /search
```

## 5.2 管理后台页面

```text
/admin/login
/admin/dashboard
/admin/articles
/admin/articles/create
/admin/articles/edit/:id
/admin/categories
/admin/tags
/admin/comments
/admin/settings
```

---

# 6. 工程性考虑

## 6.1 安全性

需要重点考虑：

```text
密码加密存储，不能明文保存
JWT 过期机制
后台接口权限校验
上传文件类型限制
SQL 注入防护
XSS 防护
CSRF 防护
接口限流
后台登录失败次数限制
```

文章内容如果支持 Markdown，需要注意：

```text
Markdown 转 HTML 时过滤危险标签
禁止 script 注入
图片链接校验
```

---

## 6.2 可维护性

后端建议分层：

```text
Controller / Router：处理请求
Service：业务逻辑
Repository / ORM：数据库访问
Schema / DTO：参数校验
Model：数据模型
```

示例结构：

```text
backend/
  app/
    api/
    core/
    models/
    schemas/
    services/
    repositories/
    utils/
```

---

## 6.3 性能优化

初版重点：

```text
文章列表分页
文章详情缓存
热门文章缓存
图片压缩
静态资源 CDN
数据库索引
```

数据库索引建议：

```sql
article.slug
article.status
article.created_at
article.category_id
tag.slug
category.slug
```

---

## 6.4 SEO

个人博客很适合做 SEO。

需要支持：

```text
文章 slug
页面 title
meta description
站点地图 sitemap.xml
robots.txt
RSS 订阅
Open Graph 分享卡片
服务端渲染或静态生成
```

如果前端用 Vue，可以考虑：

```text
Nuxt
Vite SSR
预渲染
```

如果初版不追求 SEO，可以先用普通 SPA。

---

## 6.5 日志与监控

后端需要记录：

```text
接口访问日志
错误日志
登录日志
文章操作日志
上传日志
```

后期可加入：

```text
Sentry 错误监控
Prometheus + Grafana
Nginx access log 分析
```

---

## 6.6 部署方案

推荐部署结构：

```text
Nginx
 ├── 前端静态文件
 ├── /api 转发到后端容器
 └── /media 访问上传文件

Docker
 ├── frontend
 ├── backend
 ├── postgres
 └── redis
```

简化版也可以：

```text
前端 build 后交给 Nginx
后端单独 Docker 容器运行
数据库使用宿主机 PostgreSQL
```

---

# 7. Docker 工程设计

建议使用 Docker Compose：

```text
docker-compose.yml
.env
backend/Dockerfile
frontend/Dockerfile
nginx/default.conf
```

服务包括：

```text
frontend
backend
postgres
redis
nginx
```

环境变量：

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=blog
DB_USER=blog_user
DB_PASSWORD=xxx

JWT_SECRET=xxx
UPLOAD_DIR=/app/media
```

---

# 8. 版本规划

## v1.0 最小可用版本

```text
管理员登录
文章发布
文章列表
文章详情
分类标签
首页展示
后台管理
图片上传
Docker 部署（我自己手操）
```
> 将配置信息独立出来，或者写到env中留空，我来补充
> 暂时需要对接外部或其他接口的同样留空

## v1.1 增强版本

```text
评论系统
搜索功能
RSS
文章归档
阅读量统计
站点配置后台化
```

## v2.0 高级版本

```text
全文搜索
AI 摘要
AI 自动标签
文章推荐
访问数据看板
多用户协作
主题切换
暗色模式
```

---

# 9. 推荐初版开发顺序

```text
1. 后端项目初始化
2. 用户登录与 JWT
3. 文章数据模型
4. 文章 CRUD
5. 分类与标签
6. 前端首页
7. 文章列表与详情页
8. 后台管理页
9. 图片上传
10. Docker 部署
11. Nginx 反向代理
12. HTTPS 配置
```

---

# 10. 总结

这个个人博客系统不只是一个展示页面，而是一个小型 CMS 系统。

它的核心工程价值在于：

```text
内容管理
权限控制
前后端分离
数据库建模
文件上传
安全防护
部署运维
性能优化
SEO 支持
```

如果你想练工程能力，建议不要只做静态博客，而是做成：

```text
个人主页 + 技术文章 CMS + 后台管理系统 + Docker 部署
```

这样它既能作为个人作品展示，也能体现完整后端工程能力。
