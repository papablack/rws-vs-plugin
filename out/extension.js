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
const vscode = __importStar(require("vscode"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
class ExtendedLanguageClient extends node_1.LanguageClient {
    channel;
    constructor(id, name, serverOptions, clientOptions, outputChannel) {
        super(id, name, serverOptions, clientOptions);
        this.channel = outputChannel;
    }
    get outputChannel() {
        return this.channel;
    }
    handleLogMessage(message) {
        if (message.type === 4) { // Log Message
            this.outputChannel.appendLine(message.message);
        }
    }
}
function activate(context) {
    const serverModule = context.asAbsolutePath(path_1.default.join('out', 'server.js'));
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
        }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'rws-html' }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.html')
        }
    };
    const outputChannel = vscode.window.createOutputChannel("RWS Logs");
    outputChannel.show();
    client = new ExtendedLanguageClient('rwsLanguageServer', 'RWS HTML Language Server', serverOptions, clientOptions, outputChannel);
    client.start();
    client.onNotification('rwsLanguageServer/info', (message) => {
        vscode.window.showInformationMessage(message);
    });
    client.onNotification('rwsLanguageServer/warn', (message) => {
        vscode.window.showWarningMessage(message);
    });
    client.onNotification('rwsLanguageServer/error', (message) => {
        vscode.window.showErrorMessage(message);
    });
    vscode.window.showInformationMessage('RWS Templates activated!');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map