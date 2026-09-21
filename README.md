# 🌲 Linux Tree Visualizer

> 一个现代、交互式、高颜值的 Linux `tree` 命令在线可视化与结构设计工具。支持上传本地工程目录、拖拽 `.zip` 压缩包、手动增删改节点，即时生成交互式拓扑图谱与终端 CLI 字符树，并支持导出高分辨率 SVG/PNG 图片及一键生成 GitHub README 目录规范。

---

## ✨ 核心特性

- 🌳 **交互式拓扑图谱 (D3-Hierarchy)**：
  - 基于贝塞尔曲线的水平层级树状图，支持无限层级缩放、平移与居中自适应。
  - 节点折叠/展开，实时显示子目录数量与文件大小。
  - 内置丰富的文件类型识别与专用彩色图标徽标（代码、配置、文档、多媒体等）。
  - 支持节点单点操作：添加子文件/子目录、重命名、删除、快速注释备注。
- 💻 **默认终端与双栏联动文本编辑**：
  - **默认启动为终端/文本编辑视图**，贴合程序员基于键盘和文本的高效工作习惯。
  - **双栏分屏联动**：左侧代码文本编辑器，右侧即时 Linux tree 字符终端仿真输出，输入时秒级实时同步。
  - **IDE 级文本编辑体验**：支持 `Tab` 缩进 2 空格、`Shift+Tab` 反缩进、`Enter` 保持缩进/遇目录自动增加缩进、`Ctrl+S` 快速保存应用、行号指示、树形标准化一键整理。
  - **丰富注释与类型语法**：直接在文本中使用 `# 备注` 即可附加文件说明，以 `/` 结尾自动标识目录。
  - **双向联动搜索**：支持在终端中高亮查找文件，提供匹配行指示器及 `↑` / `↓` 快速平滑跳转定位。
  - 支持标准命令行参数切换：`-L` 深度限制、`-a` 隐藏文件、`-d` 仅目录、`-F` 文件类型指示符、`-I` 正则忽略。
- 🛡️ **智能过滤与 .gitignore**：
  - 自动识别并遵循工程根目录下的 `.gitignore` 规则。
  - 默认安全忽略 `.git`、`node_modules`、`.env*`、`.DS_Store`、`.gitignore` 等非业务及隐藏文件。
- 📦 **纯客户端安全导入**：
  - **文件夹上传**：支持 WebKit 目录选择器，秒级遍历本地工程。
  - **ZIP 压缩包**：借助 `JSZip` 在浏览器内存中直接解压解析，零数据上传服务器，安全可靠。
  - **文本反向解析**：支持直接粘贴现有 `tree` 命令输出或 Markdown 目录列表，自动逆向构建树状数据。
  - **内置丰富示例**：内置 React + Vite 前端、FastAPI + SQLAlchemy 后端、Linux FHS 规范等工程模板。
- 📝 **GitHub README 结构生成器**：
  - 一键生成规范的 Markdown 目录结构代码块。
  - 支持为重要文件/目录添加中文说明注释，生成带右侧对齐说明文档结构。
- 🎨 **专业级多格式导出**：
  - **矢量 SVG**：保留纯矢量路径与文字，适合嵌入文档或二次编辑。
  - **高分辨率 PNG**：内置 1x / 2x / 3x 渲染倍率，可选 macOS 窗口质感外框与高对比深色背景。
  - **纯文本 / Markdown / JSON**：一键复制或下载。

---

## 🏗️ 项目架构与目录结构

```text
linux-tree-visualizer/
├── .github/
│   └── workflows/
│       └── pages.yml             # GitHub Actions 自动编译与部署至 GitHub Pages
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/               # React UI 核心组件
│   │   ├── CommentModal.tsx      # 节点注释备注编辑弹窗
│   │   ├── EditNodeModal.tsx     # 新增/重命名节点弹窗
│   │   ├── ExportModal.tsx       # SVG / PNG / 文本高级导出面板
│   │   ├── Header.tsx            # 顶部导航栏（示例导入、搜索、-L 限制、视图切换等）
│   │   ├── ImportModal.tsx       # 文件夹、Zip、文本导入弹窗
│   │   ├── ReadmeModal.tsx       # GitHub README 结构代码生成弹窗
│   │   ├── TerminalView.tsx      # Linux tree 终端字符仿真与搜索视图
│   │   └── TreeGraph.tsx         # D3 SVG 交互式矢量拓扑画布
│   ├── data/
│   │   └── presets.ts            # 内置示例工程模板数据（React、FastAPI、Linux FHS）
│   ├── utils/                    # 纯工具与算法层
│   │   ├── exportUtils.ts        # SVG 序列化、Canvas 栅格化与 PNG 导出逻辑
│   │   ├── fileIcons.ts          # 扩展名与语言识别、色彩与分类映射
│   │   └── treeParser.ts         # 树遍历、过滤、.gitignore 正则计算、CLI 字符树生成
│   ├── App.tsx                   # 应用核心状态入口与快捷操作
│   ├── index.css                 # 全局 Tailwind CSS 样式
│   ├── main.tsx                  # React DOM 渲染入口
│   └── types.ts                  # 全局 TypeScript 接口与类型定义
├── .gitignore
├── index.html                    # 页面 HTML 模版与 SEO Meta
├── metadata.json                 # 项目元数据声明
├── package.json
├── tsconfig.json
└── vite.config.ts                # Vite 构建配置（含 Tailwind v4 与相对路径 base）
```

---

## 🚀 本地开发指南

### 前置要求

- [Node.js](https://nodejs.org/) (推荐 v20 或 v22 LTS)
- `npm` 或 `pnpm` / `yarn`

### 1. 克隆仓库与安装依赖

```bash
git clone https://github.com/your-username/linux-tree-visualizer.git
cd linux-tree-visualizer
npm install
```

### 2. 启动本地开发服务

```bash
npm run dev
```

在浏览器打开 [http://localhost:3000](http://localhost:3000) 即可开始使用。

### 3. 构建生产包与类型检查

```bash
# 检查 TypeScript 类型
npm run lint

# 构建生产版本 (输出至 dist/ 目录)
npm run build

# 本地预览构建产物
npm run preview
```

---

## 🌐 部署至 GitHub Pages

本项目已经配置好了自动化部署工作流 `.github/workflows/pages.yml`。

当你将代码推送到 GitHub 的 `main` 分支时：
1. GitHub Actions 会自动检出代码、安装依赖并执行 `npm run build`；
2. 自动将 `dist` 构建产物发布到你的 `gh-pages` 分支；
3. **只需在 GitHub 仓库中开启 Pages**：
   - 进入 GitHub 仓库页面 -> **Settings** -> **Pages**
   - **Source** 选择 **Deploy from a branch**
   - 分支选择 **`gh-pages`**，文件夹选择 **`/ (root)`** 并保存
4. 等待 1~2 分钟，即可通过 `https://<your-username>.github.io/<repo-name>/` 访问在线工具。

---

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite 8](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **数据可视化**: [D3.js (d3-hierarchy)](https://d3js.org/d3-hierarchy)
- **图标库**: [Lucide React](https://lucide.dev/)
- **ZIP 解包**: [JSZip](https://stuk.github.io/jszip/)

---

## 📄 开源许可

本项目遵循 [MIT License](LICENSE) 开源。欢迎提交 PR 与 Issue！
