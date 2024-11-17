"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceChannelManager = void 0;
const log_1 = require("../log");
const private_channel_manager_1 = require("./private-channel-manager");
const utils_1 = require("../utils");
class PresenceChannelManager extends private_channel_manager_1.PrivateChannelManager {
    join(ws, channel, message) {
        return this.server.adapter.getChannelMembersCount(ws.app.id, channel).then(membersCount => {
            if (membersCount + 1 > ws.app.maxPresenceMembersPerChannel) {
                return {
                    success: false,
                    ws,
                    errorCode: 4100,
                    errorMessage: 'The maximum members per presence channel limit was reached',
                    type: 'LimitReached',
                };
            }
            let member = JSON.parse(message.data.channel_data);
            let memberSizeInKb = utils_1.Utils.dataToKilobytes(member.user_info);
            if (memberSizeInKb > ws.app.maxPresenceMemberSizeInKb) {
                return {
                    success: false,
                    ws,
                    errorCode: 4301,
                    errorMessage: `The maximum size for a channel member is ${ws.app.maxPresenceMemberSizeInKb} KB.`,
                    type: 'LimitReached',
                };
            }
            return super.join(ws, channel, message).then(response => {
                if (!response.success) {
                    return response;
                }
                return {
                    ...response,
                    ...{
                        member,
                    },
                };
            });
        }).catch(err => {
            log_1.Log.error(err);
            return {
                success: false,
                ws,
                errorCode: 4302,
                errorMessage: 'A server error has occured.',
                type: 'ServerError',
            };
        });
    }
    leave(ws, channel) {
        return super.leave(ws, channel).then(response => {
            return {
                ...response,
                ...{
                    member: ws.presence.get(channel),
                },
            };
        });
    }
    getDataToSignForSignature(socketId, message) {
        return `${socketId}:${message.data.channel}:${message.data.channel_data}`;
    }
}
exports.PresenceChannelManager = PresenceChannelManager;
