// 由编译脚本插入的内容，vite 编译时自动进行全文替换
declare const buildInfo: {
    gitCommit: string;
    isDev: boolean;
} | undefined;
