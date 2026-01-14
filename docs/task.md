# 任务列表

- [x] 修复 `src/components/library/AdminPanelModal.tsx` 中的构建错误 <!-- id: 0 -->
- [x] 审查并分析代码库架构 <!-- id: 1 -->
- [x] 重构已识别的问题 <!-- id: 2 -->
- [x] 验证并完善积分系统 <!-- id: 3 -->
- [x] 增强积分可见性 (UI/UX) <!-- id: 4 -->
- [x] 统一管理面板 UI 风格 <!-- id: 7 -->
- [x] 优化 Library UI 展示 <!-- id: 10 -->
- [x] 修复 User 删除时的外键约束错误 (P2003) <!-- id: 13 -->
    - [x] 更新 `prisma/schema.prisma` 添加 `onDelete: Cascade` <!-- id: 14 -->
    - [x] 提交并推送以触发 Railway 部署 <!-- id: 15 -->
- [x] 优化 Library 图片交互 <!-- id: 16 -->
    - [/] 启用图片压缩显示 (`next/image` optimization) (已回滚以修复显示问题) <!-- id: 17 -->
    - [x] 添加下载原图功能 (Download Button) <!-- id: 18 -->
    - [x] 确保图片原比例展示 (无拉伸) <!-- id: 19 -->

- [x] 修复生产环境图片存储问题 (Admin Images Broken) <!-- id: 20 -->
    - [x] 添加服务端日志 (`[Storage]`) 与诊断接口 (`/api/diagnose`) <!-- id: 21 -->
    - [x] 验证 `public/uploads` 写入路径与读取路径一致性 (已通过动态路由修复) <!-- id: 22 -->
- [x] 增强 Admin 功能与上传交互 <!-- id: 23 -->
    - [x] Library: Admin 可见图片归属用户 (User: xx) <!-- id: 24 -->
    - [x] Library: 一键复制 Prompt 功能 <!-- id: 25 -->
    - [x] Inspector: 支持剪贴板粘贴上传图片 (Paste to Upload) <!-- id: 26 -->
