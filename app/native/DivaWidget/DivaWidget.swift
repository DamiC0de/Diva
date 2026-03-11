/**
 * DivaWidget - iOS Home Screen Widget
 *
 * Tap the widget → opens Diva directly in listening mode
 * Design: dark background, brand gradient orb (cyan → indigo → violet)
 */

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct DivaEntry: TimelineEntry {
    let date: Date
    let lastMessage: String?
}

// MARK: - Provider

struct DivaProvider: TimelineProvider {
    private let appGroup = "group.fr.papote.diva"

    func placeholder(in context: Context) -> DivaEntry {
        DivaEntry(date: Date(), lastMessage: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (DivaEntry) -> Void) {
        completion(DivaEntry(date: Date(), lastMessage: readLastMessage()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DivaEntry>) -> Void) {
        let entry = DivaEntry(date: Date(), lastMessage: readLastMessage())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func readLastMessage() -> String? {
        UserDefaults(suiteName: appGroup)?.string(forKey: "lastInteraction")
    }
}

// MARK: - Design Tokens

private let brandCyan    = Color(red: 0.49, green: 0.83, blue: 0.91)  // #7DD3E8
private let brandIndigo  = Color(red: 0.35, green: 0.34, blue: 0.84)  // #5856D6
private let brandViolet  = Color(red: 0.29, green: 0.29, blue: 0.57)  // #4A4B91
private let bgDark       = Color(red: 0.05, green: 0.05, blue: 0.08)  // #0D0D14

private var orbGradient: AngularGradient {
    AngularGradient(
        gradient: Gradient(colors: [brandCyan, brandIndigo, brandViolet, brandIndigo, brandCyan]),
        center: .center
    )
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    var entry: DivaEntry

    var body: some View {
        ZStack {
            bgDark.ignoresSafeArea()

            VStack(spacing: 10) {
                // Orb
                ZStack {
                    Circle()
                        .fill(orbGradient)
                        .frame(width: 56, height: 56)
                        .shadow(color: brandIndigo.opacity(0.6), radius: 12, x: 0, y: 4)

                    Circle()
                        .fill(bgDark.opacity(0.45))
                        .frame(width: 40, height: 40)

                    Image(systemName: "waveform")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }

                // Name
                Text("Diva")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)

                // Hint
                Text("Appuie pour parler")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.5))
                    .multilineTextAlignment(.center)
            }
            .padding(12)
        }
        .widgetURL(URL(string: "diva:///?widget=true"))
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    var entry: DivaEntry

    var body: some View {
        ZStack {
            bgDark.ignoresSafeArea()

            HStack(spacing: 16) {
                // Left — orb
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(orbGradient)
                            .frame(width: 60, height: 60)
                            .shadow(color: brandIndigo.opacity(0.7), radius: 14, x: 0, y: 4)

                        Circle()
                            .fill(bgDark.opacity(0.4))
                            .frame(width: 42, height: 42)

                        Image(systemName: "waveform")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text("Diva")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                .frame(width: 80)

                // Divider
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 1)
                    .padding(.vertical, 8)

                // Right — last message or CTA
                VStack(alignment: .leading, spacing: 6) {
                    if let msg = entry.lastMessage, !msg.isEmpty {
                        Text("Dernier échange")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color.white.opacity(0.4))
                            .textCase(.uppercase)
                            .tracking(0.5)

                        Text(msg)
                            .font(.system(size: 13, weight: .regular))
                            .foregroundColor(Color.white.opacity(0.85))
                            .lineLimit(3)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text("Bonjour 👋")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)

                        Text("Appuie pour démarrer\nune conversation")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(Color.white.opacity(0.5))
                            .lineLimit(2)
                    }

                    Spacer()

                    HStack(spacing: 4) {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 9))
                            .foregroundColor(brandCyan)
                        Text("Tap pour parler")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(brandCyan)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .widgetURL(URL(string: "diva:///?widget=true"))
    }
}

// MARK: - Entry View

struct DivaWidgetEntryView: View {
    var entry: DivaProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget

@main
struct DivaWidget: Widget {
    let kind: String = "DivaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DivaProvider()) { entry in
            DivaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Diva")
        .description("Lance une conversation en un tap")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

struct DivaWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            DivaWidgetEntryView(entry: DivaEntry(date: Date(), lastMessage: nil))
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            DivaWidgetEntryView(entry: DivaEntry(date: Date(), lastMessage: "Rappelle-moi d'appeler maman demain matin"))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
