"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDbAppManager = void 0;
const app_1 = require("../app");
const base_app_manager_1 = require("./base-app-manager");
const boolean_1 = require("boolean");
const aws_sdk_1 = require("aws-sdk");
const log_1 = require("../log");
class DynamoDbAppManager extends base_app_manager_1.BaseAppManager {
    constructor(server) {
        super();
        this.server = server;
        this.dynamodb = new aws_sdk_1.DynamoDB({
            apiVersion: '2012-08-10',
            region: server.options.appManager.dynamodb.region,
            endpoint: server.options.appManager.dynamodb.endpoint,
        });
    }
    findById(id) {
        return this.dynamodb.getItem({
            TableName: this.server.options.appManager.dynamodb.table,
            Key: {
                AppId: { S: id },
            },
        }).promise().then((response) => {
            let item = response.Item;
            if (!item) {
                if (this.server.options.debug) {
                    log_1.Log.error(`App ID not found: ${id}`);
                }
                return null;
            }
            return new app_1.App(this.unmarshallItem(item), this.server);
        }).catch(err => {
            if (this.server.options.debug) {
                log_1.Log.error('Error loading app config from dynamodb');
                log_1.Log.error(err);
            }
            return null;
        });
    }
    findByKey(key) {
        return this.dynamodb.query({
            TableName: this.server.options.appManager.dynamodb.table,
            IndexName: 'AppKeyIndex',
            ScanIndexForward: false,
            Limit: 1,
            KeyConditionExpression: 'AppKey = :app_key',
            ExpressionAttributeValues: {
                ':app_key': { S: key },
            },
        }).promise().then((response) => {
            let item = response.Items[0] || null;
            if (!item) {
                if (this.server.options.debug) {
                    log_1.Log.error(`App key not found: ${key}`);
                }
                return null;
            }
            return new app_1.App(this.unmarshallItem(item), this.server);
        }).catch(err => {
            if (this.server.options.debug) {
                log_1.Log.error('Error loading app config from dynamodb');
                log_1.Log.error(err);
            }
            return null;
        });
    }
    unmarshallItem(item) {
        let appObject = aws_sdk_1.DynamoDB.Converter.unmarshall(item);
        if (appObject.EnableClientMessages instanceof Buffer) {
            appObject.EnableClientMessages = (0, boolean_1.boolean)(appObject.EnableClientMessages.toString());
        }
        if (typeof appObject.Webhooks === 'string') {
            try {
                appObject.Webhooks = JSON.parse(appObject.Webhooks);
            }
            catch (e) {
                appObject.Webhooks = [];
            }
        }
        return appObject;
    }
}
exports.DynamoDbAppManager = DynamoDbAppManager;
