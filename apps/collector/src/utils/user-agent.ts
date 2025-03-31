import { UAParser } from 'ua-parser-js';
import bots from '../lists/bots';

interface UserAgentInfo {
  browser: string;
  os: string;
  device: string;
  bot: {
    isBot: boolean;
    name?: string;
  };
}

export function isBot(ua: string) {
    const res = bots.find((bot) => {
      if (new RegExp(bot.regex).test(ua)) {
        return true;
      }
      return false;
    });
  
    if (!res) {
      return null;
    }
  
    return {
      name: res.name,
      type: 'category' in res ? res.category : 'Unknown',
    };
  }

export function parseUserAgent(userAgent: string): UserAgentInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || 'unknown',
    os: result.os.name || 'unknown',
    device: result.device.type || 'desktop',
    bot: {
      isBot: isBot(userAgent) !== null,
      name: result.browser.name
    }
  };
} 