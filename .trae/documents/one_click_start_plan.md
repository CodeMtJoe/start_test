# 星币管理系统 - 一键启动方案实现计划

## 项目背景
当前用户启动星币管理系统需要多个步骤，包括启动代理服务器、前端服务器，然后手动打开浏览器访问系统。为了提高用户体验，需要实现一键启动功能，自动完成所有启动步骤并打开浏览器。

## 实现方案

### [x] 任务1：创建Windows一键启动脚本
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建`start.bat`批处理文件，实现Windows系统的一键启动功能
  - 检测系统是否安装Docker，优先使用Docker方式启动
  - 若未安装Docker，使用传统方式启动（Node.js代理服务器 + Python HTTP服务器）
  - 自动打开浏览器访问系统
- **Success Criteria**:
  - 双击`start.bat`即可启动系统并打开浏览器
  - 支持Docker和非Docker两种启动方式
  - 提供清晰的启动过程提示
- **Test Requirements**:
  - `programmatic` TR-1.1: 脚本能正确检测Docker安装状态
  - `programmatic` TR-1.2: 脚本能正确启动所需服务
  - `human-judgement` TR-1.3: 启动过程有清晰的提示信息

### [x] 任务2：创建Linux/Mac一键启动脚本
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建`start.sh` bash脚本，实现Linux和Mac系统的一键启动功能
  - 检测系统是否安装Docker，优先使用Docker方式启动
  - 若未安装Docker，使用传统方式启动（Node.js代理服务器 + Python HTTP服务器）
  - 自动打开浏览器访问系统
- **Success Criteria**:
  - 执行`./start.sh`即可启动系统并打开浏览器
  - 支持Docker和非Docker两种启动方式
  - 提供清晰的启动过程提示
- **Test Requirements**:
  - `programmatic` TR-2.1: 脚本能正确检测Docker安装状态
  - `programmatic` TR-2.2: 脚本能正确启动所需服务
  - `human-judgement` TR-2.3: 启动过程有清晰的提示信息

### [x] 任务3：更新README.md文档
- **Priority**: P1
- **Depends On**: 任务1, 任务2
- **Description**:
  - 更新README.md文件，添加一键启动方案的使用说明
  - 详细说明两种启动脚本的使用方法
  - 提供常见问题的解决方案
- **Success Criteria**:
  - README.md包含一键启动方案的完整说明
  - 提供清晰的使用步骤和注意事项
- **Test Requirements**:
  - `human-judgement` TR-3.1: 文档内容清晰易懂
  - `human-judgement` TR-3.2: 包含所有必要的使用信息

## 技术实现细节

### Windows启动脚本 (start.bat)
- 使用`where`命令检测Docker、Node.js和Python的安装状态
- 使用`start`命令启动后台进程
- 使用`timeout`命令等待服务启动
- 使用`start`命令打开浏览器

### Linux/Mac启动脚本 (start.sh)
- 使用`command -v`命令检测Docker、Node.js和Python的安装状态
- 使用`&`符号将进程放入后台运行
- 使用`sleep`命令等待服务启动
- 根据不同系统使用不同的浏览器打开命令

### 启动流程
1. 检测Docker是否安装
   - 是：使用`docker-compose up -d`启动服务，然后打开`http://localhost`
   - 否：检查Node.js和Python是否安装
     - 否：提示错误并退出
     - 是：启动Node.js代理服务器和Python HTTP服务器，然后打开`http://localhost:8000`

## 测试验证

### 测试场景1：已安装Docker的系统
- 执行启动脚本
- 验证服务是否成功启动
- 验证浏览器是否自动打开并访问正确的URL

### 测试场景2：未安装Docker但已安装Node.js和Python的系统
- 执行启动脚本
- 验证代理服务器和前端服务器是否成功启动
- 验证浏览器是否自动打开并访问正确的URL

### 测试场景3：缺少必要依赖的系统
- 执行启动脚本
- 验证脚本是否能正确检测并提示缺少的依赖

## 注意事项
- 确保Docker、Node.js和Python已正确安装
- 确保端口80（Docker方式）或3000、8000（传统方式）未被占用
- 若使用Docker方式，确保docker-compose命令可用
- 首次启动Docker方式可能需要较长时间构建镜像

## 总结
通过实现一键启动脚本，用户可以通过双击或执行单个命令即可启动星币管理系统并自动打开浏览器，大大简化了启动过程，提高了用户体验。脚本支持Docker和传统两种启动方式，适应不同用户的环境需求。