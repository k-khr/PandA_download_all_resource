import Tar from "./tar.ts/tar";

const DEFAULT_ROOTDIRNAME = 'download';
const TIMEOUT = 5 * 1000; // 5 seconds

async function getElementUntil<T>(fn: ()=>T|null, defaultVal = null): Promise<T> {
    const interval = 250;
    let tol = TIMEOUT;
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            let ret = fn();
            if (ret !== null) {
                clearInterval(intervalId);
                resolve(ret);
            }
            tol -= interval;
            if (tol < 0) {
                if (defaultVal) { resolve(defaultVal) }
                clearInterval(intervalId);
                reject();
            }
        }, interval);
    });
}

class FileEntry {
    filename: string;
    src: string;

    constructor(filename, src) {
        this.filename = filename;
        this.src = src;
    }
}


function getFileEntriesFromTree(root: HTMLUListElement, namePrefix: string): FileEntry[] {
    let fileEntries: FileEntry[] = [];
    for (let i=0; i<root.children.length; i++) {
        const child = root.children[i];
        if (child instanceof HTMLLIElement) {
            const dataUrl: string = child.attributes['data_url']?.value || '';
            const isDirectory = dataUrl.match(/https?:\/\//) === null;
            const nodename = child.querySelector('a')?.text;
            if (isDirectory) {
                const ul = child.querySelector('ul');
                if (ul !== null) {
                    const additionalEntries = getFileEntriesFromTree(ul, dataUrl);
                    fileEntries = [...fileEntries, ...additionalEntries];
                }
            } else { // isFile
                const entry = new FileEntry(namePrefix + nodename, dataUrl);
                fileEntries.push(entry);
            }
        }
    }
    return fileEntries;
}

(async()=>{
    const navigate = document.getElementById('navigate');
    navigate?.click();
    const navigatePanelInner = await getElementUntil<HTMLElement>(
        ()=>document.getElementById('navigatePanelInner')
    );
    const getExpandIconList: () => NodeListOf<HTMLElement>|null = () => {
        const nl: NodeListOf<HTMLElement> = navigatePanelInner?.querySelectorAll('.jstree-closed i.jstree-ocl');
        if (nl.length == 0) return null;
        return nl;
    };
    let list: NodeListOf<HTMLElement> | never[] = await getElementUntil<NodeListOf<HTMLElement>>(getExpandIconList) || [];
    while (list.length > 0) {
        list.forEach((e: HTMLElement) => { e.click() });
        try {
            list = await getElementUntil<NodeListOf<HTMLElement>>(getExpandIconList) || [];
        } catch {
            break;
        }
    }
    
    const treeRoot: HTMLLIElement = navigatePanelInner?.querySelector('ul')?.querySelector('li');
    const rootStr = treeRoot.attributes['data_url']?.value;
    const rootDirName = treeRoot.querySelector('a')?.text || DEFAULT_ROOTDIRNAME;
    
    const fileEntries = getFileEntriesFromTree(treeRoot.querySelector('ul'), rootStr);
    const filenames = fileEntries.map(el => el.filename.replace(rootStr, rootDirName + '/'));
    const filesrc = fileEntries.map(el => el.src);
    // debugger;
    const tarBlob = await Tar.create(filenames, filesrc);
    const tarUrl = URL.createObjectURL(tarBlob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = tarUrl;
    a.download = rootDirName + '.tar';
    document.body.append(a);
    a.click();
})();
