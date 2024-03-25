"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RWSServerLogger = exports.PLUGIN_EVENTGROUP_ID = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
exports.PLUGIN_EVENTGROUP_ID = 'rwsLanguageServer';
function send() {
}
class RWSServerLogger {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    info(msg) {
        this.connection.sendNotification(new vscode_languageserver_1.NotificationType(`${exports.PLUGIN_EVENTGROUP_ID}/info`), msg);
    }
    warn(msg) {
        this.connection.sendNotification(new vscode_languageserver_1.NotificationType(`${exports.PLUGIN_EVENTGROUP_ID}/warn`), msg);
    }
    error(msg) {
        this.connection.sendNotification(new vscode_languageserver_1.NotificationType(`${exports.PLUGIN_EVENTGROUP_ID}/error`), msg);
    }
}
exports.RWSServerLogger = RWSServerLogger;
;
//# sourceMappingURL=serverMsgs.js.map