
import { headerTranslations } from './header';
import { contactTranslations } from './contact';
import { countdownTranslations } from './countdown';
import { scheduleTranslations } from './schedule';
import { registrationTranslations } from './registration';
import { contentTranslations } from './content';
import { footerTranslations } from './footer';

export const enTranslations = {
  translation: {
    ...headerTranslations,
    ...contactTranslations,
    ...countdownTranslations,
    ...scheduleTranslations,
    ...registrationTranslations,
    ...contentTranslations,
    ...footerTranslations
  }
};
