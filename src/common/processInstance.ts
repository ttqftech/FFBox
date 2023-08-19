import EventEmitter from 'events';
import { ChildProcess, SpawnOptions } from 'child_process';
import { TypedEventEmitter } from '@common/utils';
import { spawnInvoker, ErrorType } from '@common/spawnInvoker';

interface ProcessInstanceEvent {
	data: (arg: { content: string }) => void;
	stderr: (arg: { content: string }) => void;
	finished: () => void;	// 正常退出时触发
	escaped: (arg: { code: number }) => void;	// 非正常退出（返回值不为 0）时触发
	closed: (arg: { code: number }) => void;	// 任何情况进程结束都触发
}

type Options = SpawnOptions & Partial<{
	stdoutParser: 'line' | 'json';  // 分割 stdout 的方式，若不指定则原样输出到 data 事件
	stderrAsStdOut: boolean;  // 为真时将 stderr 当作 stdout 输出到 data 事件，否则触发 stderr 事件
}>;

class ProcessInstance extends (EventEmitter as new () => TypedEventEmitter<ProcessInstanceEvent>) {
	private process: ChildProcess | null;
	private stringBuffer: string;
	private options: Options;
	// private requireStop: boolean;
	private jsonStringStack: Array<string>;
	private jsonStringBuffer: string;

	constructor() {
		super();
		this.reset();
	}

	/**
	 * 启动进程
	 */
	public start(url: string, params?: Array<string>, options?: Options): Promise<void> {
		if (this.process) {
			return Promise.reject(new Error('进程已启动'));
		}
		this.options = options || {};
		this.process = null;
		return new Promise((resolve, reject) => {
			spawnInvoker(url, params, options).then((_process) => {
				this.process = _process;
				this.mountSpawnEvents();
				resolve();
			}).catch((reason: ErrorType) => {
				reject(typeof reason === 'string' ? new Error(`${url} ${reason}`) : `${url} ${reason}`);
			});
		});
	}

	/**
	 * 向管道发送字符串
	 */
	public sendKey(key: string) {
		if (!this.process) {
			return;
		}
		this.process.stdin!.write(key);
	}

	/**
	 * 发送信号
	 */
	public sendSig(str: number) {
		if (!this.process) {
			return;
		}
		this.process.kill(str);
	}

	/**
	 * 用于在发生解析错误时清除解析缓冲区
	 */
	public clearBuffer() {
		this.stringBuffer = '';
		this.jsonStringBuffer = '';
		this.jsonStringStack.splice(0, this.jsonStringStack.length);
	}

	/**
	 * 挂载 spawn 事件
	 */
	private mountSpawnEvents() {
		this.process!.stdout!.on('data', (data) => {
			if (this.options.stdoutParser) {
				this.stdoutProcessing(data);
			} else {
				this.emit('data', { content: data });
			}
		});
		this.process!.stderr!.on('data', (data) => {
			if (this.options.stderrAsStdOut) {
				if (this.options.stdoutParser) {
					this.stdoutProcessing(data);
				} else {
					this.emit('data', { content: data });
				}
			} else {
				this.emit('stderr', { content: data });
			}
		});
		this.process!.on('close', (code) => {
			this.emit('closed', { code });
			if (code) {
				this.emit('escaped', { code });
			}
			this.reset();
		});
	}

	/**
	 * 将 stdout/stderr 推入缓存中作进一步处理
	 */
	private stdoutProcessing(data: string) {
		this.stringBuffer += data.toString();
		this.dataProcessing();
	}

	/**
	 * 管道消息处理
	 * @emits data，见 ProcessInstanceEvent
	 */
	private dataProcessing() {
		if (this.options.stdoutParser === 'line') {
			const newLinePos = this.stringBuffer.indexOf('\n') >= 0 ? this.stringBuffer.indexOf('\n') : this.stringBuffer.indexOf(`\r`);
			if (newLinePos < 0) {
				// 一行没接收完，等待后续数据
				return;
			}
			// 获得一行数据
			const thisLine = this.stringBuffer.slice(0, newLinePos);
			this.stringBuffer = this.stringBuffer.slice(newLinePos + 1);
			// console.log(thisLine);
			this.emit('data', { content: thisLine });
		} else if (this.options.stdoutParser === 'json') {
			// 简易 json parser，仅根据括号关系分割 json，不检查语法问题
			while (this.stringBuffer.length) {
				// cycle1 的 for 循环将对 buffer 中的数据做解析，然后清空 buffer
				// 若中途解析完成了一个 json，cycle1 将会提前结束，留下后续未解析数据在 buffer 中，此时需要依靠外层 while 继续解析
				cycle1:
				for (const char of this.stringBuffer) {
					switch (char) {
						case '{':
						case '[':
							// 遇到左括号，检查是否在字符串内以决定是否操作栈
							if (this.jsonStringStack[0] !== '"') {
								this.jsonStringStack.unshift(char);
							}
							this.jsonStringBuffer += char;
							break;
						case '"':
							if (this.jsonStringStack[0] !== '"') {
								this.jsonStringStack.unshift(char);
							} else {
								this.jsonStringStack.shift();
							}
							this.jsonStringBuffer += char;
							break;
						case ']':
						case '}':
							// 遇到右括号，检查是否在字符串内以决定是否操作栈
							if (this.jsonStringStack[0] !== '"') {
								this.jsonStringStack.shift();
							}
							this.jsonStringBuffer += char;
							if (!this.jsonStringStack.length) {
								// 获得 json 字符串数据
								this.stringBuffer = this.stringBuffer.slice(this.jsonStringBuffer.length + 1);
								// console.log(this.jsonStringBuffer);
								this.emit('data', { content: this.jsonStringBuffer });
								this.jsonStringBuffer = '';
								break cycle1;
							}
							break;
						default:
							break;
					}
				}
				this.jsonStringBuffer = '';
			}
		}
	}

	/**
	 * 重置 ProcessInstance 状态
	 */
	private reset() {
		this.process = null;
		this.stringBuffer = '';
		this.options = {};
		this.jsonStringBuffer = '';
		this.jsonStringStack = [];
		// this.requireStop = false;
	}
}

export default ProcessInstance;
