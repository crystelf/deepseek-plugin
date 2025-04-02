import {configControl} from "#lib"
import {tools} from "#components";

let chatTools = {
    async checkChat(msg, e) {
        let DeepseekConfig = configControl.getConfig()
        let mode = DeepseekConfig.mode
        const randomNumber = tools.randomInt(0,100)
        let flag = true
        if (randomNumber >= DeepseekConfig.checkChat.rdNum) flag = false
        if (DeepseekConfig.checkChat.masterReply){
            if(e.isMaster) flag = true
        }
        if (DeepseekConfig.checkChat.userId.includes(e.user_id)) flag = true
        if (DeepseekConfig.checkChat.blackGroups.includes(e.group_id)) flag = false
        const group_id = e.group_id
        const muteEndTime = DeepseekConfig.muteInfo[group_id]
        if (muteEndTime) {
            const currentTimestamp = Math.floor(Date.now() / 1000)
            if (currentTimestamp < muteEndTime) {
                if(mode === "debug") {
                    console.log(`Bot在群 ${group_id} 中被禁言，禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}..`)
                }
                flag = false
            }
        }
        return flag
    },

    separateTextAndEmoji(text) {
        const bracketRegex = /\(.*?\)\/?/g
        let match
        let textPart = ''
        let emojiParts = []

        const bracketContents = []

        while ((match = bracketRegex.exec(text)) !== null) {
            bracketContents.push(match[0])
        }

        textPart = text.replace(bracketRegex, '').trim()

        emojiParts = bracketContents

        return {
            textPart,
            emojiParts
        }
    },

    async dealMessage(e, originalRetMsg) {
        let atRegex = /(at:|@)([a-zA-Z0-9]+)|\[CQ:at,qq=(\d+)]/g
        let matches = []
        let match
        let lastIndex = 0
        while ((match = atRegex.exec(originalRetMsg)) !== null) {
            if (lastIndex !== match.index) {
                matches.push(originalRetMsg.slice(lastIndex, match.index))
            }
            let userId = match[2] || match[3]
            let nickname = e.group?.pickMember(parseInt(userId))?.nickname || '未知用户'
            if (nickname !== undefined) {
                matches.push(segment.at(userId, nickname))
            }
            lastIndex = atRegex.lastIndex
        }
        if (lastIndex < originalRetMsg.length) {
            matches.push(originalRetMsg.slice(lastIndex))
        }
        return matches
    },

    formatGroupChatHistory(groupChatHistory) {
        const imageRegex = /\[CQ:image(.*?)]/g
        return groupChatHistory.map((chat, index) => {
            const { sender, raw_message } = chat
            const nickname = sender.nickname || "未知用户"
            const userId = sender.user_id
            return `${index + 1}. 用户名: ${nickname}，userid: ${userId} 说：${raw_message.replace(imageRegex, "[图片]")}\n`
        })
    }

}

export default chatTools