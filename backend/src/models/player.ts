export class Player {
    uuid: string;
    nickname: string;
    isHost: boolean;
    teamId?: string;
    isConnected: boolean;

    constructor(uuid: string, nickname: string, isHost: boolean, teamId?: string, isConnected: boolean = true) {
        this.uuid = uuid;
        this.nickname = nickname;
        this.isHost = isHost;
        this.teamId = teamId;
        this.isConnected = isConnected;
    }

    toJson(): any {
        return {
            uuid: this.uuid,
            nickname: this.nickname,
            isHost: this.isHost,
            teamId: this.teamId,
            isConnected: this.isConnected,
        };
    }
}
