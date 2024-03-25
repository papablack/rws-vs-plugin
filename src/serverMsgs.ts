import { NotificationType, _Connection } from "vscode-languageserver";

export const PLUGIN_EVENTGROUP_ID = 'rwsLanguageServer';

function send(){

}

export class RWSServerLogger {
    constructor(private connection: _Connection){        
    }

    info(msg: string): void
    {
        this.connection.sendNotification(new NotificationType<string>(`${PLUGIN_EVENTGROUP_ID}/info`), msg);

    }

    warn(msg: string): void
    {
        this.connection.sendNotification(new NotificationType<string>(`${PLUGIN_EVENTGROUP_ID}/warn`), msg);

    }

    error(msg: string): void
    {
        this.connection.sendNotification(new NotificationType<string>(`${PLUGIN_EVENTGROUP_ID}/error`), msg);
    }
};