/**
 * DivaWidgetBridge.m
 *
 * Objective-C registration for DivaWidgetBridge React Native module.
 */

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DivaWidgetBridge, NSObject)

RCT_EXTERN_METHOD(setWidgetData:(NSString *)json)
RCT_EXTERN_METHOD(reloadAllTimelines)
RCT_EXTERN_METHOD(checkAndClearWidgetTrigger:(RCTResponseSenderBlock)callback)

@end
