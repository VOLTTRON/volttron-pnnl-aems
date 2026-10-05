"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlConnection = void 0;
const graphqlConnection = (wsAuthService, wsLogger) => ({
    context: ({ req, extra, }) => {
        let user;
        if (req?.user) {
            user = req.user;
        }
        else if (extra?.socket?.user) {
            user = extra?.socket?.user;
        }
        else if (extra?.request?.user) {
            user = extra?.request?.user;
        }
        return {
            user,
        };
    },
    onConnect: async (context) => {
        const { extra } = context;
        const request = extra?.request;
        if (!request) {
            wsLogger.warn("Rejecting WS connect: no upgrade request on extra");
            return false;
        }
        try {
            const user = await wsAuthService.authenticateWebSocket(request);
            if (extra?.socket) {
                extra.socket.user = user;
            }
            request.user = user;
            wsLogger.log(user ? `WS connect: user=${user.id ?? "?"}` : "WS connect: anonymous");
            return true;
        }
        catch (error) {
            wsLogger.warn(`WS authenticateWebSocket threw: ${error?.message ?? error}`);
            return false;
        }
    },
});
exports.graphqlConnection = graphqlConnection;
//# sourceMappingURL=connection.js.map