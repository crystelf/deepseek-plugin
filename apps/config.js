import { configControl, deepseekInit } from '#lib';

let config = configControl.getConfig();

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
          permission: 'master',
        },
        {
          reg: '^#deepseek设置群聊记录长度(.*)$',
          fnc: 'setHistoryLength',
          permission: 'master',
        },
        {
          reg: '^#deepseek设置提示词(.*)$',
          fnc: 'setPrompt',
          permission: 'master',
        },
        {
          reg: '^#deepseek设置温度(.*)$',
          fnc: 'setTemperature',
          permission: 'master',
        },
        {
          reg: '^#deepseek模型列表$',
          fnc: 'listModels',
          permission: 'master',
        },
        {
          reg: '^#deepseek切换模型(\\d+)$',
          fnc: 'switchModel',
          permission: 'master',
        },
        {
          reg: '^#deepseek初始化$',
          fnc: 'deepseekInit',
          permission: 'master',
        },
        {
          reg: '^#deepseek调试$',
          fnc: 'deepseekDebug',
          permission: 'master',
        },
      ],
    });
  }

  async listModels(e) {
    const modelList = config.model_list;
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
    const modelList = Object.keys(config.model_list);
    if (modelIndex < 1 || modelIndex > modelList.length) {
      e.reply('模型编号无效呢..请使用 #deepseek模型列表 看看能用的模型吧..');
      return;
    }
    const selectedModel = modelList[modelIndex - 1];
    configControl.updateConfig({
      model_type: selectedModel,
    });
    e.reply(`模型切换成 ${selectedModel} 啦！(神秘代号: ${config.model_list[selectedModel]})`);
  }

  async setMaxLength(e) {
    let length = e.msg.replace('#deepseek设置上下文长度', '').trim();
    configControl.updateConfig({
      default_max_length: length,
    });
    e.reply('设置成功~');
  }

  async setHistoryLength(e) {
    let length = e.msg.replace('#deepseek设置群聊记录长度', '').trim();
    configControl.updateConfig({
      default_history_length: length,
    });
    e.reply('设置成功~');
  }

  async setPrompt(e) {
    let prompt = e.msg.replace('#deepseek设置提示词', '').trim();
    configControl.updateConfig({
      default_prompt: prompt,
    });
    e.reply('设置成功~');
  }

  async setTemperature(e) {
    let temperature = e.msg.replace('#deepseek设置温度', '').trim();
    configControl.updateConfig({
      default_temperature: temperature,
    });
    e.reply('设置成功~');
  }

  async deepseekInit(e) {
    try {
      deepseekInit.CSH();
      e.reply('deepseek初始化成功..');
    } catch (err) {
      console.error(e);
      e.reply(`deepseek初始化发生了点错误：${err}`);
    }
  }

  async deepseekDebug(e) {
    let deepseekConfig = configControl.getConfig();
    let mode = deepseekConfig.mode;
    if (mode === 'debug') {
      try {
        configControl.updateConfig({
          mode: 'info',
        });
        e.reply(`成功关闭debug模式..`);
      } catch (err) {
        console.error(err);
        e.reply(`出错了..${err}`);
      }
    } else if (mode === 'info') {
      try {
        configControl.updateConfig({
          mode: 'debug',
        });
        e.reply('成功启用debug模式..');
      } catch (err) {
        console.error(err);
        e.reply(`出错了..${err}`);
      }
    }
  }
}
