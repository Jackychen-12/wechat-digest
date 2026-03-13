# 暑期招聘每日更新网页

这是一个可直接部署到 GitHub Pages 的静态网页项目，用于**每日更新暑期招聘信息**。

## 功能

- 展示岗位列表（公司、岗位、城市、发布时间、截止时间、标签、投递链接）；
- 支持按关键词 / 城市 / 岗位类型 / 发布时间筛选；
- 顶部显示最后更新时间与“今日新增”岗位数量；
- 数据源为 `data/jobs.json`，适合每天维护。

## 每日更新流程（对应你的招聘 Agent 工作流）

1. 收集当天新增岗位；
2. 编辑 `data/jobs.json`：
   - 更新 `updatedAt`；
   - 在 `jobs` 中新增/修改岗位；
3. 提交并推送到 GitHub；
4. GitHub Pages 自动发布新页面。

## 本地预览

```bash
python3 -m http.server 4173
```

打开：<http://127.0.0.1:4173>

## GitHub Pages 部署

仓库已包含 `.github/workflows/deploy-pages.yml`。

1. 推送代码到 `main`；
2. 打开仓库 `Settings -> Pages`；
3. Source 选择 `GitHub Actions`；
4. 等待 Actions 完成，访问：
   `https://<你的用户名>.github.io/<仓库名>/`
