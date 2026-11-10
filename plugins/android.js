// A locked-boot alarm starts the Application before credential-protected storage is
// accessible. Defer Expo/RN initialization while standalone alarm components run.
const { withMainApplication } = require('expo/config-plugins');

module.exports = function withWupikoDirectBoot(config) {
  return withMainApplication(config, (config) => {
    const source = config.modResults.contents;
    const guard = 'expo.modules.wupikoalarm.DirectBoot.afterUnlock';
    if (source.includes(guard)) return config;
    const onCreate = /^(    DefaultNewArchitectureEntryPoint\.releaseLevel = [\s\S]*?    ApplicationLifecycleDispatcher\.onApplicationCreate\(this\))$/m;
    if (config.modResults.language !== 'kt' || !onCreate.test(source)) {
      throw new Error('Update the Wupiko direct-boot plugin for this Expo MainApplication template.');
    }
    config.modResults.contents = source.replace(onCreate, (body) =>
      '    ' + guard + '(this) {\n' + body.replace(/^/gm, '  ') + '\n    }'
    ).replace(
      '    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)',
      '    if (getSystemService(android.os.UserManager::class.java).isUserUnlocked) {\n' +
      '      ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)\n    }'
    );
    return config;
  });
};
