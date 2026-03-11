const { withInfoPlist } = require('expo/config-plugins');

/**
 * Expo config plugin for Diva Ambient Mode
 * Adds required background modes and permissions to Info.plist
 */
module.exports = function withDivaAmbient(config) {
  config = withInfoPlist(config, (config) => {
    // Background modes
    const bgModes = config.modResults.UIBackgroundModes || [];
    if (!bgModes.includes('audio')) bgModes.push('audio');
    if (!bgModes.includes('fetch')) bgModes.push('fetch');
    if (!bgModes.includes('processing')) bgModes.push('processing');
    config.modResults.UIBackgroundModes = bgModes;

    // Microphone permission
    if (!config.modResults.NSMicrophoneUsageDescription) {
      config.modResults.NSMicrophoneUsageDescription =
        "Diva écoute le mot-clé 'Diva' pour s'activer quand tu en as besoin.";
    }

    // Speech recognition permission
    if (!config.modResults.NSSpeechRecognitionUsageDescription) {
      config.modResults.NSSpeechRecognitionUsageDescription =
        "Diva utilise la reconnaissance vocale pour détecter quand tu dis 'Diva'.";
    }

    return config;
  });

  return config;
};
