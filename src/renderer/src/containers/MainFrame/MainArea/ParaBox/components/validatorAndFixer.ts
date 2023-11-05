/**
 * 该 utils 用于进行输入框的文本校验和更正
 * 注意传入类型必须为字符串，不能为 undefined 等值
 */
import { parseTimeString } from '@common/utils';

const INVALID_TEXT = '默认输入不合法提示';

export function notEmptyValidator(value: string) {
    return value.length ? undefined : INVALID_TEXT;
}

export function durationValidator(value: string) {
    return parseTimeString(value) >= 0 || !value.length ? undefined : INVALID_TEXT;
}

export function numberValidator(value: string) {
    return value.match(/^\d+(.\d+)?$/) ? undefined : INVALID_TEXT;
}

export function framerateValidator(value: string) {
    return value.match(/^\d+(.\d+)?i?$/) || value === '不改变' ? undefined : INVALID_TEXT;
}

export function durationFixer(value: string) {
    return value.replaceAll('：', ':').replaceAll('。', '.').replace(/[a-z]/g, '');
}
