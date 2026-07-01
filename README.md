# 前言
云笔记是一款轻量级、自托管的个人笔记应用，支持 Markdown 编辑、分类与标签管理、支持多种导入、导出形式（文本形式、主文件夹+子文件夹形式导入导出）、云备份。 所有数据由用户掌控，存储在自有服务器中，适合追求隐私、安全和长期可维护性的个人知识管理场景。

### 本笔记项目分成两个版本 
  - 一、云端版本
    通过Cloudflare 关联githup部署。此版本需联网，具云端备份、多端同步、账号注册功能。
  - 二、本地版本
    不需要部署，直接下载安装软件使用，无云端备份，无多端同步，无需注册账号。数据保存在本地。
    
### 不管何种版本、不管任何收费笔记项目，请多种方式备份自己的重要资料。

### 如果项目对你有帮助请给我点个star。

<img width="1920" height="1040" alt="PixPin_2026-06-16_11-44-09" src="https://github.com/user-attachments/assets/2ff978ff-c77d-4ed9-a7a8-ffedabb19dc2" />

## 核心优势
  - 自托管部署：所有数据仅存储在您自己的服务器中
  - 隐私保护：数据永远不会离开您的控制范围
  - 实时云储存备份：数据自动保存在Cloudflare 后台

# 主要功能介绍

## 强大的笔记功能
  - Markdown 编辑：实时编辑+预览为一体的 Markdown 编辑器，支持丰富的语法
  - 分类管理：灵活的分类系统，构建清晰的知识结构
  - 标签系统：多维度标签管理，快速定位相关笔记
  - 全文检索：强大的搜索功能，快速找到所需内容
  - 数据导出：丰富的数据导出、导入格式，支持一键导出、导入markdonwn主+子文件夹
  - 快捷方式设定

## 账号限定功能
  - 支持设置注册账号数量限定，部署一个就可注册不同账号给家人、朋友使用。

## 优秀的用户体验
  - 响应式设计：在桌面和移动设备上均可获得良好体验
  - 主题切换：支持深色/浅色主题切换
  - 多语言支持：中英文切换
      
# 快速部署指南
云端版本目前只支持在 Cloudflare 平台通过Pages部署

## 步骤 1: Fock 本项目
Fock 本项目，同时请帮忙点个 Star，万分感谢

## 步骤 2: 创建 kv 数据库
- 登入Cloudflare 平台 > 储存和数据库 > workers kv > 创建数据库，数据库名称为 My_Note 或随意
- cf云端 KV 数据库存了你的笔记和分类数据

<img width="1011" height="650" alt="PixPin_2026-06-04_21-47-53" src="https://github.com/user-attachments/assets/15188d5f-9c78-415e-99e5-a971bac2d8f9" />

## 步骤 3: 创建项目
- 前往 Cloudflare 控制台 > Workers和Pages > 创建应用程序 > 想要部署 Pages？开始使用 > 连接你的 Git 仓库

- <img width="807" height="476" alt="PixPin_2026-06-04_21-50-57" src="https://github.com/user-attachments/assets/13305cc7-f8ef-42dd-ac53-a7eda69ede77" />

<img width="780" height="451" alt="PixPin_2026-06-04_21-51-44" src="https://github.com/user-attachments/assets/2868bc77-5f7d-4738-83be-2075e25068e2" />

<img width="843" height="502" alt="PixPin_2026-06-04_21-52-18" src="https://github.com/user-attachments/assets/f98696f0-926e-48ca-8f10-461a1dadbfb5" />

<img width="1193" height="887" alt="PixPin_2026-06-04_21-53-17" src="https://github.com/user-attachments/assets/96a3062d-4ac0-46bf-a5be-f74fd9ad5ccc" />

## 步骤 4: 配置环境变量（在部署项目的控制台）
1、前往 设置 > 绑定

2、添加 kv 数据库：
- 变量名: NOTE_KV (固定值，不能更改）
- kv 数据库: My_Note (填你创建的名称）

<img width="1623" height="664" alt="PixPin_2026-06-04_22-01-20" src="https://github.com/user-attachments/assets/93245ca2-962a-404d-98dc-dcaa63de101c" />

## 步骤 5: 设置账号数量、自定义名称
1、前往 设置 > 变量与机密

2、添加 变量：
- 变量名称：MAX_USERS (固定值）
- 值：限制注册账号数量由你随意设定

<img width="1575" height="670" alt="PixPin_2026-06-04_22-02-36" src="https://github.com/user-attachments/assets/1fc5e6e0-c591-472c-b2fa-6d1124f88d00" />

3、自定义名称
- 变量名称：APP_NAME (固定值）
- 值：笔记名称随意
  
<img width="402" height="352" alt="PixPin_2026-06-10_06-38-46" src="https://github.com/user-attachments/assets/9ad6cb24-8f8c-47f6-abec-5816593579cb" />

## 步骤 6：重置部署
导航到 部署 > 所有部署，最新的部署... 重试部署

## 步骤 7: 部署后操作
- 访问你的站点: https://your-project.pages.dev

 <img width="944" height="369" alt="PixPin_2026-06-04_22-08-41" src="https://github.com/user-attachments/assets/d3a5055e-b994-47b7-8770-82f199004e85" />

- 自定义域：设置自定义域

<img width="719" height="406" alt="PixPin_2026-06-04_22-09-42" src="https://github.com/user-attachments/assets/d4c29827-7c4b-48fa-891f-1271043b3720" />

- 完成设置: 按照安装向导操作
- 开始使用: 创建你的第一个笔记！

## 步骤 8: 安装桌面端
- 如图所示，电脑端在网址栏右边有安装图标
- 手机端在网址栏右边点击三个点，会弹出多个选项，Google浏览器选择：添加到主屏幕。edge浏览器选择：添加至手机，手机端安装过程会慢一些，耐心等待几秒钟。

<img width="610" height="291" alt="PixPin_2026-06-05_11-05-45" src="https://github.com/user-attachments/assets/363f16cd-cddb-4df3-871f-9cdea709981d" />

<img width="442" height="326" alt="PixPin_2026-06-05_11-13-23" src="https://github.com/user-attachments/assets/e6aa24d1-af0c-42b9-974d-bbe0e674c452" />

<img width="338" height="464" alt="PixPin_2026-06-05_11-14-13" src="https://github.com/user-attachments/assets/aa4105ee-76b7-4c24-8b72-4892e2ae872c" />

## 步骤 9: 桌面端设置快捷呼出键
- 零代码实现“一键呼出”的终极秘籍：
- 电脑桌面，找到你的“云端笔记”软件图标，右键点击该图标，在弹出的菜单中选择 “属性”
- 在 “快捷方式” 标签页 “快捷键”  这一栏（默认写着“无”）
- 鼠标点击一下输入框，然后直接在键盘上按下你想要的快捷键组合
### 选择键盘字母栏设置快捷键，默认是 Ctrl + Alt + 选中按键
### 选择键盘右边数字栏 设置快捷建 默认是 单次点击+选中按键
- 点击右下角的 “确定” (OK) 保存。

<img width="520" height="740" alt="PixPin_2026-06-05_11-15-41" src="https://github.com/user-attachments/assets/073ad217-6498-4d5d-b54e-82594572032e" />

<img width="574" height="570" alt="PixPin_2026-06-05_11-16-03" src="https://github.com/user-attachments/assets/a9ae7651-5303-4dd9-a859-885de3bc43b6" />




