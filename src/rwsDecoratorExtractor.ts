import * as ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { CompletionItemKind } from 'vscode-languageserver';

export type TypedResponse = {
    name: string;
    type: string | null;
    kind: CompletionItemKind;
    isFunction?: boolean;
    arguments?: TypedResponse[];
    className: string;
};


export interface ArgumentsExtracted {
    decoratorArgs?: {
        className: string | null;
        tagName: string | null;
        options: any | null;
    },
    properties: TypedResponse[],
    methods: TypedResponse[],
}

export function getTsApp(tsConfigPath: string): ts.Program {
    // Read tsconfig.json
    const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

    if (configFile.error) {
        console.error(configFile.error);
        throw new Error("Error reading tsconfig.json");
    }

    const parsedCommandLine = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsConfigPath),
    );

    const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);

    return program;
}

export function findPackageDir(currentPath: string, i: number = 0): string {
    if (i > 10) {
        throw new Error('Too much recursion applied. Create package.json somewhere in: ' + currentPath);
    }

    const packageJsonPath = path.join(currentPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        return currentPath;

    }

    const parentPackageJsonPath = path.join(currentPath + '/..', 'package.json');
    const parentPackageDir = path.dirname(parentPackageJsonPath);

    return findPackageDir(parentPackageDir, i + 1);
}

export function extractRWSViewArguments(filePath: string): ArgumentsExtracted {
    // Read the file content using Node.js's fs module    
    const tsConfigPath = path.resolve(`${findPackageDir(filePath)}/tsconfig.json`);
    const tsContent = path.resolve(`${path.dirname(filePath)}/component.ts`);

    const program = getTsApp(tsConfigPath);


    let argumentsExtracted: ArgumentsExtracted = {
        decoratorArgs: {
            className: null,
            tagName: null,
            options: null,
        },
        properties: [],
        methods: []
    };

    if (!fs.existsSync(filePath)) {
        console.log('No TS file detected');

        return argumentsExtracted;
    }

    let sourceFile: ts.SourceFile = program.getSourceFile(filePath) as ts.SourceFile;

    let foundDecorator = false;

    if (!sourceFile) {
        console.log('No parsed TS detected');

        return argumentsExtracted;
    }

    const classDeclaration: any = sourceFile.statements.find(
        (node: any): node is ts.ClassDeclaration => {
            if (ts.isClassDeclaration(node)) {
                const parentCheck = node.heritageClauses?.some(
                    (clause: any) =>
                        clause.token === ts.SyntaxKind.ExtendsKeyword &&
                        clause.types.some(
                            (type: any) =>
                                ts.isExpressionWithTypeArguments(type) &&
                                ts.isIdentifier(type.expression)
                        )
                ) as boolean;
                return parentCheck;
            }
            return false;
        }
    );

    if (classDeclaration) {
        // Get the class name
        const className = classDeclaration.name?.getText(sourceFile);


        // const classLine = findClassLine(sourceFile, classDeclaration);        

        argumentsExtracted.properties = classDeclaration.members
            .filter(ts.isPropertyDeclaration)
            .map((property: any) => ({
                name: property.name.getText(sourceFile),
                type: property.type ? property.type.getText(sourceFile) : null,
                kind: getCompletionItemKind(property),
                className: className,
                isFunction: isFunc(property),
                arguments: getPropArgs(property, sourceFile)
            }));

        argumentsExtracted.methods = classDeclaration.members
            .filter(ts.isMethodDeclaration)
            .map((method: any) => ({
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

function getPropArgs(prop: any, sourceFile: any)
{
    return prop?.parameters ? prop.parameters.map((param: any) => ({
        name: param.name.getText(sourceFile),
        type: param.type ? param.type.getText(sourceFile) : null,
        kind: getCompletionItemKind(param),
        isFunction: isFunc(param),
        arguments: isFunc(param) ? getPropArgs(param, sourceFile) : null
    })) : null;
}

function isFunc(prop: any){
    return prop.kind === ts.SyntaxKind.FunctionDeclaration || prop.kind === ts.SyntaxKind.MethodDeclaration;
}

function findClassLine(sourceFile: ts.SourceFile, classDeclaration: any): number | undefined {
    if (classDeclaration && ts.isClassDeclaration(classDeclaration)) {
        return sourceFile.getLineAndCharacterOfPosition(classDeclaration.getStart()).line + 1;
    }

    return undefined;
}

export function getCompletionItemKind(node: ts.Node): CompletionItemKind {
    switch (node.kind) {
        case ts.SyntaxKind.MethodDeclaration:
            return CompletionItemKind.Method;
        case ts.SyntaxKind.PropertyDeclaration:
            return CompletionItemKind.Property;
        case ts.SyntaxKind.VariableDeclaration:
            return CompletionItemKind.Variable;
        case ts.SyntaxKind.FunctionDeclaration:
            return CompletionItemKind.Function;
        case ts.SyntaxKind.ClassDeclaration:
            return CompletionItemKind.Class;
        case ts.SyntaxKind.InterfaceDeclaration:
            return CompletionItemKind.Interface;
        case ts.SyntaxKind.EnumDeclaration:
            return CompletionItemKind.Enum;
        case ts.SyntaxKind.ModuleDeclaration:
            return CompletionItemKind.Module;
        // Add more cases as needed
        default:
            return CompletionItemKind.Text;
    }
}