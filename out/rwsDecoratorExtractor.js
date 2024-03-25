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
exports.getCompletionItemKind = exports.extractRWSViewArguments = exports.findPackageDir = exports.getTsApp = void 0;
const ts = __importStar(require("typescript"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_languageserver_1 = require("vscode-languageserver");
function getTsApp(tsConfigPath) {
    // Read tsconfig.json
    const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    if (configFile.error) {
        console.error(configFile.error);
        throw new Error("Error reading tsconfig.json");
    }
    const parsedCommandLine = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path_1.default.dirname(tsConfigPath));
    const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);
    return program;
}
exports.getTsApp = getTsApp;
function findPackageDir(currentPath, i = 0) {
    if (i > 10) {
        throw new Error('Too much recursion applied. Create package.json somewhere in: ' + currentPath);
    }
    const packageJsonPath = path_1.default.join(currentPath, 'package.json');
    if (fs_1.default.existsSync(packageJsonPath)) {
        return currentPath;
    }
    const parentPackageJsonPath = path_1.default.join(currentPath + '/..', 'package.json');
    const parentPackageDir = path_1.default.dirname(parentPackageJsonPath);
    return findPackageDir(parentPackageDir, i + 1);
}
exports.findPackageDir = findPackageDir;
function extractRWSViewArguments(filePath) {
    // Read the file content using Node.js's fs module    
    const tsConfigPath = path_1.default.resolve(`${findPackageDir(filePath)}/tsconfig.json`);
    const tsContent = path_1.default.resolve(`${path_1.default.dirname(filePath)}/component.ts`);
    const program = getTsApp(tsConfigPath);
    let argumentsExtracted = {
        decoratorArgs: {
            className: null,
            tagName: null,
            options: null,
        },
        properties: [],
        methods: []
    };
    if (!fs_1.default.existsSync(filePath)) {
        console.log('No TS file detected');
        return argumentsExtracted;
    }
    let sourceFile = program.getSourceFile(filePath);
    let foundDecorator = false;
    if (!sourceFile) {
        console.log('No parsed TS detected');
        return argumentsExtracted;
    }
    const classDeclaration = sourceFile.statements.find((node) => {
        if (ts.isClassDeclaration(node)) {
            const parentCheck = node.heritageClauses?.some((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword &&
                clause.types.some((type) => ts.isExpressionWithTypeArguments(type) &&
                    ts.isIdentifier(type.expression)));
            return parentCheck;
        }
        return false;
    });
    if (classDeclaration) {
        // Get the class name
        const className = classDeclaration.name?.getText(sourceFile);
        // const classLine = findClassLine(sourceFile, classDeclaration);        
        argumentsExtracted.properties = classDeclaration.members
            .filter(ts.isPropertyDeclaration)
            .map((property) => ({
            name: property.name.getText(sourceFile),
            type: property.type ? property.type.getText(sourceFile) : null,
            kind: getCompletionItemKind(property),
            className: className,
            isFunction: isFunc(property),
            arguments: getPropArgs(property, sourceFile)
        }));
        argumentsExtracted.methods = classDeclaration.members
            .filter(ts.isMethodDeclaration)
            .map((method) => ({
            name: method.name.getText(sourceFile),
            type: method.type ? method.type.getText(sourceFile) : null,
            kind: getCompletionItemKind(method),
            className: className,
            isFunction: isFunc(method),
            arguments: getPropArgs(method, sourceFile)
        }));
        const heritage = classDeclaration.heritageClauses?.[0];
        if (heritage) {
            const extendedClass = heritage.types[0].getText(sourceFile);
            console.log('Extended Class:', extendedClass);
        }
    }
    return argumentsExtracted;
}
exports.extractRWSViewArguments = extractRWSViewArguments;
function getPropArgs(prop, sourceFile) {
    return prop?.parameters ? prop.parameters.map((param) => ({
        name: param.name.getText(sourceFile),
        type: param.type ? param.type.getText(sourceFile) : null,
        kind: getCompletionItemKind(param),
        isFunction: isFunc(param),
        arguments: isFunc(param) ? getPropArgs(param, sourceFile) : null
    })) : null;
}
function isFunc(prop) {
    return prop.kind === ts.SyntaxKind.FunctionDeclaration || prop.kind === ts.SyntaxKind.MethodDeclaration;
}
function findClassLine(sourceFile, classDeclaration) {
    if (classDeclaration && ts.isClassDeclaration(classDeclaration)) {
        return sourceFile.getLineAndCharacterOfPosition(classDeclaration.getStart()).line + 1;
    }
    return undefined;
}
function getCompletionItemKind(node) {
    switch (node.kind) {
        case ts.SyntaxKind.MethodDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Method;
        case ts.SyntaxKind.PropertyDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Property;
        case ts.SyntaxKind.VariableDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Variable;
        case ts.SyntaxKind.FunctionDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Function;
        case ts.SyntaxKind.ClassDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Class;
        case ts.SyntaxKind.InterfaceDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Interface;
        case ts.SyntaxKind.EnumDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Enum;
        case ts.SyntaxKind.ModuleDeclaration:
            return vscode_languageserver_1.CompletionItemKind.Module;
        // Add more cases as needed
        default:
            return vscode_languageserver_1.CompletionItemKind.Text;
    }
}
exports.getCompletionItemKind = getCompletionItemKind;
//# sourceMappingURL=rwsDecoratorExtractor.js.map