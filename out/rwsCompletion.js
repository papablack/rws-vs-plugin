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
exports.fillCompletions = exports.resolveCompletion = exports.runCompletion = void 0;
const node_1 = require("vscode-languageserver/node");
const ts = __importStar(require("typescript"));
const path_1 = __importDefault(require("path"));
const rwsIntegration_1 = require("./rwsIntegration");
const serverMsgs_1 = require("./serverMsgs");
function runCompletion(documents, connection) {
    const logger = new serverMsgs_1.RWSServerLogger(connection);
    return (textDocumentPosition) => {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document) {
            return [];
        }
        ;
        const text = document.getText();
        const offset = document.offsetAt(textDocumentPosition.position);
        const textBeforeOffset = text.substring(0, offset);
        const lastIndexDollarSign = textBeforeOffset.lastIndexOf('$');
        const lineHTML = textBeforeOffset.substring(lastIndexDollarSign, offset);
        const fileDir = path_1.default.dirname(path_1.default.resolve(textDocumentPosition.textDocument.uri.replace('file:', '')));
        const parsedTemplate = (0, rwsIntegration_1.parseHtml)(lineHTML, fileDir, logger);
        const _baseCompletions = [];
        let fastDirectives = false;
        if (!parsedTemplate || !parsedTemplate.classMetadata) {
            logger.warn('Template was not processed.');
            return _baseCompletions;
        }
        let completed = [];
        if (parsedTemplate.lastPreDotChar === 'T') {
            fastDirectives = true;
            const packageDir = path_1.default.resolve(__dirname, '..');
            fromDTS(`${packageDir}/fast-types/templating/when.d.ts`, completed);
            fromDTS(`${packageDir}/fast-types/templating/ref.d.ts`, completed);
            fromDTS(`${packageDir}/fast-types/templating/template.d.ts`, completed);
            fromDTS(`${packageDir}/fast-types/templating/repeat.d.ts`, completed);
            console.log('TACC', completed);
            return completed;
        }
        if (!fastDirectives) {
            completed = fillCompletions(parsedTemplate.classMetadata);
        }
        if (completed.length) {
            return completed;
        }
        return _baseCompletions;
    };
}
exports.runCompletion = runCompletion;
function resolveCompletion() {
    return (item) => {
        return item;
    };
}
exports.resolveCompletion = resolveCompletion;
function fillCompletions(classMetadata) {
    const completed = [];
    for (const ci of classMetadata?.properties || []) {
        completed.push({
            label: `${ci.name}: ${ci.type}`,
            insertText: ci.name,
            kind: ci.kind,
            data: {
                type: `${ci.type}`
            }
        });
    }
    for (const ci of classMetadata?.methods || []) {
        const methodArgs = ci.arguments?.map((item) => `${item.name}: ${item.type}`).join(', ') || '';
        completed.push({
            label: `${ci.name}(${methodArgs}): ${ci.type}`,
            insertText: `${ci.name}(${methodArgs})`,
            kind: ci.kind,
            data: {
                type: `${ci.type}`
            }
        });
    }
    return completed;
}
exports.fillCompletions = fillCompletions;
function checkType(completed, member, overrideName) {
    let result = null;
    if (ts.isPropertySignature(member)) {
        const memberName = member.name.getText();
        const memberType = member.type?.getText() || 'any';
        result = {
            label: memberName,
            kind: node_1.CompletionItemKind.Property,
            detail: `(property) ${memberName}: ${memberType}`,
        };
    }
    else if (ts.isMethodSignature(member)) {
        const memberName = member.name.getText();
        const parameters = member.parameters.map((param) => param.getText()).join(', ');
        const returnType = member.type?.getText() || 'any';
        result = {
            label: memberName,
            kind: node_1.CompletionItemKind.Method,
            detail: `(method) ${memberName}(${parameters}): ${returnType}`,
        };
    }
    if (result && overrideName) {
        result.label = overrideName;
    }
    if (result) {
        completed.push(result);
    }
}
function fromDTS(dtsFilePath, completed) {
    // Create a TypeScript program and extract type information
    const program = ts.createProgram([dtsFilePath], { allowJs: true });
    const sourceFile = program.getSourceFile(dtsFilePath);
    const checker = program.getTypeChecker();
    const processedSymbols = new Set();
    if (sourceFile) {
        ts.forEachChild(sourceFile, (node) => {
            if (!ts.isExportDeclaration(node) && !ts.isExportSpecifier(node) && ts.isFunctionDeclaration(node)) {
                processNode(completed, node, checker);
            }
        });
    }
}
function processNode(completed, node, checker) {
    // Function declarations might not always have a name (e.g., in case of default exports), so handle that case.
    const functionName = node.name ? node.name.getText() : "anonymous";
    // Process parameters to get their text representation.
    const parameters = node.parameters.map(param => {
        // Utilize the TypeChecker for more accurate type information if available.
        let paramType = param.type ? param.type.getText() : 'any';
        if (checker && param.type) {
            const type = checker.getTypeAtLocation(param.type);
            paramType = checker.typeToString(type);
        }
        return `${param.name.getText()}: ${paramType}`;
    }).join(', ');
    // Process the return type similarly, utilizing the TypeChecker if available for accuracy.
    let returnType = 'void'; // Default function return type if not specified.
    if (node.type) {
        returnType = node.type.getText();
        if (checker && node.type) {
            const type = checker.getTypeAtLocation(node.type);
            returnType = checker.typeToString(type);
        }
    }
    completed.push({
        label: functionName,
        kind: node_1.CompletionItemKind.Function, // Changed to Function to better represent a function declaration
        detail: `(function) ${functionName}(${parameters}): ${returnType}`,
    });
}
//# sourceMappingURL=rwsCompletion.js.map