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
exports.parseHtml = exports.parseJS = exports.isJsTemplate = exports.getJsTemplate = void 0;
const ts = __importStar(require("typescript"));
const rwsDecoratorExtractor_1 = require("./rwsDecoratorExtractor");
const path_1 = __importDefault(require("path"));
const __jsTemplateRegex = /\$\{([^}]+)(?:\}|\s|$)/g;
function getJsTemplate(text) {
    const results = text.match(__jsTemplateRegex);
    return results && results.length ? results[0].replace('${', '') : null;
}
exports.getJsTemplate = getJsTemplate;
function isJsTemplate(text) {
    return __jsTemplateRegex.test(text);
}
exports.isJsTemplate = isJsTemplate;
function getComponentClass(filePath) {
    const classData = (0, rwsDecoratorExtractor_1.extractRWSViewArguments)(filePath);
    return classData;
}
function parseJS(jsCode) {
    const packageDir = path_1.default.resolve(path_1.default.dirname(module.id));
    // const tsConfigPath = path.resolve(`${packageDir}/tsconfig.json`);
    const sourceFile = ts.createSourceFile("html_js_template.js", jsCode, ts.ScriptTarget.ESNext, true);
    // Function to visit nodes in the AST
    function visit(node) {
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
exports.parseJS = parseJS;
function parseHtml(html, currentFileDir) {
    if (!isJsTemplate(html)) {
        console.log('not detected template');
        return null;
    }
    const foundTemplatePartialJs = `const jsTemplate = ${getJsTemplate(html)};`;
    if (!foundTemplatePartialJs) {
        return null;
    }
    const toDot = foundTemplatePartialJs.split('.').pop();
    const comp = getComponentClass(currentFileDir + '/component.ts');
    if (!comp) {
        return null;
    }
    return {
        toDot: toDot,
        classMetadata: comp ? comp : null
    };
}
exports.parseHtml = parseHtml;
//# sourceMappingURL=rwsIntegration.js.map