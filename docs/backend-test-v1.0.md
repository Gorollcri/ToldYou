# ToldYou 后端 v1.0 测试文档

## 1. 测试目标

验证个人博客后端 v1.0 的最小可用能力是否符合需求文档：

- 管理员登录
- 文章发布与后台管理
- 文章列表与详情
- 分类与标签
- 首页站点配置
- 图片上传
- Docker 启动能力

本文档面向手工测试，覆盖接口、功能、异常场景与验收重点。

## 2. 测试范围

### 2.1 已实现模块

- 认证模块
- 文章模块
- 分类模块
- 标签模块
- 站点配置模块
- 图片上传模块
- 健康检查

### 2.2 本版本未纳入测试

- 评论模块
- 搜索专用接口
- RSS
- 归档
- 阅读量看板
- HTTPS / Nginx 联调

## 3. 测试环境准备

## 3.1 本地运行

项目目录：`backend/`

环境文件：

- Docker 模式使用 [backend/.env](</d:/vscode/Web/ToldYou/backend/.env>)
- 本地 SQLite 参考 [backend/.env.example](</d:/vscode/Web/ToldYou/backend/.env.example>)

启动方式一：本地 Python

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

启动方式二：Docker Compose

```powershell
docker compose up --build
```

接口文档：

- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## 3.2 默认管理员

- 用户名：`admin`
- 密码：`Admin123456`

首次启动后应自动创建管理员与默认站点配置。

## 3.3 基础验收数据建议

建议先准备以下数据，方便后续串联测试：

1. 创建分类 `后端工程`
2. 创建分类 `AI Agent`
3. 创建标签 `FastAPI`
4. 创建标签 `PostgreSQL`
5. 上传 1 张封面图
6. 创建 1 篇草稿文章
7. 创建 1 篇已发布文章

## 4. 接口清单

### 4.1 系统

- `GET /health`

### 4.2 认证

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 4.3 文章

- `GET /api/articles`
- `GET /api/articles/{slug}`
- `GET /api/admin/articles`
- `GET /api/admin/articles/{id}`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/{id}`
- `DELETE /api/admin/articles/{id}`

### 4.4 分类标签

- `GET /api/categories`
- `POST /api/admin/categories`
- `GET /api/tags`
- `POST /api/admin/tags`

### 4.5 站点配置

- `GET /api/site/config`
- `PUT /api/admin/site/config`

### 4.6 上传

- `POST /api/admin/upload/image`

## 5. 功能测试用例

## 5.1 健康检查

### 用例 HC-01

- 目标：验证服务正常启动
- 请求：`GET /health`
- 预期：
- 返回 `200`
- 响应包含 `status=ok`
- 响应包含 `environment`

## 5.2 认证模块

### 用例 AU-01 管理员登录成功

- 前置条件：服务首次启动完成，默认管理员已创建
- 请求：`POST /api/auth/login`
- 请求体：

```json
{
  "username": "admin",
  "password": "Admin123456"
}
```

- 预期：
- 返回 `200`
- 返回 `access_token`
- `token_type` 为 `bearer`

### 用例 AU-02 管理员登录失败

- 请求密码错误
- 预期：
- 返回 `401`
- 提示用户名或密码错误

### 用例 AU-03 获取当前用户信息

- 前置条件：已登录，带 `Authorization: Bearer <token>`
- 请求：`GET /api/auth/me`
- 预期：
- 返回 `200`
- 返回字段包含 `id` `username` `nickname` `role` `status`
- `role=admin`

### 用例 AU-04 未登录访问 me

- 请求：不带 token
- 预期：
- 返回 `401`

### 用例 AU-05 退出登录

- 请求：`POST /api/auth/logout`
- 预期：
- 返回 `200`
- 返回提示客户端清理 token

## 5.3 分类模块

### 用例 CA-01 新建分类成功

- 前置条件：已登录管理员
- 请求：`POST /api/admin/categories`
- 请求体：

```json
{
  "name": "后端工程",
  "description": "后端相关文章",
  "sort_order": 10
}
```

- 预期：
- 返回 `201`
- 自动生成 `slug`
- 返回字段包含 `id` `name` `slug`

### 用例 CA-02 分类重名或 slug 冲突

- 重复提交相同 `name` 或 `slug`
- 预期：
- 返回 `409`

### 用例 CA-03 游客获取分类列表

- 请求：`GET /api/categories`
- 预期：
- 返回 `200`
- 数据按 `sort_order` 升序

### 用例 CA-04 非管理员创建分类

- 使用无效 token 或不带 token
- 预期：
- 返回 `401` 或 `403`

## 5.4 标签模块

### 用例 TA-01 新建标签成功

- 前置条件：已登录管理员
- 请求：`POST /api/admin/tags`
- 请求体：

```json
{
  "name": "FastAPI"
}
```

- 预期：
- 返回 `201`
- 自动生成 slug

### 用例 TA-02 标签重复

- 重复创建同名标签
- 预期：
- 返回 `409`

### 用例 TA-03 游客获取标签列表

- 请求：`GET /api/tags`
- 预期：
- 返回 `200`

## 5.5 图片上传模块

### 用例 UP-01 上传图片成功

- 前置条件：已登录管理员
- 请求：`POST /api/admin/upload/image`
- `Content-Type: multipart/form-data`
- 文件：`jpg/png/webp/gif`
- 预期：
- 返回 `201`
- 返回 `url`
- 浏览器访问该 `url` 可直接获取图片
- 数据落库到 `media` 表

### 用例 UP-02 上传非图片文件

- 上传 `.txt` 或其他不支持类型
- 预期：
- 返回 `400`

### 用例 UP-03 上传超限文件

- 上传大于 `MAX_UPLOAD_SIZE_MB` 的文件
- 预期：
- 返回 `400`

### 用例 UP-04 未登录上传

- 不带 token
- 预期：
- 返回 `401`

## 5.6 文章模块

### 用例 AR-01 创建草稿文章

- 前置条件：
- 已登录管理员
- 至少已有 1 个分类与 1 个标签
- 请求：`POST /api/admin/articles`
- 请求体示例：

```json
{
  "title": "FastAPI 博客后端设计",
  "summary": "介绍博客后端的模块拆分",
  "content": "# 标题\n\n正文内容",
  "status": "draft",
  "is_top": false,
  "is_featured": false,
  "category_id": 1,
  "tag_ids": [1, 2]
}
```

- 预期：
- 返回 `201`
- 自动生成 `slug`
- `published_at` 为空
- 正确关联分类和标签

### 用例 AR-02 创建已发布文章

- 将 `status` 设置为 `published`
- 预期：
- 返回 `201`
- `published_at` 不为空

### 用例 AR-03 文章 slug 自动去重

- 创建两篇同标题文章
- 预期：
- 第二篇文章 slug 自动追加后缀

### 用例 AR-04 使用不存在的分类

- `category_id` 指向不存在 ID
- 预期：
- 返回 `400`

### 用例 AR-05 使用不存在的标签

- `tag_ids` 包含不存在 ID
- 预期：
- 返回 `400`

### 用例 AR-06 管理端文章列表

- 请求：`GET /api/admin/articles?page=1&page_size=10`
- 预期：
- 返回 `200`
- 返回分页结构：
- `total`
- `page`
- `page_size`
- `items`
- 草稿与已发布文章都可见

### 用例 AR-07 管理端按状态筛选

- 请求：`GET /api/admin/articles?status=draft`
- 预期：
- 返回 `200`
- 只返回草稿

### 用例 AR-08 获取管理端文章详情

- 请求：`GET /api/admin/articles/{id}`
- 预期：
- 返回 `200`
- 返回完整 `content`

### 用例 AR-09 更新文章

- 请求：`PUT /api/admin/articles/{id}`
- 示例更新体：

```json
{
  "title": "FastAPI 博客后端设计 V2",
  "status": "published",
  "is_featured": true
}
```

- 预期：
- 返回 `200`
- 标题更新成功
- 若从草稿改为已发布，则补充 `published_at`

### 用例 AR-10 删除文章

- 请求：`DELETE /api/admin/articles/{id}`
- 预期：
- 返回 `200`
- 响应提示删除成功
- 实际为软删除，`status=deleted`

### 用例 AR-11 游客获取文章列表

- 请求：`GET /api/articles`
- 预期：
- 返回 `200`
- 只返回 `published` 状态文章
- 不返回 `draft` `hidden` `deleted`

### 用例 AR-12 游客获取文章详情

- 请求：`GET /api/articles/{slug}`
- 预期：
- 返回 `200`
- 仅可查看已发布文章
- `view_count` 增加 1

### 用例 AR-13 访问未发布文章详情

- 使用草稿或隐藏文章 slug
- 预期：
- 返回 `404`

### 用例 AR-14 文章列表按分类过滤

- 请求：`GET /api/articles?category=backend`
- 预期：
- 返回 `200`
- 只返回对应分类的已发布文章

### 用例 AR-15 文章列表按标签过滤

- 请求：`GET /api/articles?tag=fastapi`
- 预期：
- 返回 `200`

### 用例 AR-16 文章列表关键字搜索

- 请求：`GET /api/articles?keyword=FastAPI`
- 预期：
- 返回 `200`
- 标题或摘要命中的文章会返回

## 5.7 站点配置模块

### 用例 SC-01 获取站点配置

- 请求：`GET /api/site/config`
- 预期：
- 返回 `200`
- 首次启动即存在默认配置项：
- `site_title`
- `site_subtitle`
- `home_intro`
- `github_url`
- `email`

### 用例 SC-02 更新站点配置

- 前置条件：已登录管理员
- 请求：`PUT /api/admin/site/config`
- 请求体：

```json
{
  "items": [
    {
      "key": "site_title",
      "value": "My Tech Blog",
      "description": "网站标题"
    },
    {
      "key": "email",
      "value": "test@example.com",
      "description": "联系邮箱"
    }
  ]
}
```

- 预期：
- 返回 `200`
- 指定配置更新成功

### 用例 SC-03 新增配置项

- 提交不存在的 `key`
- 预期：
- 返回 `200`
- 自动新增配置项

## 6. 权限测试

### 用例 AC-01 所有后台接口必须鉴权

接口范围：

- `GET /api/admin/articles`
- `GET /api/admin/articles/{id}`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/{id}`
- `DELETE /api/admin/articles/{id}`
- `POST /api/admin/categories`
- `POST /api/admin/tags`
- `PUT /api/admin/site/config`
- `POST /api/admin/upload/image`

预期：

- 未带 token 返回 `401`
- 非法 token 返回 `401`

## 7. 数据与存储检查

### 用例 DB-01 表自动创建

- 首次启动后检查数据库
- 预期存在表：
- `users`
- `articles`
- `categories`
- `tags`
- `article_tags`
- `site_configs`
- `media`

### 用例 DB-02 默认数据初始化

- 预期：
- 自动创建默认管理员
- 自动创建默认站点配置

### 用例 DB-03 上传文件落盘

- 上传成功后检查 `backend/media/`
- 预期：
- 文件真实存在
- 与接口返回 `url` 可对应

## 8. Docker 测试

### 用例 DK-01 Compose 启动

- 命令：`docker compose up --build`
- 预期：
- `backend` 容器启动成功
- `postgres` 容器启动成功

### 用例 DK-02 容器内访问接口

- 访问：`http://127.0.0.1:8000/health`
- 预期：
- 返回 `200`

### 用例 DK-03 数据库连接

- 启动后创建分类或登录
- 预期：
- 后端可正常读写 postgres

## 9. 回归建议

每次修改后至少回归以下主链路：

1. 登录
2. 创建分类
3. 创建标签
4. 上传图片
5. 创建草稿文章
6. 发布文章
7. 游客查看文章列表
8. 游客查看文章详情
9. 修改站点配置
10. 删除文章

## 10. 当前已知实现说明

- 退出登录为无状态 JWT 方案，当前是客户端丢弃 token，不做服务端黑名单
- 删除文章为软删除，状态改为 `deleted`
- 公开文章列表只返回 `published`
- 图片上传当前为本地文件存储
- 评论、搜索、RSS 等未纳入 v1.0 实现
