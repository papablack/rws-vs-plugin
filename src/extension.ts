// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
// import runServer from './server';
import { workspace, Disposable, ExtensionContext,OutputChannel } from 'vscode';
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

    // Correct implementation of the getter for outputChannel
    get outputChannel(): OutputChannel {
        return this.channel;
    }

    handleLogMessage(message: any): void {
        if (message.type === 4) { // Log Message
            this.outputChannel.appendLine(message.message);
        }
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	const serverModule = context.asAbsolutePath(
		path.join('out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'rws-html' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.html')
		}
	};
	const outputChannel = vscode.window.createOutputChannel("RWS Logs");
	outputChannel.show();

	// Create the language client and start the client.
	client = new ExtendedLanguageClient(
		'rwsLanguageServer',
		'RWS HTML Language Server',
		serverOptions,
		clientOptions,
		outputChannel
	);

	outputChannel.appendLine("This is a log message from client.");


	// Start the client. This will also launch the server
	client.start();

	vscode.window.showInformationMessage('Hello World from testvs!');
	console.log('Congratulations, your extension "testvs" is now active!', serverOptions, clientOptions);

}

// This method is called when your extension is deactivated
export function deactivate() {}
