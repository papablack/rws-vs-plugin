"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const path_1 = __importDefault(require("path"));
// import runServer from './server';
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
class ExtendedLanguageClient extends node_1.LanguageClient {
    channel;
    constructor(id, name, serverOptions, clientOptions, outputChannel) {
        super(id, name, serverOptions, clientOptions);
        this.channel = outputChannel;
    }
    // Correct implementation of the getter for outputChannel
    get outputChannel() {
        return this.channel;
    }
    handleLogMessage(message) {
        if (message.type === 4) { // Log Message
            this.outputChannel.appendLine(message.message);
        }
    }
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    const serverModule = context.asAbsolutePath(path_1.default.join('out', 'server.js'));
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
        }
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'rws-html' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.html')
        }
    };
    const outputChannel = vscode.window.createOutputChannel("RWS Logs");
    outputChannel.show();
    // Create the language client and start the client.
    client = new ExtendedLanguageClient('rwsLanguageServer', 'RWS HTML Language Server', serverOptions, clientOptions, outputChannel);
    outputChannel.appendLine("This is a log message from client.");
    // Start the client. This will also launch the server
    client.start();
    vscode.window.showInformationMessage('Hello World from testvs!');
    console.log('Congratulations, your extension "testvs" is now active!', serverOptions, clientOptions);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map