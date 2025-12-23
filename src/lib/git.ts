import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Buffer } from 'buffer';

// Essential for isomorphic-git in browser
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}

const fs = new FS('gition-fs');
const dir = '/repo';

/**
 * Initializes a new Git repository in the browser's IndexedDB.
 */
export const initRepo = async () => {
    try {
        await fs.promises.mkdir(dir);
    } catch (_e) {
        // Directory might already exist
    }

    await git.init({ fs, dir });
    console.log('Git repo initialized at', dir);
};

/**
 * Clones a repository from a URL.
 * @param {string} url - The URL of the repository to clone.
 */
/**
 * Clones a repository from a URL.
 * @param {string} url - The URL of the repository to clone.
 */
export const cloneRepo = async (url: string) => {
    try {
        await fs.promises.mkdir(dir);
    } catch (_e) {
        // Directory might already exist
    }

    await git.clone({
        fs,
        http,
        dir,
        url,
        corsProxy: 'https://cors.isomorphic-git.org', // Public CORS proxy for isomorphic-git
        singleBranch: true,
        depth: 1
    });
    console.log('Git repo cloned from', url);
};

/**
 * Lists files in the repository.
 * @returns {Promise<string[]>} - A list of file paths.
 */
export const listFiles = async () => {
    const files = await git.listFiles({ fs, dir });
    return files;
};

/**
 * Reads the content of a file.
 * @param {string} filepath - The path to the file.
 * @returns {Promise<string>} - The file content.
 */
export const readFile = async (filepath: string) => {
    const content = await fs.promises.readFile(`${dir}/${filepath}`, 'utf8');
    return content as string;
};

/**
 * Writes content to a file.
 * @param {string} filepath - The path to the file.
 * @param {string} content - The content to write.
 */
export const writeFile = async (filepath: string, content: string) => {
    await fs.promises.writeFile(`${dir}/${filepath}`, content, 'utf8');
};

export { fs, git, dir };
