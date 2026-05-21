# 登录与 RBAC 开发文档

## 1. 开发目标

- 全站改为强制登录访问
- 角色收口为 `admin`、`member`
- `admin` 管理全部资源
- `member` 只管理自己的资料和自己的文章
- 历史文章统一归属 `admin`
- 后端权限判断统一为“角色 + 资源归属”

---

## 2. 开发顺序

```text
阶段 1：后端数据与权限基线
阶段 2：后端用户与认证接口补齐
阶段 3：后端文章权限收口
阶段 4：前端全站登录门禁
阶段 5：前端个人中心
阶段 6：前端后台按角色裁剪
阶段 7：联调与数据修正
```

---

## 3. 阶段 1：后端数据与权限基线

### 3.1 先做内容

- 收口角色常量
- 收口状态常量
- 补齐 `users` 表字段
- 明确历史文章归属

### 3.2 具体修改

#### 用户模型

- 统一角色：
  - `admin`
  - `member`
- 统一状态：
  - `active`
  - `disabled`
- `users` 表补齐字段：
  - `bio`
  - `last_login_at`

建议字段形态：

```text
id
username
password_hash
nickname
avatar
bio
role
status
created_at
updated_at
last_login_at
```

#### 文章模型

- 保留 `author_id`
- 新建文章时强制写入当前用户 `id`
- 历史文章统一归属 `admin`

### 3.3 本阶段产出

- 角色/状态常量定义完成
- 用户模型字段调整完成
- 历史文章归属策略可执行

---

## 4. 阶段 2：后端用户与认证接口补齐

### 4.1 先做模块

- `backend/app/schemas/user.py`
- `backend/app/services/user.py`
- `backend/app/api/routes/users.py`
- `auth` 路由中的个人资料与改密接口

### 4.2 先补 schema

- `UserSummary`
- `UserDetail`
- `UserCreate`
- `UserUpdate`
- `UserPasswordReset`
- `UserStatusUpdate`
- `SelfProfileUpdate`
- `SelfPasswordUpdate`

要求：

- 管理员接口与本人接口分开
- 响应中不暴露 `password_hash`

### 4.3 再补 service

至少实现：

- 获取用户列表
- 获取用户详情
- 创建用户
- 更新用户资料
- 重置用户密码
- 更新用户状态
- 更新本人资料
- 修改本人密码
- 用户名唯一性校验

### 4.4 再补路由

新增管理员接口：

```http
GET    /api/admin/users
GET    /api/admin/users/{id}
POST   /api/admin/users
PUT    /api/admin/users/{id}
PUT    /api/admin/users/{id}/password
PUT    /api/admin/users/{id}/status
```

新增本人接口：

```http
PUT /api/auth/me/profile
PUT /api/auth/me/password
```

### 4.5 认证细节

- 登录成功后更新 `last_login_at`
- `status != active` 时禁止登录
- `get_current_user` 每次校验数据库状态
- 已禁用用户即使带旧 token 也不能继续访问
- 本人改密必须校验旧密码

### 4.6 本阶段产出

- 用户管理接口可用
- 本人资料/密码接口可用
- 登录态校验和禁用逻辑闭环

---

## 5. 阶段 3：后端文章权限收口

### 5.1 先做权限判断下沉

- 不在路由里散落写判断
- 在 article service 层统一处理

建议函数：

```python
can_manage_article(current_user, article)
```

规则：

- `admin` 直接允许
- `member` 必须满足 `article.author_id == current_user.id`

### 5.2 再调文章管理接口

目标接口：

```http
GET    /api/admin/articles
GET    /api/admin/articles/{id}
POST   /api/admin/articles
PUT    /api/admin/articles/{id}
DELETE /api/admin/articles/{id}
```

行为收口：

- 列表：
  - `admin` 返回全部
- 创建：
  - 忽略前端传入作者
  - 强制使用当前登录用户作为作者
- 详情 / 修改 / 删除：
  - `admin` 不受限

`member` 侧要求：

- 不进入 `/api/admin/articles`
- 通过单独的“本人文章接口”完成自己的 CRUD

建议补充接口：

```http
GET    /api/me/articles
GET    /api/me/articles/{id}
POST   /api/me/articles
PUT    /api/me/articles/{id}
DELETE /api/me/articles/{id}
```

行为规则：

- 列表仅返回当前登录用户自己的文章
- 创建时强制写入当前登录用户为作者
- 详情 / 修改 / 删除仅允许操作自己的文章
- 路由层只注入 `current_user`
- service 层统一复用文章归属校验

### 5.3 再调前台文章接口

- `GET /api/articles`
- `GET /api/articles/{slug}`

要求：

- 变为必须登录后访问
- 返回作者摘要信息

建议输出：

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

### 5.4 本阶段产出

- 文章权限闭环完成
- `member` 无法越权操作他人文章
- 前台文章接口切换为登录后接口

---

## 6. 阶段 4：前端全站登录门禁

### 6.1 先改路由初始化逻辑

执行顺序：

1. 应用启动读取本地 token
2. 无 token 直接跳 `#/login`
3. 有 token 则请求 `/api/auth/me`
4. 校验失败则清空 token 并跳 `#/login`
5. 校验成功后再放行页面渲染

### 6.2 再改登录页定位

- `/login` 改为全站唯一登录入口
- 页面文案去掉“后台登录”
- 登录成功统一跳回 `#/`

### 6.3 再改受保护页面范围

以下页面全部要求登录后访问：

```text
/
/articles
/articles/:slug
/about
/projects
/me
/me/profile
/me/password
/me/articles
/me/articles/:id
/me/articles/new
/admin
/admin/articles
/admin/articles/:id
/admin/articles/new
/admin/users
/admin/users/:id
```

### 6.4 本阶段产出

- 未登录用户无法进入任何站内页
- token 失效时自动回到登录页
- 登录页成为全站入口

---

## 7. 阶段 5：前端个人中心

### 7.1 先做用户态展示

导航栏增加：

- 当前用户头像
- 当前用户昵称
- 个人中心入口
- 退出登录入口

### 7.2 再做个人中心页

页面：

- `/me`
- `/me/profile`
- `/me/password`

展示内容：

- 头像
- 昵称
- 用户名
- 角色
- bio
- 最近登录时间

### 7.3 再接接口

- `/api/auth/me`
- `PUT /api/auth/me/profile`
- `PUT /api/auth/me/password`

细节：

- 修改资料成功后刷新当前用户信息
- 修改密码成功后建议重新登录

### 7.4 本阶段产出

- 已登录用户可维护自己的资料
- 已登录用户可修改自己的密码

---

## 8. 阶段 6：前端后台按角色裁剪

### 8.1 先做角色态派生

前端至少统一派生：

- `isAuthenticated`
- `isAdmin`
- `isMember`

### 8.2 再做管理区隔离

要求先明确：

- `member` 不进入后台
- `admin` 与 `member` 使用不同的功能视图
- `member` 的本人内容 CRUD 放在个人侧页面，不放在 `/admin/*`

### 8.3 再做后台菜单裁剪

#### admin 可见

- Dashboard
- Articles
- Users
- Categories
- Tags
- Settings
- Upload

#### member 可见

- 首页
- 帖子
- 项目
- 关于
- 个人中心
- 我的文章
- 新建文章
- 修改资料
- 修改密码

### 8.4 再做页面入口限制

- `admin` 可进入全部后台模块
- `member` 访问任意 `/admin/*` 直接拦截或跳转
- `member` 禁止进入用户管理、分类、标签、设置、上传等公共资源模块
- `member` 只能通过 `/me/*` 或独立前台管理页操作自己的内容

### 8.5 本阶段产出

- 后台只对 `admin` 开放
- `member` 与 `admin` 视图隔离完成
- `member` 仅保留本人内容与本人资料入口

---

## 9. 工程细节注意项

### 9.1 权限边界一致性

- 后端是唯一权限裁决点，前端显隐只负责体验
- `admin` 接口与 `member` 接口必须物理分开，避免在同一路由里混入分支权限
- 文章归属判断必须统一下沉到 service，不能在列表、详情、编辑、删除中各写一套
- `member` 不允许访问 `/admin/*`，前端和后端都要拦

### 9.2 幂等性

- `PUT /api/auth/me/profile` 必须保持幂等
- `PUT /api/auth/me/password` 重复提交时不能产生脏状态
- `PUT /api/admin/users/{id}`、`PUT /api/admin/users/{id}/status` 必须保持幂等
- 历史数据修正脚本必须可重复执行，重复执行后结果一致
- 文章软删除如果保留，重复删除同一资源时要有稳定返回

### 9.3 数据一致性

- 创建文章时作者只能以后端注入的当前用户为准，不能信前端传值
- `member` 的列表、详情、修改、删除四条链路必须使用同一套归属规则
- 历史文章归属修正必须先于 `member` 侧 CRUD 放开
- 用户昵称、头像、bio 修改后，`/api/auth/me` 与文章作者摘要返回口径要同步一致

### 9.4 数据库约束

- `username` 必须有唯一约束
- `article.slug` 必须有唯一约束
- 角色和值域不要只靠前端限制，数据库或模型层要收口
- 状态和值域不要只靠前端限制，数据库或模型层要收口

### 9.5 并发安全

- slug 生成不能只靠“先查后写”，数据库唯一约束必须兜底
- 创建用户不能只靠“先查用户名是否存在”，数据库唯一约束必须兜底
- 捕获唯一约束冲突后统一返回 `409`

### 9.6 事务边界

- 创建用户必须单事务完成
- 改密必须单事务完成
- 禁用用户必须单事务完成
- 历史文章归属修正必须按明确事务边界执行
- service 层与 route 层的 `commit` 责任要统一，不要一部分在 service 提交，一部分在 route 提交

### 9.7 会话一致性

- 登录成功后更新 `last_login_at`
- `get_current_user` 每次都要回表校验用户状态
- 禁用用户后旧 token 必须失效
- 改密成功后要明确策略：
  - 是否立即让旧 token 失效
  - 是否要求前端强制重新登录

### 9.8 迁移与脚本

- 如果本轮继续使用 `create_all()`，必须补结构修正与数据修正脚本
- 如果开始连续开发用户/RBAC，下一步应尽快接入 `Alembic`
- 数据修正脚本要支持 dry-run
- 数据修正脚本要输出修正数量，便于联调核对

### 9.9 返回结构稳定性

- `/api/auth/me` 字段口径要尽早固定
- 用户详情与作者摘要要区分 schema，避免泄露不该返回的字段
- 文章列表和文章详情中的作者结构要保持一致
- 所有用户相关响应都不能暴露 `password_hash`

### 9.10 前后端联调细节

- 应用启动时的登录态恢复只能有一套入口流程，避免重复请求 `/api/auth/me`
- token 失效后的清理、跳转、提示要统一
- 修改资料成功后前端要立即刷新当前用户信息
- 修改密码成功后前端要按既定策略清理会话或重新登录
- `member` 误入 `/admin/*` 时前端跳转目标要提前定死，避免出现回跳循环

---

## 10. 阶段 7：联调与数据修正

### 10.1 数据修正

- 历史文章全部归属 `admin`
- 历史用户角色统一修正为 `admin` 或 `member`
- 清理无效状态值和异常角色值

### 10.2 联调检查点

#### 认证

- `admin` 可正常登录
- `member` 可正常登录
- `disabled` 用户不能登录
- 已禁用用户旧 token 失效

#### 用户

- `admin` 可创建用户
- `admin` 可修改用户
- `admin` 可重置密码
- `admin` 可启用/禁用用户
- `member` 只能修改自己资料和自己密码

#### 文章

- `admin` 可查看全部文章
- `member` 列表中只能看到自己的文章
- `member` 无法编辑他人文章
- 新文章作者自动归当前用户

#### 前端

- 未登录访问任意页面都会跳 `/login`
- 登录成功回 `#/`
- 导航栏正确显示当前用户
- 后台菜单按角色显示正确

---

## 11. 实施要求

### 11.1 后端优先级

必须先完成：

1. 用户模型字段补齐
2. 认证状态校验补齐
3. 用户接口补齐
4. 文章权限判断收口

原因：

- 没有后端权限基线，前端裁剪不具备真实约束力

### 11.2 前端优先级

必须后做：

1. 全站登录门禁
2. 个人中心
3. 后台角色裁剪

原因：

- 前端必须建立在后端接口和权限边界稳定之后

### 11.3 迁移要求

- 如果本轮继续使用 `create_all()`，必须补一份一次性数据修正方案
- 如果开始持续开发用户/RBAC，下一步应尽快接入 `Alembic`

---

## 12. 最终实施清单

```text
1. 调整 users 模型字段与角色/状态常量
2. 修正历史文章 author_id 到 admin
3. 新增 user schemas
4. 新增 user service
5. 新增 /api/admin/users 系列接口
6. 新增 /api/auth/me/profile 与 /api/auth/me/password
7. 补登录状态、禁用状态、last_login_at 逻辑
8. 下沉 article 权限判断到 service
9. 新增 /api/me/articles 系列本人文章接口
10. 收口后台文章列表与详情权限
11. 前台文章接口改为登录后访问
12. 前端接入全站登录门禁
13. 前端接入个人中心、我的文章与改密
14. 前端只对 admin 开放后台
15. 联调并完成历史数据修正
```
