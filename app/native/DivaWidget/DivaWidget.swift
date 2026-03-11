/**
 * DivaWidget - iOS Home Screen Widget
 *
 * iOS 17+: Interactive widget with "Parler" button (AppIntent)
 * iOS 16: Tap widget → opens Diva in listen mode via URL
 *
 * Design: dark bg, brand gradient orb (cyan → indigo → violet)
 */

import WidgetKit
import SwiftUI

// MARK: - Widget Entry

struct DivaEntry: TimelineEntry {
    let date: Date
    let lastUserMessage: String?
    let lastAIResponse: String?
}

// MARK: - Provider

struct DivaProvider: TimelineProvider {
    private let appGroup = "group.fr.papote.diva"

    func placeholder(in context: Context) -> DivaEntry {
        DivaEntry(date: Date(), lastUserMessage: nil, lastAIResponse: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (DivaEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DivaEntry>) -> Void) {
        let entry = makeEntry()
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func makeEntry() -> DivaEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        return DivaEntry(
            date: Date(),
            lastUserMessage: defaults?.string(forKey: "lastUserMessage"),
            lastAIResponse: defaults?.string(forKey: "lastAIResponse")
        )
    }
}

// MARK: - Design Tokens

private let brandCyan   = Color(red: 0.49, green: 0.83, blue: 0.91)
private let brandIndigo = Color(red: 0.35, green: 0.34, blue: 0.84)
private let brandViolet = Color(red: 0.29, green: 0.29, blue: 0.57)
private let bgDark      = Color(red: 0.05, green: 0.05, blue: 0.08)

private var orbGradient: AngularGradient {
    AngularGradient(
        gradient: Gradient(colors: [brandCyan, brandIndigo, brandViolet, brandIndigo, brandCyan]),
        center: .center
    )
}

// MARK: - Orb View Component

struct OrbView: View {
    let size: CGFloat
    var body: some View {
        ZStack {
            Circle()
                .fill(orbGradient)
                .frame(width: size, height: size)
                .shadow(color: brandIndigo.opacity(0.7), radius: size * 0.2, x: 0, y: 4)
            Circle()
                .fill(bgDark.opacity(0.35))
                .frame(width: size * 0.70, height: size * 0.70)
            Image(systemName: "waveform")
                .font(.system(size: size * 0.28, weight: .semibold))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    var entry: DivaEntry

    var body: some View {
        ZStack {
            bgDark

            VStack(spacing: 10) {
                OrbView(size: 58)

                Text("Diva")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                if #available(iOS 17.0, *) {
                    Button(intent: StartListeningIntent()) {
                        HStack(spacing: 4) {
                            Image(systemName: "mic.fill")
                                .font(.system(size: 10))
                            Text("Parler")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundColor(bgDark)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(brandCyan)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                } else {
                    Link(destination: URL(string: "diva:///?widget=true")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "mic.fill")
                                .font(.system(size: 10))
                            Text("Parler")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundColor(bgDark)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(brandCyan)
                        .clipShape(Capsule())
                    }
                }
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
            bgDark

            HStack(spacing: 0) {
                // Left panel — orb + button
                VStack(spacing: 10) {
                    OrbView(size: 54)

                    Text("Diva")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    if #available(iOS 17.0, *) {
                        Button(intent: StartListeningIntent()) {
                            HStack(spacing: 3) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 9))
                                Text("Parler")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundColor(bgDark)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(brandCyan)
                            .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    } else {
                        Link(destination: URL(string: "diva:///?widget=true")!) {
                            HStack(spacing: 3) {
                                Image(systemName: "mic.fill")
                                    .font(.system(size: 9))
                                Text("Parler")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundColor(bgDark)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(brandCyan)
                            .clipShape(Capsule())
                        }
                    }
                }
                .frame(width: 90)
                .padding(.leading, 14)

                // Divider
                Rectangle()
                    .fill(Color.white.opacity(0.07))
                    .frame(width: 1)
                    .padding(.vertical, 10)
                    .padding(.horizontal, 10)

                // Right panel — conversation
                VStack(alignment: .leading, spacing: 8) {
                    if let userMsg = entry.lastUserMessage, let aiResp = entry.lastAIResponse {
                        // User bubble
                        HStack {
                            Spacer()
                            Text(userMsg)
                                .font(.system(size: 11))
                                .foregroundColor(.white.opacity(0.9))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(Color.white.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .lineLimit(2)
                        }

                        // AI bubble
                        HStack {
                            Text(aiResp)
                                .font(.system(size: 11))
                                .foregroundColor(brandCyan)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(brandIndigo.opacity(0.25))
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .lineLimit(2)
                            Spacer()
                        }
                    } else {
                        Text("Bonjour 👋")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)

                        Text("Appuie sur Parler pour\ndémarrer une conversation")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.45))
                            .lineLimit(2)
                    }

                    Spacer()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.trailing, 14)
                .padding(.vertical, 12)
            }
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
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

struct DivaWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            DivaWidgetEntryView(entry: DivaEntry(date: Date(), lastUserMessage: nil, lastAIResponse: nil))
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            DivaWidgetEntryView(entry: DivaEntry(
                date: Date(),
                lastUserMessage: "C'est quoi la météo demain ?",
                lastAIResponse: "Demain il fera 18°C et ensoleillé à Paris 🌤️"
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
