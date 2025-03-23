import OpenAI from "openai";
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from "url";
import common from '../../lib/common/common.js'

/*
作者:Jerry(3479445703)
上次修改时间:2025/3/8
config/json存于data/deepseek目录下
rdNum为随机回复概率(让你的寄气人找找存在感)
userId每次都会回复
让寄气人把内心思考或颜文字放在英文括号中，效果更好
 */
let groupMessages = [];
let DeepseekConfig = {};
const imageRegex = /\[CQ:image(.*?)\]/g;

//不要修改此处
const defaultConfig = {
    base_url: 'https://api.siliconflow.cn/v1',
    api_key: '114514',
    model_type: 'deepseek-ai/DeepSeek-V3',
    model_list: {
        'deepseek-ai/DeepSeek-V3': 'V3',
        'deepseek-ai/DeepSeek-R1': 'R1',
        'deepseek-ai/DeepSeek-R1-Distill-Llama-8B': 'L8b',
        'Qwen/Qwen2.5-7B-Instruct': 'Q7b',
        'internlm/internlm2_5-7b-chat': 'I7b',
        'THUDM/glm-4-9b-chat': 'G9b',
        'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B': 'Q14b',
        'deepseek-ai/DeepSeek-R1-Distill-Llama-70B': 'L70b',
        'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B': 'Q32b'
    },
    default_history_length: 3,
    default_max_length: 3,
    default_prompt: '你只是一个平凡的普通机器人..',
    default_temperature: 1,
    nickName: '寄气人',
    checkChat: {
        rdNum: 2,
        masterReply: true,
        userId: [114514],
        blackGroups: [114, 514]
    },
    muteInfo: {},
    max_message_length: 100
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.resolve(__dirname, './../../data/deepseek');
const configPath = path.resolve(configDir, 'config.json');

function ensureConfigFile() {
    try {
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            logger.mark('Deepseek 配置文件夹创建成功..');
        }

        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
            logger.mark('Deepseek 配置文件创建成功，写入默认配置..');
            logger.mark('Deepseek 初始化成功..');
        } else {
            const configFile = fs.readFileSync(configPath, 'utf8');
            const loadedConfig = JSON.parse(configFile);
            DeepseekConfig = { ...defaultConfig, ...loadedConfig };
            if (JSON.stringify(DeepseekConfig) !== JSON.stringify(loadedConfig)) {
                fs.writeFileSync(configPath, JSON.stringify(DeepseekConfig, null, 2), 'utf8');
                logger.mark('Deepseek 配置文件已更新，补充配置项..');
                logger.mark('Deepseek 初始化成功..');
            } else {
                logger.mark('Deepseek 初始化成功..');
            }
        }
    } catch (error) {
        logger.error('Deepseek 初始化失败:', error);
    }
}
ensureConfigFile();
const openai = new OpenAI({
        baseURL: DeepseekConfig.base_url,
        apiKey: DeepseekConfig.api_key
});

let nickName = DeepseekConfig.nickName;

export class DeepSeek extends plugin {
    constructor() {
        super({
            name: 'deepseek',
            dsc: 'deepseek',
            event: 'message',
            priority: 114514,
            rule: [
                {
                    reg: '^#deepseek结束对话$',
                    fnc: 'reset'
                },
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
                    reg: '^#deepseek重载配置$',
                    fnc: 'reload',
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
                },
                {
                    reg: `^(${nickName})(.*)$`,
                    fnc: 'chat'
                },
                {
                    reg: '^#ds(.*)$',
                    fnc: 'chat'
                },
                {
                    reg: '^(.*)$',
                    fnc: 'rest'
                }

            ]
        });

        Bot.on?.("notice.group",async(e) => {
            if(e.sub_type === "ban" && e.user_id === e.bot.uin){
                const group_id = e.group_id;
                if(e.duration === 0){
                    delete DeepseekConfig.muteInfo[group_id];
                    await this.writeJsonFile(configPath,DeepseekConfig);
                    console.log(`Bot在群 ${group_id} 中被解除禁言，已从小黑屋中移除，小调皮..`);
                    //logger.mark(`Bot在群 ${group_id} 中被解除禁言，已从小黑屋中移除，小调皮..`);
                }else{
                    const muteEndTime = Math.floor(Date.now() / 1000) + e.duration;
                    DeepseekConfig.muteInfo[group_id] = muteEndTime;
                    await this.writeJsonFile(configPath, DeepseekConfig);
                    console.log(`Bot在群 ${group_id} 中被禁言!禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}.小坏蛋..`);
                    //logger.mark(`Bot在群 ${group_id} 中被禁言!禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}.小坏蛋..`);
                    setTimeout(() => {
                        delete DeepseekConfig.muteInfo[group_id];
                        this.writeJsonFile(configPath, DeepseekConfig);
                        console.log(`Bot在群 ${group_id} 的禁言已自动解除..`);
                        //logger.mark(`Bot在群 ${group_id} 的禁言已自动解除..`);
                    },e.duration*1000);
                }
            }

        });
    }

    async reload(e){
        try {
            const configFile = fs.readFileSync(configPath, 'utf8');
            DeepseekConfig = JSON.parse(configFile);
            nickName = DeepseekConfig.nickName;
            logger.mark('Deepseek 成功加载配置');
            e.reply("Deepseek配置重载成功..",true);
            return true;
        } catch (error) {
            logger.error('Deepseek 加载配置失败:', error);
            e.reply("Deepseek配置重载失败..");
            return true;
        }
    }



    /**
     * JSON文件处理
     * @param {string} filePath - JSON 文件的路径
     * @param {object} newData - 要写入的内容（键值对）
     * @param {boolean} [merge=true] - 是否合并到现有内容中（默认为 true）
     */

    async writeJsonFile(filePath, newData, merge = true) {
        try {
            let existingData = {};

            if (merge && fs.existsSync(filePath)) {
                const fileContent = await fs.promises.readFile(filePath, 'utf-8');
                existingData = JSON.parse(fileContent);
            }

            const updatedData = { ...existingData, ...newData };
            if (JSON.stringify(existingData) === JSON.stringify(updatedData)) {
                console.log(`配置文件未变化，跳过写入：${filePath}..`);
                //logger.mark(`配置文件未变化，跳过写入：${filePath}..`);
                return;
            }
            await fs.promises.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
            console.log(`配置文件更新成功：${filePath}..`);
            //logger.mark(`配置文件更新成功：${filePath}..`);
        } catch (error) {
            logger.error(`配置文件更新失败：${error.message}..`);
        }
    }

    async listModels(e) {
        const modelList = DeepseekConfig.model_list;
        let message = '诺，这儿是可用模型哦：\n';
        let index = 1;
        for (const [model, code] of Object.entries(modelList)) {
            message += `${index}. ${model} (神秘代号: ${code})\n`;
            index++;
        }
        e.reply(message);
    }

    async switchModel(e) {
        const modelIndex = parseInt(e.msg.replace('#deepseek切换模型', '').trim());
        const modelList = Object.keys(DeepseekConfig.model_list);
        if (modelIndex < 1 || modelIndex > modelList.length) {
            e.reply('模型编号无效呢..请使用 #deepseek模型列表 看看能用的模型吧..');
            return;
        }
        const selectedModel = modelList[modelIndex - 1];
        DeepseekConfig.model_type = selectedModel;
        await this.writeJsonFile(configPath, { model_type: selectedModel });
        e.reply(`模型切换成 ${selectedModel} 啦！(神秘代号: ${DeepseekConfig.model_list[selectedModel]})`);
    }

    async checkChat(msg, e) {
        const randomNumber = Math.floor(Math.random() * 100);
        let flag = true;
        if (randomNumber >= DeepseekConfig.checkChat.rdNum) flag = false;
        if (DeepseekConfig.checkChat.masterReply){
            if(e.isMaster) flag = true;
        }
        if (DeepseekConfig.checkChat.userId.includes(e.user_id)) flag = true;
        if (DeepseekConfig.checkChat.blackGroups.includes(e.group_id)) flag = false;
        const group_id = e.group_id;
        const muteEndTime = DeepseekConfig.muteInfo[group_id];
        if (muteEndTime) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (currentTimestamp < muteEndTime) {
                console.log(`Bot在群 ${group_id} 中被禁言，禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}..`);
                //logger.mark(`Bot在群 ${group_id} 中被禁言，禁言结束时间：${new Date(muteEndTime * 1000).toLocaleString()}..`);
                flag = false;
            } else {
                delete DeepseekConfig.muteInfo[group_id];
                await this.writeJsonFile(configPath, DeepseekConfig);
                console.log(`Bot在群 ${group_id} 的禁言终于过期辣，已从配置中移除..`);
                //logger.mark(`Bot在群 ${group_id} 的禁言终于过期辣，已从配置中移除..`);
            }
        }
        return flag;
    }

    async rest(e) {
        if (!e.msg) return;
        const msg = e.msg.trim();
        try {
            if (await this.checkChat(msg, e)) {
                await this.chat(e);
            }
        } catch (error) {
            logger.error('处理消息时出错了捏:', error);
        }
    }

    async chat(e) {
        if (!e.msg) return;
        const msg = e.msg.trim();
        const isNicknameTrigger = e.msg.startsWith(nickName);
        let historyLength = DeepseekConfig.default_history_length;
        let maxLength = DeepseekConfig.default_max_length;
        let customPrompt = DeepseekConfig.default_prompt;
        let temperature = DeepseekConfig.default_temperature;
        historyLength = historyLength >= 0 && historyLength <= 20 ? historyLength : 3;
        maxLength = maxLength >= 0 && maxLength <= 10 ? maxLength : 3;
        temperature = temperature >= 0 && temperature <= 2 ? temperature : 1;
        let prompt = [{role: "system", content: customPrompt}];
        let groupChatHistroy = '';
        if (!Array.isArray(groupMessages[e.group_id])) {
            groupMessages[e.group_id] = [];
        }
        if (groupMessages[e.group_id].length > 2 * maxLength) {
            groupMessages[e.group_id] = groupMessages[e.group_id].slice(groupMessages[e.group_id].length - 2 * maxLength);
        }
        if (historyLength > 0) {
            groupChatHistroy = await e.bot.pickGroup(e.group_id, true).getChatHistory(0, maxLength);
            prompt[0].content += '以下是群里的近期聊天记录：' + this.formatGroupChatHistory(groupChatHistroy).join('\n');
        }
        await this.sendChat(
            e,
            [
                ...prompt,
                ...groupMessages[e.group_id]
            ],
            temperature,
            { role: "user", content: `用户名:${e.sender.nickname}，userid:${e.user_id}说：${msg}` },
            isNicknameTrigger
        )
    }
    async reset(e) {
            groupMessages[e.group_id] = [];
            e.reply('重置对话完毕');
        }
    async sendChat(e, prompt, temperature, msg, isNicknameTrigger = false) {
        let completion;
        try {
            completion = await openai.chat.completions.create({
                messages: [
                    ...prompt,
                    msg
                ],
                model: DeepseekConfig.model_type,
                temperature: parseFloat(temperature),
                frequency_penalty: 0.2,
                presence_penalty: 0.2,
            });
        } catch (error) {
            logger.error(error);
            e.reply('服务器去火星开小差了..');
            return false;
        }

        let originalRetMsg = completion.choices[0].message.content;

        originalRetMsg = originalRetMsg.replace(/<think>[\s\S]*?<\/think>/g, '');

        const MAX_MESSAGE_LENGTH = DeepseekConfig.max_message_length || 100;

        if (originalRetMsg.length>MAX_MESSAGE_LENGTH) {
            logger.mark('啊拉,消息太长了..');
            let sender = { nickname: e.sender.nickname, user_id: e.user_id };
            let msg = [{ message: originalRetMsg, ...sender }];
            let ngm, Text = `啊拉,消息太长了..`, Text2 = `${DeepseekConfig.nickName}回答.`;
            let summary = new Date().toTimeString().slice(0, 8);
            ngm = await this.e.group.makeForwardMsg.bind(this.e.group)(msg);
            //if (typeof ngm.data === 'object') Object.assign(ngm.data.meta.detail, { news: [{ text: Text }], source: Text2, summary }); ngm.data.prompt = Text
            await e.reply(ngm);
        } else {
            if (isNicknameTrigger) {
                e.reply(originalRetMsg);
            } else {
                const { textPart, emojiParts } = this.separateTextAndEmoji(originalRetMsg);

                if (textPart) {
                    let matches = await this.dealMessage(e, textPart);
                    e.reply(matches);
                }

                if (emojiParts.length > 0) {
                    for (let emoji of emojiParts) {
                        e.reply(emoji);
                    }
                }
            }
        }

        groupMessages[e.group_id].push(msg);
        groupMessages[e.group_id].push({
            role: 'assistant',
            content: originalRetMsg
        });
    }

        separateTextAndEmoji(text) {
        const bracketRegex = /\(.*?\)\/?/g;
        let match;
        let textPart = '';
        let emojiParts = [];

        const bracketContents = [];

        while ((match = bracketRegex.exec(text)) !== null) {
            bracketContents.push(match[0]);
        }

        textPart = text.replace(bracketRegex, '').trim();

        emojiParts = bracketContents;

        return {
            textPart,
            emojiParts
        };
    }


    async setMaxLength(e) {
        let length = e.msg.replace('#deepseek设置上下文长度', '').trim();
        await this.writeJsonFile(configPath,{default_max_length: length});
        e.reply('设置成功');
    }
    async setHistoryLength(e) {
        let length = e.msg.replace('#deepseek设置群聊记录长度', '').trim();
        await this.writeJsonFile(configPath,{default_history_length: length});
        e.reply('设置成功');
    }
    async setPrompt(e) {
        let prompt = e.msg.replace('#deepseek设置提示词', '').trim();
        await this.writeJsonFile(configPath,{default_prompt: prompt});
        e.reply('设置成功');
    }
    async setTemperature(e) {
        let temperature = e.msg.replace('#deepseek设置温度', '').trim();
        await this.writeJsonFile(configPath,{default_temperature: temperature});
        e.reply('设置成功');
    }
    async dealMessage(e, originalRetMsg) {
        let atRegex = /(at:|@)([a-zA-Z0-9]+)|\[CQ:at,qq=(\d+)\]/g;
        let matches = [];
        let match;
        let lastIndex = 0;
        while ((match = atRegex.exec(originalRetMsg)) !== null) {
            if (lastIndex !== match.index) {
                matches.push(originalRetMsg.slice(lastIndex, match.index));
            }
            let userId = match[2] || match[3]
            let nickname = e.group?.pickMember(parseInt(userId))?.nickname || '未知用户';
            if (nickname != undefined) {
                matches.push(segment.at(userId, nickname));
            }
            lastIndex = atRegex.lastIndex;
        }
        if (lastIndex < originalRetMsg.length) {
            matches.push(originalRetMsg.slice(lastIndex));
        }
        return matches;
    }

    formatGroupChatHistory(groupChatHistory) {
        return groupChatHistory.map((chat, index) => {
            const { sender, raw_message } = chat;
            const nickname = sender.nickname || "未知用户";
            const userId = sender.user_id;
            return `${index + 1}. 用户名: ${nickname}，userid: ${userId} 说：${raw_message.replace(imageRegex, "[图片]")}\n`;
        });
    }
}
