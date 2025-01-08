import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('index-hidden-files.indexFiles', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('Please select a file or folder');
            return;
        }

        try {
            await processFileOrDirectory(uri);
            vscode.window.showInformationMessage('Indexing completed successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Error during indexing: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function processFileOrDirectory(uri: vscode.Uri): Promise<void> {
    const stat = await vscode.workspace.fs.stat(uri);
    
    if (stat.type === vscode.FileType.Directory) {
        const entries = await vscode.workspace.fs.readDirectory(uri);
        for (const [name, type] of entries) {
            const childUri = vscode.Uri.file(path.join(uri.fsPath, name));
            await processFileOrDirectory(childUri);
        }
    } else if (stat.type === vscode.FileType.File) {
        await processFile(uri);
    }
}

async function processFile(uri: vscode.Uri): Promise<void> {
    // 忽略二进制文件和一些特定的文件类型
    const ignoredExtensions = ['.exe', '.dll', '.jpg', '.png', '.gif'];
    if (ignoredExtensions.includes(path.extname(uri.fsPath))) {
        return;
    }

    try {
        // 打开文档
        const doc = await vscode.workspace.openTextDocument(uri);
        // 显示文档（这会触发 VSCode 的索引机制）
        const editor = await vscode.window.showTextDocument(doc, { preview: true });
        // 等待一小段时间确保索引完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 关闭文档
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    } catch (error) {
        console.log(`Failed to process file ${uri.fsPath}: ${error}`);
    }
}

export function deactivate() {}