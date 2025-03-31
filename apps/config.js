import fc from "./../components/tools.js"

let DeepseekConfig = {}
const configPath = "data/deepseek/config.json"
DeepseekConfig = fc.readJSON("data/deepseek/config.json","root")

export class DeepSeek extends plugin {
    constructor() {
        super({
            name: 'deepseekConfig',
            dsc: 'deepseekConfig',
            event: 'message',
            priority: 114,
            rule: [
                {
                    reg: '^#deepseek设置上下文长度(.*)$',
                    fnc: 'setMaxLength',
                    permission: 'master'
                },
                {
                    reg: '^#deepseek设置群聊记录长度(.*)$',
                    fnc: 'setHistoryLength',
                    permission: 'master'
                },
                {
                    reg: '^#deepseek设置提示词(.*)$',
                    fnc: 'setPrompt',
                    permission: 'master'
                },
                {
                    reg: '^#deepseek设置温度(.*)$',
                    fnc: 'setTemperature',
                    permission: 'master'
                },
                {
                    reg: '^#deepseek模型列表$',
                    fnc: 'listModels',
                    permission: 'master'
                },
                {
                    reg: '^#deepseek切换模型(\\d+)$',
                    fnc: 'switchModel',
                    permission: 'master'
                }

            ]
        });
    }


    async listModels(e) {
        const modelList = DeepseekConfig.model_list;
        let message = '诺，这儿是可用模型哦：\n'
        let index = 1
        for (const [model, code] of Object.entries(modelList)) {
            message += `${index}. ${model} (神秘代号: ${code})\n`
            index++
        }
        e.reply(message)
    }

    async switchModel(e) {
        const modelIndex = parseInt(e.msg.replace('#deepseek切换模型', '').trim())
        const modelList = Object.keys(DeepseekConfig.model_list)
        if (modelIndex < 1 || modelIndex > modelList.length) {
            e.reply('模型编号无效呢..请使用 #deepseek模型列表 看看能用的模型吧..')
            return
        }
        const selectedModel = modelList[modelIndex - 1]
        DeepseekConfig.model_type = selectedModel
        fc.SafewriteJSON(configPath, {model_type: selectedModel}, "root", 4)
        e.reply(`模型切换成 ${selectedModel} 啦！(神秘代号: ${DeepseekConfig.model_list[selectedModel]})`)
    }

    async setMaxLength(e) {
        let length = e.msg.replace('#deepseek设置上下文长度', '').trim()
        fc.SafewriteJSON(configPath,{default_max_length: length},"root",4)
        e.reply('设置成功')
    }

    async setHistoryLength(e) {
        let length = e.msg.replace('#deepseek设置群聊记录长度', '').trim()
        fc.SafewriteJSON(configPath,{default_history_length: length},"root",4)
        e.reply('设置成功')
    }

    async setPrompt(e) {
        let prompt = e.msg.replace('#deepseek设置提示词', '').trim()
        fc.SafewriteJSON(configPath,{default_prompt: prompt},"root",4)
        e.reply('设置成功')
    }

    async setTemperature(e) {
        let temperature = e.msg.replace('#deepseek设置温度', '').trim()
        fc.SafewriteJSON(configPath,{default_temperature: temperature},"root",4)
        e.reply('设置成功')
    }
}