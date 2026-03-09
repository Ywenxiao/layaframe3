/**
 * Terminal Tetris Game
 * 终端俄罗斯方块游戏
 *
 * 运行方式: node tools/tetris.cjs
 * 控制键:
 *   A/D 或 左右箭头 - 左右移动
 *   W 或 上箭头    - 旋转
 *   S 或 下箭头    - 软下落（加速）
 *   空格           - 硬下落（直接落底）
 *   P             - 暂停/继续
 *   Q             - 退出游戏
 */

// ==================== 常量定义 ====================

/** 游戏区域宽度（列数） */
const WIDTH = 10;

/** 游戏区域高度（行数） */
const HEIGHT = 20;

/** 空单元格显示字符 */
const EMPTY = '  ';

/** 方块显示字符 */
const BLOCK = '[]';

/**
 * 所有方块形状定义
 * 每个形状是一个二维数组，使用字母代表不同形状，EMPTY 代表空白
 * 形状类型: I(长条), O(方块), T(T形), S(S形), Z(Z形), J(J形), L(L形)
 */
const SHAPES = [
    // I - 长条 (4格)
    [['I', 'I', 'I', 'I']],
    // O - 方块 (2x2)
    [['O', 'O'], ['O', 'O']],
    // T - T形
    [['T', 'T', 'T'], [EMPTY, 'T', EMPTY]],
    // S - S形
    [EMPTY, 'S', 'S', ['S', 'S', EMPTY]],
    // Z - Z形
    [['Z', 'Z', EMPTY], [EMPTY, 'Z', 'Z']],
    // J - J形
    [['J', EMPTY, EMPTY], ['J', 'J', 'J']],
    // L - L形
    [EMPTY, EMPTY, 'L', ['L', 'L', 'L']]
];

/**
 * ANSI 转义序列颜色映射
 * 用于在终端中显示不同颜色的方块
 * \x1b[XXm 是 ANSI 转义序列，XX 是颜色代码
 */
const COLORS = {
    'I': '\x1b[36m',  // 青色 (Cyan)
    'O': '\x1b[33m',  // 黄色 (Yellow)
    'T': '\x1b[35m',  // 洋红色 (Magenta)
    'S': '\x1b[32m',  // 绿色 (Green)
    'Z': '\x1b[31m',  // 红色 (Red)
    'J': '\x1b[34m',  // 蓝色 (Blue)
    'L': '\x1b[33m',  // 黄色 (Yellow)
    'X': '\x1b[37m'   // 白色 (White) - 已落下的方块
};

/** ANSI 重置颜色代码，使后续输出恢复正常颜色 */
const RESET = '\x1b[0m';


// ==================== Tetris 游戏主类 ====================

class Tetris {
    /**
     * 构造函数 - 初始化游戏
     * 创建游戏板、生成第一个方块、设置终端、启动游戏循环
     */
    constructor() {
        /** 游戏板二维数组，存储已落下的方块 */
        this.board = [];

        /** 当前下落的方块对象 { shape:[][], type:'X' } */
        this.currentPiece = null;

        /** 当前方块的 X 坐标（列位置） */
        this.currentX = 0;

        /** 当前方块的 Y 坐标（行位置） */
        this.currentY = 0;

        /** 当前得分 */
        this.score = 0;

        /** 当前等级（影响下落速度） */
        this.level = 1;

        /** 已消除的总行数 */
        this.lines = 0;

        /** 游戏是否结束 */
        this.gameOver = false;

        /** 游戏是否暂停 */
        this.paused = false;

        /** 上次方块下落的时间戳（毫秒） */
        this.lastFall = Date.now();

        /** 方块下落间隔（毫秒），等级越高间隔越短 */
        this.fallInterval = 1000;

        // 初始化游戏板
        this.initBoard();

        // 生成第一个方块
        this.spawnPiece();

        // 进入备用屏幕（终端游戏常用，切换到独立的缓冲区）
        // \x1b[?1049h - 启用备用屏幕
        process.stdout.write('\x1b[?1049h');
        // \x1b[?25l - 隐藏光标
        process.stdout.write('\x1b[?25l');

        // 启动游戏
        this.start();
    }

    /**
     * 初始化游戏板
     * 创建一个 HEIGHT x WIDTH 的二维数组，所有单元格初始化为 EMPTY
     */
    initBoard() {
        this.board = [];
        for (let y = 0; y < HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < WIDTH; x++) {
                this.board[y][x] = EMPTY;
            }
        }
    }

    /**
     * 初始化输入设置
     * 启用 raw mode 使终端能够捕获单个按键（不等待回车）
     * 这对于实时游戏控制是必需的
     */
    initInput() {
        // 启用 raw mode 以捕获单个按键
        // 在 raw mode 下，输入立即可用，不需要等待回车键
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
        // 恢复标准输入（如果已暂停）
        process.stdin.resume();
        // 设置字符编码为 UTF-8
        process.stdin.setEncoding('utf8');
    }

    /**
     * 生成新方块
     * 从 SHAPES 数组中随机选择一个形状，生成在游戏板顶部中央
     * 如果新方块无法放置（游戏板已满），则游戏结束
     */
    spawnPiece() {
        // 随机选择形状索引
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        // 获取形状定义
        const shape = SHAPES[shapeIndex];
        // 对应形状的字母标识
        const type = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][shapeIndex];

        // 创建当前方块对象，使用深拷贝避免修改原始形状定义
        this.currentPiece = {
            shape: this.deepCopy(shape),
            type: type
        };

        // 计算初始位置：水平居中，顶部对齐
        this.currentX = Math.floor((WIDTH - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;

        // 检查方块是否能放置（如果不能，说明游戏板已满）
        if (!this.canMove(0, 0)) {
            this.gameOver = true;
        }
    }

    /**
     * 深拷贝二维数组
     * 用于复制方块形状，避免引用原始数据
     * @param {Array} arr - 要拷贝的二维数组
     * @returns {Array} 新的二维数组
     */
    deepCopy(arr) {
        return arr.map(row => [...row]);
    }

    /**
     * 检查方块是否可以移动到指定位置
     * 用于检测碰撞：边界检测和已有方块检测
     *
     * @param {number} dx - X 方向偏移
     * @param {number} dy - Y 方向偏移
     * @param {Array} shape - 可选，指定要检查的形状（用于旋转检测）
     * @returns {boolean} true 表示可以移动，false 表示不能移动
     */
    canMove(dx, dy, shape = null) {
        // 使用指定形状或当前方块形状
        const piece = shape || this.currentPiece.shape;

        // 遍历方块的每个单元格
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                // 只检查非空白单元格
                if (piece[y][x] !== EMPTY) {
                    // 计算目标位置
                    const newX = this.currentX + x + dx;
                    const newY = this.currentY + y + dy;

                    // 边界检测：超出左右边界或底部
                    if (newX < 0 || newX >= WIDTH || newY >= HEIGHT) {
                        return false;
                    }

                    // 碰撞检测：目标位置已有方块
                    // 注意：newY >= 0 是因为刚生成时可能在游戏板上方
                    if (newY >= 0 && this.board[newY][newX] !== EMPTY) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * 旋转当前方块
     * 顺时针旋转 90 度
     * 如果旋转后无法放置，尝试左右移动后再旋转（-wall kick 简化版）
     */
    rotate() {
        const piece = this.currentPiece.shape;
        const rows = piece.length;
        const cols = piece[0].length;

        // 创建旋转后的新形状（顺时针旋转）
        // 原矩阵: piece[y][x]
        // 新矩阵: rotated[x][rows - 1 - y]
        const rotated = [];
        for (let x = 0; x < cols; x++) {
            rotated[x] = [];
            for (let y = rows - 1; y >= 0; y--) {
                rotated[x].push(piece[y][x]);
            }
        }

        // 尝试直接旋转
        if (this.canMove(0, 0, rotated)) {
            this.currentPiece.shape = rotated;
        }
        // 尝试向左移动一格后再旋转（处理靠墙情况）
        else if (this.canMove(-1, 0, rotated)) {
            this.currentX -= 1;
            this.currentPiece.shape = rotated;
        }
        // 尝试向右移动一格后再旋转
        else if (this.canMove(1, 0, rotated)) {
            this.currentX += 1;
            this.currentPiece.shape = rotated;
        }
    }

    /**
     * 左右移动当前方块
     * @param {number} dx - 移动方向和距离，正数向右，负数向左
     * @returns {boolean} 是否移动成功
     */
    move(dx) {
        if (this.canMove(dx, 0)) {
            this.currentX += dx;
            return true;
        }
        return false;
    }

    /**
     * 软下落 - 方块向下移动一格
     * 玩家按 S/Down 键时调用
     * @returns {boolean} 是否移动成功（失败表示触底）
     */
    drop() {
        if (this.canMove(0, 1)) {
            this.currentY++;
            return true;
        }
        return false;
    }

    /**
     * 硬下落 - 方块直接落到底部
     * 玩家按空格键时调用
     * 落到底后锁定方块并检查消行
     */
    hardDrop() {
        // 持续下落直到无法移动
        while (this.canMove(0, 1)) {
            this.currentY++;
        }
        // 锁定方块到游戏板
        this.lockPiece();
    }

    /**
     * 锁定当前方块到游戏板
     * 将方块的每个非空单元格复制到游戏板对应位置
     * 然后检查消行并生成新方块
     */
    lockPiece() {
        const piece = this.currentPiece.shape;

        // 将方块复制到游戏板
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] !== EMPTY) {
                    const boardY = this.currentY + y;
                    // 只处理在游戏板范围内的部分
                    if (boardY >= 0) {
                        // 标记为已落下的方块（使用 'X'）
                        this.board[boardY][this.currentX + x] = 'X';
                    }
                }
            }
        }

        // 检查并消除满行
        this.clearLines();

        // 生成下一个方块
        this.spawnPiece();
    }

    /**
     * 清除满行
     * 从底部向上扫描，找出满行并消除
     * 消除行数越多，得分越高（使用倍数奖励）
     */
    clearLines() {
        let linesCleared = 0;

        // 从底部向上扫描（因为消除后上方行会下落）
        for (let y = HEIGHT - 1; y >= 0; y--) {
            // 检查当前行是否所有单元格都不为空
            if (this.board[y].every(cell => cell !== EMPTY)) {
                // 移除当前行
                this.board.splice(y, 1);
                // 在顶部添加新空行
                this.board.unshift(new Array(WIDTH).fill(EMPTY));
                // 消行计数加一
                linesCleared++;
                // 因为删除了当前行，需要重新检查当前位置（y 不变）
                y++;
            }
        }

        // 如果消除了行，更新分数、等级和下落速度
        if (linesCleared > 0) {
            // 累计消行数
            this.lines += linesCleared;
            // 得分公式: 行数^2 * 100 * 等级（消行越多倍数越高）
            this.score += linesCleared * 100 * linesCleared * this.level;
            // 等级计算：每 10 行升一级
            this.level = Math.floor(this.lines / 10) + 1;
            // 下落速度：每升一级加快 100ms，最小 100ms
            this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
    }

    /**
     * 渲染游戏画面到终端
     * 使用 ANSI 转义序列清屏并重新绘制整个游戏界面
     */
    render() {
        let output = '';

        // 清屏并定位光标到左上角
        // \x1b[2J - 清除整个屏幕
        // \x1b[H - 光标移动到首页顶部
        output += '\x1b[2J\x1b[0f';
        output += '\x1b[H';

        // 绘制游戏标题边框
        output += '+==================================+\n';
        output += '|        TERMINUS TETRIS           |\n';
        output += '+==================================+\n';

        // 绘制游戏区域
        for (let y = 0; y < HEIGHT; y++) {
            output += '|';
            for (let x = 0; x < WIDTH; x++) {
                // 获取游戏板上当前单元格
                let cell = this.board[y][x];

                // 如果有当前方块且游戏未结束，叠加绘制当前方块
                if (this.currentPiece && !this.gameOver) {
                    const piece = this.currentPiece.shape;
                    // 遍历方块形状，检查是否有部分在当前位置
                    for (let py = 0; py < piece.length; py++) {
                        for (let px = 0; px < piece[py].length; px++) {
                            if (piece[py][px] !== EMPTY) {
                                const boardX = this.currentX + px;
                                const boardY = this.currentY + py;
                                // 如果方块的这个格子对应游戏板的这个位置
                                if (boardX === x && boardY === y) {
                                    cell = this.currentPiece.type;
                                }
                            }
                        }
                    }
                }

                // 输出单元格
                if (cell === EMPTY) {
                    output += EMPTY;
                } else {
                    // 根据方块类型选择颜色
                    // 'X' 表示已落下的方块（白色），其他用对应颜色
                    const color = cell === 'X' ? COLORS['X'] : COLORS[this.currentPiece?.type] || COLORS['X'];
                    output += color + BLOCK + RESET;
                }
            }
            output += '|\n';
        }

        // 绘制底部边框和游戏信息
        output += '+==================================+\n';
        output += '| Score: ' + this.score.toString().padStart(8) + '               |\n';
        output += '| Level: ' + this.level.toString().padStart(8) + '               |\n';
        output += '| Lines: ' + this.lines.toString().padStart(8) + '               |\n';
        output += '+==================================+\n';

        // 绘制操作说明
        output += '\nControls:\n';
        output += 'A/D - Move Left/Right\n';
        output += 'W   - Rotate\n';
        output += 'S   - Soft Drop\n';
        output += 'SPACE - Hard Drop\n';
        output += 'P   - Pause\n';
        output += 'Q   - Quit\n';

        // 游戏结束时显示结束画面
        if (this.gameOver) {
            output = '\n\n';
            output += '+-------------+\n';
            output += '|   GAME OVER |\n';
            output += '+-------------+\n';
            output += '| Score: ' + this.score + '\n';
            output += '+-------------+\n';
            output += '\nPress Q to quit\n';
        }

        // 输出到终端
        process.stdout.write('\x1b[2J\x1b[0f' + output);
    }

    /**
     * 启动游戏
     * 设置输入监听和游戏循环
     */
    start() {
        // 初始化输入（启用 raw mode）
        this.initInput();

        // 监听键盘输入
        process.stdin.on('data', (key) => {
            // 游戏结束时只响应 Q 键退出
            if (this.gameOver) {
                if (key === 'q' || key === 'Q') {
                    this.exit();
                }
                return;
            }

            // Q 键退出
            if (key === 'q' || key === 'Q') {
                this.exit();
                return;
            }

            // P 键暂停/继续
            if (key === 'p' || key === 'P') {
                this.paused = !this.paused;
                return;
            }

            // 暂停时不响应其他按键
            if (this.paused) {
                return;
            }

            // 根据按键执行对应操作
            switch (key) {
                // 上箭头 - 旋转
                case '\x1b[A':
                case 'w':
                case 'W':
                    this.rotate();
                    break;
                // 左箭头 - 左移
                case '\x1b[D':
                case 'a':
                case 'A':
                    this.move(-1);
                    break;
                // 右箭头 - 右移
                case '\x1b[C':
                case 'd':
                case 'D':
                    this.move(1);
                    break;
                // 下箭头 - 软下落
                case '\x1b[B':
                case 's':
                case 'S':
                    this.drop();
                    // 软下落也加分（每下落一格加 1 分）
                    this.score += 1;
                    break;
                // 空格 - 硬下落
                case ' ':
                    this.hardDrop();
                    break;
            }
        });

        /**
         * 游戏主循环
         * 使用 setTimeout 实现约 20 FPS 的刷新率
         * 负责：自动下落、渲染画面
         */
        const gameLoop = () => {
            // 游戏结束：只渲染不进行其他操作
            if (this.gameOver) {
                this.render();
                // 游戏结束时继续循环以响应按键
            }
            // 游戏中且未暂停：处理自动下落
            else if (!this.paused) {
                const now = Date.now();
                // 检查是否应该下落
                if (now - this.lastFall > this.fallInterval) {
                    // 尝试下落，失败则锁定方块
                    if (!this.drop()) {
                        this.lockPiece();
                    }
                    // 更新下落时间戳
                    this.lastFall = now;
                }
                // 渲染当前画面
                this.render();
            }

            // 50ms 后继续循环（约 20 FPS）
            setTimeout(gameLoop, 50);
        };

        // 启动游戏循环
        gameLoop();
    }

    /**
     * 退出游戏
     * 恢复终端状态并退出进程
     */
    exit() {
        // \x1b[?1049l - 退出备用屏幕，返回主屏幕
        process.stdout.write('\x1b[?1049l');
        // \x1b[?25h - 重新显示光标
        process.stdout.write('\x1b[?25h');

        // 恢复 raw mode（如果需要）
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
        }

        // 退出进程
        process.exit();
    }
}


// ==================== 程序入口 ====================

// 打印启动信息
console.log('Starting Tetris...\n');

// 创建游戏实例
new Tetris();

// ==================== 进程事件处理 ====================

// 进程正常退出时恢复终端状态
process.on('exit', () => {
    process.stdout.write('\x1b[?1049l');
    process.stdout.write('\x1b[?25h');
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
    }
});

// 捕获 Ctrl+C (SIGINT) 信号，优雅退出
process.on('SIGINT', () => {
    process.exit();
});
