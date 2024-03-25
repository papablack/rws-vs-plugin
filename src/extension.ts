import * as vscode from 'vscode';
import path from 'path';
import { workspace, Disposable, ExtensionContext, OutputChannel } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	
} from 'vscode-languageclient/node';

let client: LanguageClient;

class ExtendedLanguageClient extends LanguageClient {
    private channel: OutputChannel;

    constructor(id: string, name: string, serverOptions: ServerOptions, clientOptions: LanguageClientOptions, outputChannel: OutputChannel) {
        super(id, name, serverOptions, clientOptions);
        this.channel = outputChannel;
    }

    get outputChannel(): OutputChannel {
        return this.channel;
    }

    handleLogMessage(message: any): void {
        if (message.type === 4) { // Log Message
            this.outputChannel.appendLine(message.message);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
	
	const serverModule = context.asAbsolutePath(
		path.join('out', 'server.js')
	);

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};
	
	const clientOptions: LanguageClientOptions = {		
		documentSelector: [{ scheme: 'file', language: 'rws-html' }],
		synchronize: {			
			fileEvents: workspace.createFileSystemWatcher('**/.html')
		}
	};
	const outputChannel = vscode.window.createOutputChannel("RWS Logs");
	outputChannel.show();

	client = new ExtendedLanguageClient(
		'rwsLanguageServer',
		'RWS HTML Language Server',
		serverOptions,
		clientOptions,
		outputChannel
	);	
	
	client.start();

	client.onNotification('rwsLanguageServer/info', (message: string) => {
		vscode.window.showInformationMessage(message);
	});

	client.onNotification('rwsLanguageServer/warn', (message: string) => {
		vscode.window.showWarningMessage(message);
	});

	client.onNotification('rwsLanguageServer/error', (message: string) => {
		vscode.window.showErrorMessage(message);
	});

	vscode.window.showInformationMessage('RWS Templates activated!');

}

export function deactivate() {}
