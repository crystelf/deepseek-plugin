import fc from "./../components/tools.js"
import {deepseekConfigPath} from "#path";
let DeepseekConfig = {}

export class Deepseek extends plugin {
    constructor() {
        super({
            name: 'deepseekMute',
            dsc: 'deepseekMute',
            event: 'message',
            priority: 100,
            rule: [{}]
        });

        Bot.on?.("notice.group",async(e) => {
            // to do 优化
            DeepseekConfig = fc.readJSON(deepseekConfigPath,"root")
            if(e.sub_type === "ban" && e.user_id === e.bot.uin){
                const group_id = e.group_id
                if(e.duration === 0){
                    delete DeepseekConfig.muteInfo[group_id]
                    fc.safewriteJSON(deepseekConfigPath,DeepseekConfig,"root",4)
                    console.log(`Bot在群 ${group_id} 中被解除禁言，已从小黑屋中移除，小调皮..`)
                }else{
                    const muteEndTime = Math.floor(Date.now() / 1000) + e.duration
                    DeepseekConfig.muteInfo[group_id] = muteEndTime
                    fc.safewriteJSON(deepseekConfigPath, DeepseekConfig,"root",4)
                    console.log(`Bot在群 ${group_id} 中被禁言!禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}.小坏蛋..`)
                    setTimeout(() => {
                        delete DeepseekConfig.muteInfo[group_id]
                        fc.safewriteJSON(deepseekConfigPath, DeepseekConfig,"root",4)
                        console.log(`Bot在群 ${group_id} 的禁言已自动解除..`)
                    },e.duration*1000)
                }
            }

        });
    }

}