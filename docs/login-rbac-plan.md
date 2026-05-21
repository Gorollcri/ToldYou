# 登录与 RBAC 工程化方案

## 1. 目标

本文档基于当前 `ToldYou` 项目现状，整理一版适合当前阶段的登录与 RBAC 方案。

这次的目标已经明确收敛为：

- 全站强制登录
- 不再保留游客访问能力
- 不开放注册
- 账号仅由内部创建与分发
- 角色只保留 `admin` 和 `member`
- `admin` 拥有全量权限
- `member` 仅能操作自己的内容和自己的个人资料

这意味着网站产品形态不再是“公开博客 + 后台”，而是“内部受限访问的登录内容系统”。

---

## 2. 本轮已确认的产品规则

### 2.1 访问规则

- 未登录用户不能访问任何页面内容
- 前端启动后立即检查登录态
- 无 token 或 token 失效时，统一跳转到 `/login`
- 登录前看不到首页、文章页、关于页、项目页等任何站内内容

### 2.2 账号来源

- 不做注册
- 所有账号均由 `admin` 在后台创建
- 网站属于“有限账户邀请制”

### 2.3 角色定义

系统只保留两个角色：

- `admin`
- `member`

角色含义：

- `admin`
  - 拥有站内全部权限
  - 可管理用户
  - 可管理所有文章
  - 可管理分类、标签、上传资源、站点配置
  - 可查看和修改任意用户信息
- `member`
  - 视为被邀请进入站点的普通用户
  - 只能管理自己的资料
  - 只能管理自己创建的内容
  - 不能管理站内公共资源
  - 不能管理其他用户

### 2.4 内容归属规则

- 历史文章统一归属 `admin`
- 新文章遵循“谁创建归谁”
- `member` 只能查看和编辑自己名下内容
- `admin` 可查看和编辑所有内容

### 2.5 登录后默认页

- 登录成功后跳回 `#/`
- 也就是当前系统的默认首页路由

---

## 3. 当前代码现状

### 3.1 后端现状

当前后端已经具备最小认证能力：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

当前鉴权机制：

1. 用户提交 `username + password`
2. 后端校验 `users` 表
3. 登录成功后签发 JWT
4. 前端携带 `Authorization: Bearer <token>` 访问接口
5. 后端通过 `get_current_user` 和 `require_admin` 做鉴权

当前问题在于：

- 权限判断只有 `admin`
- 没有“本人资源”和“公共资源”的边界
- 没有完整用户管理接口
- 没有本人资料修改和本人改密接口
- 文章权限还没有按作者归属做隔离

### 3.2 前端现状

前端已经有：

- token 持久化
- 启动时调用 `/api/auth/me`
- token 失效后清空登录态
- 后台登录页和后台页面

但当前前端还是“后台管理员登录”模式，不是“全站门禁 + 登录后使用站点”模式。

需要升级的点：

- 路由初始化就做登录拦截
- 登录页从“后台入口”变成“全站入口”
- 导航栏展示当前用户信息
- 提供个人中心与个人资料页
- 根据角色动态限制页面入口

---

## 4. 目标形态

### 4.1 产品形态

建议将系统统一定义为：

- 一个全站必须登录的内部内容系统
- 登录后才可浏览与操作内容
- 内容权限基于“角色 + 资源归属”判断

### 4.2 权限模型

本轮不做复杂权限表，采用工程上更稳的两层模型：

1. 角色权限
2. 资源归属权限

即：

- 角色决定能否管理某类资源
- 作者归属决定能否操作某条内容

这是当前阶段最合适的 RBAC 实现方式。

---

## 5. 角色与权限设计

### 5.1 角色定义

```text
admin
member
```

### 5.2 权限矩阵

#### admin

- 可访问所有前台与后台页面
- 可访问所有 `/api/admin/*`
- 可管理所有文章
- 可管理所有用户
- 可管理分类
- 可管理标签
- 可上传资源
- 可管理站点配置
- 可查看与修改任意账号资料
- 可重置任意账号密码
- 可启用或禁用任意账号

#### member

- 可登录并访问站内页面
- 可读取自己的用户资料
- 可修改自己的资料
- 可修改自己的密码
- 可创建文章
- 可查看自己的文章列表
- 可编辑自己的文章
- 可删除或隐藏自己的文章
- 不可管理其他用户
- 不可管理分类、标签、站点配置等公共资源
- 不可编辑其他人的文章

### 5.3 核心判断规则

对于文章类资源，建议统一规则：

- `admin`：不受作者归属限制
- `member`：必须满足 `article.author_id == current_user.id`

后续如果有评论、草稿箱、附件等资源，也沿用同样思路。

---

## 6. 认证与授权设计

### 6.1 认证设计

当前阶段继续沿用 JWT access token 即可。

建议 token 仅包含最小必要字段：

- `sub`
- `role`

真正的用户状态仍以后端数据库为准。

建议补齐：

- 登录成功后更新 `last_login_at`
- `status != active` 时禁止登录
- 被禁用用户即使持有旧 token，也不能继续访问受保护接口

### 6.2 授权设计

建议从当前单一的 `require_admin` 升级为以下依赖：

- `get_current_user`
- `require_admin`
- `require_owner_or_admin`

说明：

- `require_admin`
  - 用于用户管理、分类管理、标签管理、站点配置等公共资源
- `require_owner_or_admin`
  - 用于文章详情、文章编辑、文章删除等“需要判断归属”的接口

如果实现层面更清晰，也可以拆为：

- 路由层只注入 `current_user`
- service 层执行 `can_manage_article(current_user, article)` 判定

从当前项目规模看，后者可维护性会更好。

---

## 7. 数据模型设计

### 7.1 users 表建议

当前 `users` 表可继续沿用，但建议补充字段：

- `bio`
- `last_login_at`

建议字段：

```text
id
username
password_hash
nickname
avatar
bio
role                admin / member
status              active / disabled
created_at
updated_at
last_login_at
```

字段说明：

- `nickname`：导航栏和作者展示名称
- `avatar`：导航、个人页、作者卡片使用
- `bio`：个人页与作者展示补充信息
- `last_login_at`：后台管理和审计观察

### 7.2 article 表

当前保留：

- `author_id`

规则明确为：

- 旧数据统一归 `admin`
- 新建文章自动写入当前用户 ID

不建议把作者名、昵称冗余写入 `article` 表，保持通过关联查询输出。

---

## 8. API 设计

### 8.1 保留接口

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 8.2 新增认证相关接口

建议新增：

```http
PUT /api/auth/me/profile
PUT /api/auth/me/password
```

职责：

- `PUT /api/auth/me/profile`
  - 修改自己的昵称、头像、bio
- `PUT /api/auth/me/password`
  - 修改自己的密码
  - 必须校验旧密码

### 8.3 用户管理接口

由于不开放注册，用户生命周期全部交给 `admin`。

建议新增：

```http
GET    /api/admin/users
GET    /api/admin/users/{id}
POST   /api/admin/users
PUT    /api/admin/users/{id}
PUT    /api/admin/users/{id}/password
PUT    /api/admin/users/{id}/status
```

接口边界：

- 仅 `admin` 可访问
- `member` 无权进入该模块

### 8.4 内容接口调整建议

文章类接口需要分为两层视角：

#### 全站文章浏览

登录后即可看站内内容，因此前台文章列表、详情接口仍可保留，但必须要求已登录。

即：

- `GET /api/articles`
- `GET /api/articles/{slug}`

这些接口从“公开接口”变成“登录后接口”。

#### 内容管理接口

建议按角色和归属做限制：

- `admin`
  - 可查看所有文章
  - 可编辑所有文章
- `member`
  - 仅可查看自己的管理列表
  - 仅可编辑自己的文章

当前后台接口建议最终呈现为：

```http
GET    /api/admin/articles
GET    /api/admin/articles/{id}
POST   /api/admin/articles
PUT    /api/admin/articles/{id}
DELETE /api/admin/articles/{id}
```

其中行为规则：

- 列表：
  - `admin` 返回全量
  - `member` 仅返回自己的文章
- 创建：
  - 自动写入当前用户为作者
- 详情 / 修改 / 删除：
  - `admin` 不受限
  - `member` 只能操作自己的文章

### 8.5 公共资源接口

以下接口建议仅 `admin` 可管理：

- 分类管理
- 标签管理
- 上传管理
- 站点配置管理

如果业务上以后需要让 `member` 上传图片，可单独开放“仅限本人内容使用的上传接口”。

但按你目前的要求，这轮先视作公共资源，不开放给 `member`。

---

## 9. 前端路由与页面设计

### 9.1 路由门禁

前端需要从“后台独立登录页”升级为“全站登录门禁”。

建议路由行为：

1. 应用启动时检查本地 token
2. 如果没有 token，直接跳 `#/login`
3. 如果有 token，调用 `/api/auth/me`
4. 校验失败则清空 token 并跳 `#/login`
5. 校验成功后才允许进入其他页面

### 9.2 页面形态

建议保留和新增的页面：

```text
/login
/
/articles
/articles/:slug
/about
/projects
/me
/me/profile
/me/password
/admin
/admin/articles
/admin/articles/:id
/admin/articles/new
/admin/users
/admin/users/:id
```

说明：

- `/login`：唯一登录入口
- `/`：登录后默认首页
- `/me`：个人中心
- `/me/profile`：编辑个人资料
- `/me/password`：修改密码
- `/admin/*`：后台管理区

### 9.3 导航栏设计

由于不再有游客态，导航栏永远基于“已登录用户”展示。

建议导航包含：

- 首页
- 帖子
- 项目
- 关于
- 当前用户头像 / 昵称
- 个人中心入口
- 退出登录

如果当前用户是 `admin`，额外显示：

- 后台入口

如果当前用户是 `member`，是否显示后台入口取决于你是否希望 member 通过后台页管理自己的文章。

基于你目前“member 有自己 CRUD 能力”的要求，我建议：

- `member` 也允许进入后台
- 但后台只显示自己有权访问的模块

### 9.4 后台导航

#### admin 可见

- Dashboard
- Articles
- Users
- Categories
- Tags
- Settings
- Upload

#### member 可见

- Dashboard
- My Articles
- New Article
- My Profile

这样最符合“member 是普通被邀请用户，但能管理自己内容”的定位。

---

## 10. 前端权限控制原则

前端权限控制只负责：

- 页面入口显隐
- 无权限页面跳转
- 按角色展示菜单

真正权限裁决必须以后端为准。

建议前端派生状态：

- `isAuthenticated`
- `isAdmin`
- `isMember`

以及内容归属相关判断尽量以后端返回列表结果为准，不在前端自行猜测。

---

## 11. 用户体验设计建议

### 11.1 登录页定位

登录页文案不应再写成“后台登录”。

建议改成：

- 站点登录
- 受邀账号登录
- 内部访问入口

### 11.2 登录后首页

你已经明确登录后回 `#/`。

因此首页建议调整为：

- 登录后可访问的站内首页
- 展示文章、项目、个人品牌信息
- 同时在页面头部或角落清晰展示当前登录人身份

### 11.3 个人中心

个人中心建议至少有：

- 头像
- 昵称
- 用户名
- 角色
- bio
- 最近登录时间
- 我的文章入口
- 修改资料入口
- 修改密码入口

如果是 `admin`，可额外显示管理入口。

---

## 12. 文章作者展示建议

虽然全站已登录，但作者展示仍然值得保留。

建议文章列表和文章详情返回：

```json
{
  "author": {
    "id": 1,
    "username": "admin",
    "nickname": "Site Admin",
    "avatar": "/media/avatar/admin.png"
  }
}
```

这样前端可以自然展示：

- 作者昵称
- 作者头像
- 内容归属感

同时也方便 `member` 在自己的视角下确认哪些内容属于自己。

---

## 13. 工程实现建议

### 13.1 后端模块建议

建议新增或调整：

```text
backend/app/api/routes/users.py
backend/app/services/user.py
backend/app/schemas/user.py
```

建议补充常量管理：

```python
ROLE_ADMIN = "admin"
ROLE_MEMBER = "member"

STATUS_ACTIVE = "active"
STATUS_DISABLED = "disabled"
```

### 13.2 用户相关 schema

建议新增：

- `UserSummary`
- `UserDetail`
- `UserCreate`
- `UserUpdate`
- `UserPasswordReset`
- `UserStatusUpdate`
- `SelfProfileUpdate`
- `SelfPasswordUpdate`

### 13.3 文章权限实现建议

建议在文章 service 层增加统一判断函数，例如：

```python
can_manage_article(current_user, article)
```

规则：

- `admin` 返回 `True`
- `member` 仅当 `article.author_id == current_user.id` 返回 `True`

这样可以避免在每个路由里散落权限判断。

### 13.4 文章列表返回策略

建议后台文章列表接口在 service 层根据角色自动收口：

- `admin`：查全部
- `member`：自动附加 `author_id = current_user.id`

这样前端不需要额外带“只看我的文章”参数才能保证安全。

---

## 14. 数据迁移建议

当前项目仍通过 `Base.metadata.create_all()` 初始化表结构。

如果这轮要新增：

- `bio`
- `last_login_at`
- 角色枚举收口

建议尽快引入迁移机制，例如 `Alembic`。

如果这轮还不引入，至少要明确一次性数据修正动作：

1. 旧文章全部归属 `admin`
2. 旧用户角色统一修正到 `admin` 或 `member`
3. 后续创建文章自动落当前用户 ID

---

## 15. 推荐实施顺序

### 第一阶段：后端权限模型收口

- 角色从现状收口为 `admin/member`
- 增加用户资料与改密接口
- 增加用户管理接口
- 增加文章归属权限判断
- 文章列表按角色自动过滤

### 第二阶段：前端全站登录门禁

- 加入 `/login`
- 非登录态统一跳转登录页
- 登录成功跳回 `#/`
- token 失效自动清理并重新登录

### 第三阶段：前端个人中心与导航

- 顶部导航展示当前用户
- 增加个人中心
- 增加资料修改页
- 增加密码修改页

### 第四阶段：后台按角色裁剪

- `admin` 显示完整后台
- `member` 仅显示自己的内容管理入口

### 第五阶段：文章作者展示

- 前台文章卡片展示作者
- 文章详情展示作者摘要

---

## 16. 最终结论

当前项目下一步最合适的方向，已经不是“公开博客补登录”，而是：

- 一个必须登录才能访问的内部站点
- 一个由 `admin` 统一发放账号的有限用户系统
- 一个只有 `admin/member` 两角色的简化 RBAC
- 一个通过“作者归属”控制内容权限的内容管理系统

最终推荐方案如下：

- 放弃游客态，前端统一登录拦截
- 登录成功默认回 `#/`
- 只保留 `admin` 和 `member`
- `admin` 拥有全量权限
- `member` 只拥有自己的资料与自己的内容 CRUD 能力
- 旧文章统一归属 `admin`
- 新文章谁创建归谁
- 公共资源管理仅开放给 `admin`

这版方案已经可以直接作为后续代码实现的基线文档。
