import * as ts from 'typescript';
import {ArgumentsExtracted, extractRWSViewArguments, getTsApp} from './rwsDecoratorExtractor';
import path from 'path';
import { RWSServerLogger } from './serverMsgs';

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
    classMetadata: ArgumentsExtracted | null,
    lastPreDotChar: string
}

export function parseJS(jsCode: string)
{
    //const packageDir = path.resolve(path.dirname(module.id));    
    
    const sourceFile = ts.createSourceFile(
        "html_js_template.js", 
        jsCode,
        ts.ScriptTarget.ESNext,
        true
    );
        
    function visit(node: ts.Node) {        
        if (ts.isFunctionDeclaration(node)) {            
            console.log("Found function:", node.name?.text || "anonymous");
        }
            
        ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
}

export function parseHtml(html: string, currentFileDir: string, logger: RWSServerLogger): ParsedTemplate | null 
{
    if(!isJsTemplate(html)){
        console.log('not detected template');
        return null;
    }
     
    const foundTemplatePartialJs = `const jsTemplate = ${getJsTemplate(html)};`;    

    if(!foundTemplatePartialJs){
        logger.warn('No component JS templates found in current code.');
        return null;
    }    
    
    const toDot = foundTemplatePartialJs.split('.').pop();      
    const comp = getComponentClass(currentFileDir + '/component.ts');    

    if(!comp){
        logger.warn('No component TS file was found next to HTML file.');
        return null;
    }
    
    const preDotText: any = foundTemplatePartialJs.split('.')[0];    

    return {
        lastPreDotChar: preDotText[preDotText.length - 1], 
        toDot: toDot as string,        
        classMetadata: comp ? comp : null
    };
}