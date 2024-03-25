import * as ts from 'typescript';
import {ArgumentsExtracted, extractRWSViewArguments, getTsApp} from './rwsDecoratorExtractor';
import path from 'path';

const __jsTemplateRegex: RegExp = /\$\{([^}]+)(?:\}|\s|$)/g;

export function getJsTemplate(text: string): string | null 
{
    const results = text.match(__jsTemplateRegex);
    
    return results && results.length ? results[0].replace('${', '') : null;
}

export function isJsTemplate(text: string): boolean {    
    return __jsTemplateRegex.test(text);
}


function getComponentClass(filePath: string): ArgumentsExtracted
{
    const classData = extractRWSViewArguments(filePath);    
    return classData;
}

export interface ParsedTemplate {
    toDot: string,    
    classMetadata: ArgumentsExtracted | null
}

export function parseJS(jsCode: string)
{
    const packageDir = path.resolve(path.dirname(module.id));
    // const tsConfigPath = path.resolve(`${packageDir}/tsconfig.json`);
    
    const sourceFile = ts.createSourceFile(
        "html_js_template.js", 
        jsCode,
        ts.ScriptTarget.ESNext,
        true
    );
    
    // Function to visit nodes in the AST
    function visit(node: ts.Node) {
        // Check if the node is a function declaration
        if (ts.isFunctionDeclaration(node)) {
            // Log the name of the function
            console.log("Found function:", node.name?.text || "anonymous");
        }
    
        // Continue visiting nodes recursively
        ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
}

export function parseHtml(html: string, currentFileDir: string): ParsedTemplate | null 
{
    if(!isJsTemplate(html)){
        console.log('not detected template');
        return null;
    }
     
    const foundTemplatePartialJs = `const jsTemplate = ${getJsTemplate(html)};`;    

    if(!foundTemplatePartialJs){
        return null;
    }    
    
    const toDot = foundTemplatePartialJs.split('.').pop();      
    const comp = getComponentClass(currentFileDir + '/component.ts');

    if(!comp){
        return null;
    }

    return {
        toDot: toDot as string,        
        classMetadata: comp ? comp : null
    };
}