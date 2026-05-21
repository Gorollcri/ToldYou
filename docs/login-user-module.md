# 登录与用户模块开发文档

## 1. 文档目标

本文档基于当前 `ToldYou` 项目现状，以及 `v1.0` 开发文档中“登录/用户”能力的规划，整理一份可直接落地的登录与用户模块开发方案。

适用范围：

- 后端：`FastAPI + SQLAlchemy + PostgreSQL`
- 前端：`Vue 3 + Vite + TypeScript`
- 当前阶段：从“单管理员博客后台”演进到“具备正式用户模块的内容系统”

---

## 2. 当前项目现状

### 2.1 已实现能力

当前项目已经具备最小可用的管理员登录能力：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

当前登录链路：

1. 用户提交用户名和密码
2. 后端校验 `users` 表中的账号信息
3. 验证通过后签发 JWT
4. 前端携带 `Authorization: Bearer <token>` 访问后台接口
5. 后台接口通过 `get_current_user` 和 `require_admin` 做鉴权

### 2.2 当前已有数据模型

当前 `users` 表字段已经满足基础登录需求：

```text
id
username
password_hash
nickname
avatar
role
status
created_at
updated_at
```

当前 `articles` 表已经和 `users` 建立作者关联：

```text
article.author_id -> users.id
```

这意味着项目不是“完全没有用户体系”，而是：

- 已有“账号表 + JWT 登录 + 管理员鉴权”
- 但还没有完整的“用户管理模块”
- 目前业务仍以“管理员后台发文”为主

### 2.3 当前约束与缺口

结合现状代码，当前登录/用户部分仍有以下缺口：

- 只有登录，没有注册、改密、用户管理、用户列表等模块
- `role` 目前只实际使用了 `admin`
- `article` 返回结构里只有 `author_id`，没有返回作者资料
- 没有正式数据库迁移体系，后续改表会有风险
- 没有登录失败限制、刷新 token、黑名单、审计日志
- 旧文章虽然有作者字段，但历史数据需要统一归属

---

## 3. 老文章同步策略

### 3.1 当前决策

现阶段先将所有历史文章统一归属给默认管理员 `admin`。

这样做的好处：

- 不阻塞用户模块开发
- 不需要现在就定义“历史文章真实作者”
- 可以保证后续作者页、文章作者信息展示逻辑稳定

### 3.2 已落地脚本

已新增脚本：

- [backend/scripts/reassign_articles_to_admin.py](/d:/vscode/Web/ToldYou/backend/scripts/reassign_articles_to_admin.py:1)

用途：

- 将数据库中所有 `articles.author_id` 统一改为指定管理员
- 默认使用 `.env` 中的 `ADMIN_USERNAME`

执行方式：

```powershell
cd backend
py scripts/reassign_articles_to_admin.py --dry-run
py scripts/reassign_articles_to_admin.py
```

如果后续管理员用户名不是 `admin`，也可以显式指定：

```powershell
py scripts/reassign_articles_to_admin.py --username admin
```

### 3.3 后续建议

在真正支持多用户发文前，导入脚本与后台新建文章都继续默认挂给当前管理员即可。等用户模块完整上线后，再决定是否支持：

- 文章转移作者
- 按 markdown frontmatter 指定作者导入
- 用户个人文章列表

---

## 4. 用户模块目标

### 4.1 v1.0 现实目标

结合当前项目节奏，建议先做“后台用户管理”而不是“开放注册社区”。

第一阶段目标：

- 管理员登录
- 获取当前用户信息
- 用户列表
- 新建用户
- 编辑用户资料
- 重置用户密码
- 启用/禁用用户
- 文章列表返回作者基础信息

这一阶段足够支撑：

- 多作者后台
- 作者信息展示
- 文章归属管理

### 4.2 暂不建议本阶段实现

以下能力可以后置：

- 公开注册
- 邮箱验证码
- 忘记密码
- Refresh Token
- 用户关注、互动、社交能力
- 细粒度 RBAC 权限系统

---

## 5. 角色与权限设计

### 5.1 角色建议

结合 `v1.0` 文档和当前项目代码，建议保留三类角色定义：

```text
admin
editor
user
```

说明：

- `admin`：站点管理员，拥有全部后台权限
- `editor`：内容编辑，可管理自己文章，视情况管理分类/标签
- `user`：普通登录用户，当前阶段仅保留账号能力，不默认开放后台

### 5.2 当前阶段权限边界

建议先这样收口：

- `admin`：访问所有 `/api/admin/*`
- `editor`：后续单独开放 `/api/editor/*` 或部分文章接口
- `user`：当前阶段只允许 `GET /api/auth/me`

当前代码里只有 `require_admin`，因此用户模块第一阶段可以先不引入复杂权限中间层，只新增：

- `require_roles("admin", "editor")`
- 或专门的 `require_staff`

---

## 6. 数据模型设计

### 6.1 users 表

当前表结构可继续沿用，建议新增或约束如下：

```text
username: 唯一，不允许为空
nickname: 展示名
avatar: 头像 URL
role: admin / editor / user
status: active / disabled
bio: 可选，作者简介
last_login_at: 可选，最后登录时间
```

其中 `bio`、`last_login_at` 不是立即必须，但如果要做作者展示页，`bio` 很实用。

### 6.2 article 表

当前保留：

```text
author_id
```

后续不建议把作者名冗余到 `article` 表里，直接通过关联查询即可。

---

## 7. API 设计建议

### 7.1 当前保留接口

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 7.2 建议新增后台用户接口

```http
GET    /api/admin/users
GET    /api/admin/users/{id}
POST   /api/admin/users
PUT    /api/admin/users/{id}
PUT    /api/admin/users/{id}/password
PUT    /api/admin/users/{id}/status
```

建议职责如下：

- `GET /api/admin/users`：用户列表，支持分页和角色筛选
- `GET /api/admin/users/{id}`：获取单个用户详情
- `POST /api/admin/users`：管理员创建账号
- `PUT /api/admin/users/{id}`：修改昵称、头像、角色等资料
- `PUT /api/admin/users/{id}/password`：重置密码
- `PUT /api/admin/users/{id}/status`：启用或禁用账号

### 7.3 建议新增当前用户自助接口

```http
PUT /api/auth/me/profile
PUT /api/auth/me/password
```

用途：

- 已登录用户修改自己的昵称、头像、简介
- 已登录用户修改自己的密码

### 7.4 文章接口增强

建议增强文章返回结构，在列表和详情中返回作者基础信息：

```json
{
  "id": 1,
  "title": "文章标题",
  "author": {
    "id": 1,
    "username": "admin",
    "nickname": "Site Admin",
    "avatar": null
  }
}
```

这样前端不需要额外查一次用户表就能展示作者信息。

---

## 8. 后端开发任务拆分

### 8.1 第一阶段：补全用户 Schema

建议新增：

- `UserSummary`
- `UserDetail`
- `UserCreate`
- `UserUpdate`
- `UserPasswordUpdate`
- `UserStatusUpdate`
- `SelfProfileUpdate`
- `SelfPasswordUpdate`

目标：

- 区分后台管理接口和当前用户自助接口
- 避免直接复用 ORM 输出，减少误暴露字段

### 8.2 第二阶段：补全用户 Service

建议新增 `backend/app/services/user.py`，职责包括：

- 查询用户列表
- 根据 ID 获取用户
- 创建用户
- 更新用户资料
- 修改密码
- 修改状态
- 校验用户名唯一性

### 8.3 第三阶段：新增用户路由

建议新增：

- `backend/app/api/routes/users.py`
- 在 `api/router.py` 中挂载 `/api/admin/users`

### 8.4 第四阶段：增强认证模块

建议逐步补充：

- 登录成功后记录 `last_login_at`
- 修改密码时校验旧密码
- 禁用用户后阻止继续访问受保护接口

### 8.5 第五阶段：增强文章作者返回

需要修改：

- `article service` 查询时 `joinedload(Article.author)`
- `article schema` 增加作者输出对象

---

## 9. 前端开发任务拆分

### 9.1 登录模块

当前前端需要保证：

- 登录页提交用户名密码
- 成功后缓存 token
- 后续请求自动携带 Bearer Token
- 启动时请求 `/api/auth/me` 恢复登录态
- 401 时自动清理本地 token 并跳回登录页

### 9.2 用户管理后台

建议页面：

```text
/admin/users
/admin/users/create
/admin/users/edit/:id
/admin/profile
```

页面能力：

- 用户列表
- 创建用户
- 编辑昵称/头像/角色/状态
- 重置密码
- 当前用户修改个人资料
- 当前用户修改密码

### 9.3 文章展示增强

文章列表页和文章详情页后续可增加：

- 作者昵称
- 作者头像
- 作者页入口

---

## 10. 数据库与迁移建议

### 10.1 当前风险

项目目前通过 `Base.metadata.create_all()` 初始化表，适合早期开发，但不适合后续持续改表。

随着用户模块扩展，建议尽快引入数据库迁移体系，否则会出现：

- 代码字段已新增，数据库实际没变
- 多环境结构不一致
- 数据修复脚本难以追踪

### 10.2 建议方案

建议后续引入 `Alembic`，至少覆盖以下变化：

- `users` 新增字段
- 字段长度或约束调整
- 索引补充
- 默认值变更
- 历史数据修复

---

## 11. 推荐开发顺序

```text
1. 执行老文章归属 admin 脚本
2. 给 article 返回结构补 author 信息
3. 新增用户 schemas
4. 新增 user service
5. 新增 admin users API
6. 新增当前用户资料/密码接口
7. 后台前端接入用户管理页
8. 视情况引入 Alembic
```

这个顺序的好处是：

- 先把历史数据收口
- 再把作者展示打通
- 最后再扩展正式用户管理

---

## 12. 验收标准

用户模块第一阶段完成后，至少应满足以下验收项：

### 12.1 登录能力

- 管理员可正常登录
- `/api/auth/me` 可返回当前用户资料
- 禁用用户不可登录

### 12.2 用户管理能力

- 管理员可分页查看用户列表
- 管理员可创建用户
- 管理员可编辑用户资料
- 管理员可重置用户密码
- 管理员可启用/禁用用户

### 12.3 作者展示能力

- 文章列表返回作者基础信息
- 文章详情返回作者基础信息
- 旧文章统一归属 `admin` 后不出现空作者

---

## 13. 结论

当前项目已经具备“登录功能”和“用户表”，但仍属于“单管理员后台博客”的实现阶段。下一步最合适的方向，不是直接做开放注册，而是先把用户模块做成后台能力：

- 管理员登录稳定
- 用户可被管理
- 文章作者信息完整
- 历史文章归属一致

这样既符合 `v1.0` 的最小可用目标，也能为后续多作者、作者展示页、评论系统和权限扩展打下稳定基础。
