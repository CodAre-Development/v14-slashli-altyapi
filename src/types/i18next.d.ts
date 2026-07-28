import 'i18next';
import type commands from '@/locales/en/commands.json';
import type common from '@/locales/en/common.json';
import type errors from '@/locales/en/errors.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'commands';
    strictKeyChecks: true;
    resources: {
      commands: typeof commands;
      common: typeof common;
      errors: typeof errors;
    };
  }
}
