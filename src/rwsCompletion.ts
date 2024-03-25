import {
    TextDocuments,
    CompletionItem,
    TextDocumentPositionParams,
    _Connection,
    CompletionItemKind,
} from 'vscode-languageserver/node';
import * as ts from 'typescript';
import fs from 'fs';
import {
    TextDocument
} from 'vscode-languageserver-textdocument';

import path from 'path';
import { ParsedTemplate, parseHtml } from './rwsIntegration';
import { RWSServerLogger } from './serverMsgs';
import { ArgumentsExtracted } from './rwsDecoratorExtractor';

export function runCompletion(documents: TextDocuments<TextDocument>, connection: _Connection): (textDocumentPosition: TextDocumentPositionParams) => CompletionItem[] {
    const logger = new RWSServerLogger(connection);

    return (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
        const document = documents.get(textDocumentPosition.textDocument.uri);
        if (!document) { return []; };

        const text = document.getText();
        const offset = document.offsetAt(textDocumentPosition.position);
        const textBeforeOffset = text.substring(0, offset);
        const lastIndexDollarSign = textBeforeOffset.lastIndexOf('$');
        const lineHTML = textBeforeOffset.substring(lastIndexDollarSign, offset);

        const fileDir = path.dirname(path.resolve(textDocumentPosition.textDocument.uri.replace('file:', '')));
        const parsedTemplate: ParsedTemplate | null = parseHtml(lineHTML, fileDir, logger);
        const _baseCompletions: CompletionItem[] = [];

        let fastDirectives = false;

        if (!parsedTemplate || !parsedTemplate.classMetadata) {
            logger.warn('Template was not processed.');
            return _baseCompletions;
        }

        let completed: CompletionItem[] = [];

        if (parsedTemplate.lastPreDotChar === 'T') {
            fastDirectives = true;            
            const packageDir = path.resolve(__dirname, '..');

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

export function resolveCompletion(): (item: CompletionItem) => CompletionItem {
    return (item: CompletionItem): CompletionItem => {        
        return item;
    };
}


export function fillCompletions(classMetadata: ArgumentsExtracted): CompletionItem[] {
    const completed: CompletionItem[] = [

    ];

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

function checkType(completed: CompletionItem[], member: ts.Node, overrideName?: string): void {
    let result: CompletionItem | null = null;

    if (ts.isPropertySignature(member)) {        
        const memberName = member.name.getText();
        const memberType = member.type?.getText() || 'any';

        result = {
            label: memberName,
            kind: CompletionItemKind.Property,
            detail: `(property) ${memberName}: ${memberType}`,
        };
    } else if (ts.isMethodSignature(member)) {        

        const memberName = member.name.getText();
        const parameters = member.parameters.map((param) => param.getText()).join(', ');
        const returnType = member.type?.getText() || 'any';

        result = {
            label: memberName,
            kind: CompletionItemKind.Method,
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

function fromDTS(dtsFilePath: string, completed: CompletionItem[]): void
{    
    // Create a TypeScript program and extract type information
    const program = ts.createProgram([dtsFilePath], { allowJs: true });
    const sourceFile = program.getSourceFile(dtsFilePath);
    const checker = program.getTypeChecker();
    const processedSymbols = new Set<ts.Symbol>();

    if (sourceFile) {
        ts.forEachChild(sourceFile, (node: ts.Node) => {
            if(!ts.isExportDeclaration(node) && !ts.isExportSpecifier(node) && ts.isFunctionDeclaration(node)){
                processNode(completed, node, checker);
            }      
        });
    }    
}

function processNode(completed: CompletionItem[], node: ts.FunctionDeclaration, checker?: ts.TypeChecker): void {
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
        kind: CompletionItemKind.Function, // Changed to Function to better represent a function declaration
        detail: `(function) ${functionName}(${parameters}): ${returnType}`,
    });
}
