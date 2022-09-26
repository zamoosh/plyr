import type { GenericObject } from 'types/generic.type';

/** @module */

const protocol = window.location.protocol;

/**
 * @param {any} item - The variable to test.
 * @returns {boolean} Is the value of `item` null, undefined or an empty string?
 */
export function exists(item: any): boolean {
    switch (typeof (item)) {
        case 'string':
            return (item.length > 0);
        case 'object':
            return (item !== null);
        case 'undefined':
            return false;
        default:
            return true;
    }
}

/**
 * @returns {boolean} Is the current page hosted over HTTPS?
 */
export function isHTTPS(): boolean {
    return protocol === 'https:';
}

/**
 * @returns {boolean} Is the current page hosted over the File protocol?
 */
export function isFileProtocol(): boolean {
    return protocol === 'file:';
}

/**
 * @param {string} file - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the file extension.
 * @returns {boolean} Is `file` an RTMP link or does `type` equal 'rtmp'?
 */
export function isRtmp(file: string, type?: string): boolean {
    return (file.indexOf('rtmp:') === 0 || type === 'rtmp');
}

/**
 * @param {string} path - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the media url.
 * @returns {boolean} Is `path` a YouTube link or does `type` equal 'youtube'?
 */
export function isYouTube(path: string, type?: string): boolean {
    return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
}

/**
 * @param {any} value - The variable to test.
 * @returns {string} The typeof object, 'array' or 'null'.
 */
export function typeOf(value: any): string {
    if (value === null) {
        return 'null';
    }
    const typeofString = typeof value;
    if (typeofString === 'object') {
        if (Array.isArray(value)) {
            return 'array';
        }
    }
    return typeofString;
}

/**
 * Indicates whether or not the customObj has *at least* the same keys as the defaultObj; the customObj could have more keys.
 * @param {GenericObject} defaultObj - The object that determines the desired set of keys.
 * @param {GenericObject} customObj - The object we want to verify has, at least, the same keys as defaultObj.
 * @param {function} predicate - The function evaluating whether the property has a valid value and can be considered compliant. Inputs are the object and its key.
 * @returns {boolean} Does the customObj have at least the same keys as defaultObj, and do their properties also share the same keys ?
 */
export function isDeepKeyCompliant(defaultObj: GenericObject, customObj: GenericObject, predicate: (x: string, y: object) => boolean): boolean {
    const defaultKeys = Object.keys(defaultObj);
    return Object.keys(customObj).length >= defaultKeys.length &&
        defaultKeys.every(key => {
            const defaultValue = defaultObj[key];
            const customValue = customObj[key];
            if (defaultValue && typeof defaultValue === 'object') {
                if (customValue && typeof customValue === 'object') {
                    return isDeepKeyCompliant(defaultValue, customValue, predicate);
                }
                return false;
            }
            return predicate(key, defaultObj);
        });
}
