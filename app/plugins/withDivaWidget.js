/**
 * Expo Config Plugin — Diva iOS Widget Extension
 *
 * Copies the DivaWidget Swift file into an iOS Widget Extension target,
 * configures App Groups, and wires it into the Xcode project.
 */
const { withXcodeProject, withEntitlementsPlist } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_TARGET_NAME = 'DivaWidget';
const APP_GROUP = 'group.fr.papote.diva';
const BUNDLE_ID = 'fr.papote.diva.widget';

const WIDGET_FILES = ['DivaWidget.swift'];

function copyFileSync(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

const withAppGroupEntitlement = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return mod;
  });
};

const withWidgetExtension = (config) => {
  return withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const projectRoot = mod.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, 'ios');
    const nativeSrc = path.join(projectRoot, 'native', 'DivaWidget');
    const widgetPath = path.join(iosPath, WIDGET_TARGET_NAME);

    // 1. Copy widget Swift files
    console.log(`[DivaWidget] Copying widget files...`);
    WIDGET_FILES.forEach((file) => {
      const src = path.join(nativeSrc, file);
      const dest = path.join(widgetPath, file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`  ✓ ${file}`);
      } else {
        console.warn(`  ✗ Missing: ${file}`);
      }
    });

    // 2. Write Info.plist
    const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>Diva Widget</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>`;
    fs.mkdirSync(widgetPath, { recursive: true });
    fs.writeFileSync(path.join(widgetPath, 'Info.plist'), infoPlist);

    // 3. Write entitlements
    const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP}</string>
  </array>
</dict>
</plist>`;
    fs.writeFileSync(path.join(widgetPath, `${WIDGET_TARGET_NAME}.entitlements`), entitlements);

    // 4. Skip if target already exists
    if (xcodeProject.pbxTargetByName(WIDGET_TARGET_NAME)) {
      console.log(`[DivaWidget] Target already exists, skipping`);
      return mod;
    }

    // 5. Add widget extension target
    console.log(`[DivaWidget] Adding widget extension target...`);
    const widgetTarget = xcodeProject.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      BUNDLE_ID
    );

    if (!widgetTarget) {
      console.error(`[DivaWidget] Failed to create widget target`);
      return mod;
    }

    // 6. Configure build settings
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const config = configurations[key];
      if (typeof config === 'object' && config.buildSettings) {
        const s = config.buildSettings;
        if (s.PRODUCT_NAME === `"${WIDGET_TARGET_NAME}"` || s.PRODUCT_NAME === WIDGET_TARGET_NAME) {
          s.SWIFT_VERSION = '5.0';
          s.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
          s.CODE_SIGN_ENTITLEMENTS = `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`;
          s.INFOPLIST_FILE = `${WIDGET_TARGET_NAME}/Info.plist`;
          s.TARGETED_DEVICE_FAMILY = '"1,2"';
          s.MARKETING_VERSION = '0.1.0';
          s.CURRENT_PROJECT_VERSION = '1';
          s.PRODUCT_BUNDLE_IDENTIFIER = BUNDLE_ID;
          s.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
          s.SWIFT_EMIT_LOC_STRINGS = 'YES';
        }
      }
    }

    // 7. Add source files
    try {
      const widgetGroupKey = xcodeProject.pbxCreateGroup(WIDGET_TARGET_NAME, WIDGET_TARGET_NAME);
      WIDGET_FILES.forEach((file) => {
        try {
          xcodeProject.addSourceFile(
            `${WIDGET_TARGET_NAME}/${file}`,
            { target: widgetTarget.uuid },
            widgetGroupKey
          );
        } catch (e) {
          console.warn(`[DivaWidget] Could not add ${file}: ${e.message}`);
        }
      });
    } catch (e) {
      console.warn(`[DivaWidget] Could not create group: ${e.message}`);
    }

    // 8. Embed extension in main app
    try {
      const mainTarget = xcodeProject.getFirstTarget();
      if (mainTarget && mainTarget.uuid) {
        xcodeProject.addBuildPhase(
          [],
          'PBXCopyFilesBuildPhase',
          'Embed App Extensions',
          mainTarget.uuid,
          'app_extension'
        );
      }
    } catch (e) {
      console.warn(`[DivaWidget] Could not add embed phase: ${e.message}`);
    }

    console.log(`[DivaWidget] ✅ Widget extension configured`);
    return mod;
  });
};

module.exports = function withDivaWidget(config) {
  config = withAppGroupEntitlement(config);
  config = withWidgetExtension(config);
  return config;
};
