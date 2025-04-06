import OpenAI from 'openai';
import { chatTools, configControl } from '#lib';

let groupMessages = [];
let DeepseekConfig = configControl.getConfig();

const openai = new OpenAI({
  baseURL: DeepseekConfig.base_url,
  apiKey: DeepseekConfig.api_key,
});
let nickName = DeepseekConfig.nickName;

export class DeepSeek extends plugin {
  constructor() {
    super({
      name: 'deepseekChat',
      dsc: 'deepseekChat',
      event: 'message',
      priority: 114514,
      rule: [
        {
          reg: '^#deepseek结束对话$',
          fnc: 'reset',
        },
        {
          reg: `^(${nickName})(.*)$`,
          fnc: 'chat',
        },
        {
          reg: '^#ds(.*)$',
          fnc: 'chat',
        },
        {
          reg: '^(.*)$',
          fnc: 'rest',
        },
      ],
    });
  }

  async rest(e) {
    if (!e.msg) return;
    const msg = e.msg.trim();
    try {
      if (await chatTools.checkChat(msg, e)) {
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
    let customPrompt = `现在的时间是${new Date().toLocaleString('zh-CN', { hour12: false })},${DeepseekConfig.default_prompt}`;
    let temperature = DeepseekConfig.default_temperature;
    historyLength = historyLength >= 0 && historyLength <= 20 ? historyLength : 3;
    maxLength = maxLength >= 0 && maxLength <= 10 ? maxLength : 3;
    temperature = temperature >= 0 && temperature <= 2 ? temperature : 1;
    let prompt = [{ role: 'system', content: customPrompt }];
    let groupChatHistroy = '';
    if (!Array.isArray(groupMessages[e.group_id])) {
      groupMessages[e.group_id] = [];
    }
    if (groupMessages[e.group_id].length > 2 * maxLength) {
      groupMessages[e.group_id] = groupMessages[e.group_id].slice(
        groupMessages[e.group_id].length - 2 * maxLength
      );
    }
    if (historyLength > 0) {
      groupChatHistroy = await e.bot.pickGroup(e.group_id, true).getChatHistory(0, maxLength);
      prompt[0].content +=
        '以下是群里的近期聊天记录：' +
        chatTools.formatGroupChatHistory(groupChatHistroy).join('\n');
    }
    await this.sendChat(
      e,
      [...prompt, ...groupMessages[e.group_id]],
      temperature,
      { role: 'user', content: `用户名:${e.sender.nickname},userid:${e.user_id}说：${msg}` },
      isNicknameTrigger
    );
  }

  async reset(e) {
    groupMessages[e.group_id] = [];
    e.reply('重置对话完毕');
  }

  async sendChat(e, prompt, temperature, msg, isNicknameTrigger = false) {
    let completion;
    try {
      completion = await openai.chat.completions.create({
        messages: [...prompt, msg],
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

    if (originalRetMsg.length > MAX_MESSAGE_LENGTH) {
      let mode = DeepseekConfig.mode;
      if (mode === 'debug') {
        logger.mark('啊拉,消息太长了..');
      }
      let sender = { nickname: e.sender.nickname, user_id: e.user_id };
      let msg = [{ message: originalRetMsg, ...sender }];
      let ngm,
        Text = `啊拉,消息太长了..`,
        Text2 = `${DeepseekConfig.nickName}回答.`;
      let summary = new Date().toTimeString().slice(0, 8);
      ngm = await this.e.group.makeForwardMsg.bind(this.e.group)(msg);
      //if (typeof ngm.data === 'object') Object.assign(ngm.data.meta.detail, { news: [{ text: Text }], source: Text2, summary }); ngm.data.prompt = Text;
      await e.reply(ngm);
    } else {
      if (isNicknameTrigger) {
        e.reply(originalRetMsg);
      } else {
        const { textPart, emojiParts } = chatTools.separateTextAndEmoji(originalRetMsg);

        if (textPart) {
          let matches = await chatTools.dealMessage(e, textPart);
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
      content: originalRetMsg,
    });
  }
}
