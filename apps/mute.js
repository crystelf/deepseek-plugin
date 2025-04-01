import configControl from "./../lib/config/configManager.js"
import date from "./../components/date.js"

let DeepseekConfig = {};

export class Deepseek extends plugin {
    constructor() {
        super({
            name: 'deepseekMute',
            dsc: 'deepseek禁言管理',
            event: 'message',
            priority: 1000000,
            rule: [
                {
                    reg: '^#deepseek查看禁言$',
                    fnc: 'checkMute',
                    permission: 'master'
                }
            ]
        });

        this.initMuteListener();
    }

    initMuteListener() {
        Bot.on?.("notice.group", async (e) => {
            if (e.sub_type === "ban" && e.user_id === e.bot.uin) {
                await this.handleMuteEvent(e)
            }
        });
    }

    async handleMuteEvent(e) {
        DeepseekConfig = configControl.getConfig()
        const group_id = e.group_id

        if (e.duration === 0) {
            await this.handleUnmute(group_id)
        } else {
            await this.handleMute(group_id, e.duration)
        }
    }

    async handleMute(group_id, duration) {
        const muteEndTime = Math.floor(Date.now() / 1000) + duration
        DeepseekConfig.muteInfo = DeepseekConfig.muteInfo || {}
        DeepseekConfig.muteInfo[group_id] = muteEndTime

        await configControl.updateConfig(DeepseekConfig);
        console.log(`Bot在群 ${group_id} 中被禁言! 结束时间：${new Date(muteEndTime * 1000).toLocaleString()}`)

        setTimeout(async () => {
            await this.handleUnmute(group_id)
        }, duration * 1000)
    }

    async handleUnmute(group_id) {
        if (DeepseekConfig.muteInfo?.[group_id]) {
            delete DeepseekConfig.muteInfo[group_id]
            await configControl.updateConfig(DeepseekConfig)
            console.log(`Bot在群 ${group_id} 的禁言已自动解除`)
        }
    }

    async checkMute(e) {
        try {
            DeepseekConfig = configControl.getConfig()
            const muteInfo = DeepseekConfig.muteInfo || {}

            if (Object.keys(muteInfo).length === 0) {
                return e.reply("当前没有被禁言的群组~")
            }

            let message = "当前禁言状态：\n"
            const now = Math.floor(Date.now() / 1000)

            for (const [group_id, endTime] of Object.entries(muteInfo)) {
                const remaining = endTime - now
                if (remaining > 0) {
                    const timeStr = date.formatDuration(remaining);
                    message += `\n群 ${group_id}：剩余 ${timeStr} (${new Date(endTime * 1000).toLocaleString()})`
                } else {
                    delete muteInfo[group_id]
                }
            }

            if (Object.keys(muteInfo).length === 0) {
                await configControl.updateConfig(DeepseekConfig)
                return e.reply("所有禁言已过期，没有正在禁言的群组~")
            }

            e.reply(message)
        } catch (err) {
            console.error('检查禁言失败:', err)
            e.reply("检查禁言状态时出错，请查看日志~")
        }
    }
}