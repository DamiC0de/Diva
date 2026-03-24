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
private let bgLight     = Color(red: 0.96, green: 0.96, blue: 0.98) // #F5F5FA

/// Adaptive colors that switch based on system appearance
struct WidgetColors {
    let background: Color
    let textPrimary: Color
    let textSecondary: Color
    let buttonForeground: Color
    let divider: Color
    let userBubbleBg: Color
    let aiBubbleBg: Color
    let aiText: Color
    let glowCyan: Color
    let glowIndigo: Color

    static let dark = WidgetColors(
        background: bgDark,
        textPrimary: .white,
        textSecondary: .white.opacity(0.45),
        buttonForeground: bgDark,
        divider: Color.white.opacity(0.07),
        userBubbleBg: Color.white.opacity(0.12),
        aiBubbleBg: brandIndigo.opacity(0.25),
        aiText: brandCyan,
        glowCyan: brandCyan.opacity(0.35),
        glowIndigo: brandIndigo.opacity(0.15)
    )

    static let light = WidgetColors(
        background: bgLight,
        textPrimary: Color(red: 0.1, green: 0.1, blue: 0.15),
        textSecondary: Color(red: 0.4, green: 0.4, blue: 0.5),
        buttonForeground: .white,
        divider: Color.black.opacity(0.08),
        userBubbleBg: Color.black.opacity(0.06),
        aiBubbleBg: brandIndigo.opacity(0.1),
        aiText: brandIndigo,
        glowCyan: brandCyan.opacity(0.2),
        glowIndigo: brandIndigo.opacity(0.08)
    )
}

// MARK: - Mascot View Component

struct MascotView: View {
    let size: CGFloat
    let colors: WidgetColors
    var body: some View {
        ZStack {
            // Glow ring behind mascot
            Circle()
                .fill(
                    RadialGradient(
                        colors: [colors.glowCyan, colors.glowIndigo, .clear],
                        center: .center,
                        startRadius: size * 0.1,
                        endRadius: size * 0.55
                    )
                )
                .frame(width: size * 1.1, height: size * 1.1)

            // Mascot image (embedded base64 — no xcassets needed in widget target)
            makeDivaMascotImage()
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size, height: size)
                .shadow(color: brandCyan.opacity(0.6), radius: size * 0.15, x: 0, y: 4)
        }
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    var entry: DivaEntry
    let colors: WidgetColors

    var body: some View {
        ZStack {
            colors.background

            VStack(spacing: 6) {
                MascotView(size: 58, colors: colors)

                Text("Diva")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(colors.textPrimary)

                // Use Link (URL scheme) for reliable widget→app communication.
                // AppIntent + openAppWhenRun doesn't pass URL params; Link does.
                Link(destination: URL(string: "diva:///?widget=true")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 10))
                        Text("Parler")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundColor(colors.buttonForeground)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(brandCyan)
                    .clipShape(Capsule())
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
    let colors: WidgetColors

    var body: some View {
        ZStack {
            colors.background

            HStack(spacing: 0) {
                // Left panel — orb + button
                VStack(spacing: 6) {
                    MascotView(size: 54, colors: colors)

                    Text("Diva")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(colors.textPrimary)

                    Link(destination: URL(string: "diva:///?widget=true")!) {
                        HStack(spacing: 3) {
                            Image(systemName: "mic.fill")
                                .font(.system(size: 9))
                            Text("Parler")
                                .font(.system(size: 10, weight: .semibold))
                        }
                        .foregroundColor(colors.buttonForeground)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(brandCyan)
                        .clipShape(Capsule())
                    }
                }
                .frame(width: 90)
                .padding(.leading, 14)

                // Divider
                Rectangle()
                    .fill(colors.divider)
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
                                .foregroundColor(colors.textPrimary.opacity(0.9))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(colors.userBubbleBg)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .lineLimit(2)
                        }

                        // AI bubble
                        HStack {
                            Text(aiResp)
                                .font(.system(size: 11))
                                .foregroundColor(colors.aiText)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(colors.aiBubbleBg)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .lineLimit(2)
                            Spacer()
                        }
                    } else {
                        Text("Bonjour 👋")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(colors.textPrimary)

                        Text("Appuie sur Parler pour\ndémarrer une conversation")
                            .font(.system(size: 11))
                            .foregroundColor(colors.textSecondary)
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
    @Environment(\.colorScheme) var colorScheme

    private var colors: WidgetColors {
        colorScheme == .dark ? .dark : .light
    }

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry, colors: colors)
        case .systemMedium:
            MediumWidgetView(entry: entry, colors: colors)
        default:
            SmallWidgetView(entry: entry, colors: colors)
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
            // Dark mode
            DivaWidgetEntryView(entry: DivaEntry(date: Date(), lastUserMessage: nil, lastAIResponse: nil))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .environment(\.colorScheme, .dark)
                .previewDisplayName("Small — Dark")

            DivaWidgetEntryView(entry: DivaEntry(date: Date(), lastUserMessage: nil, lastAIResponse: nil))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .environment(\.colorScheme, .light)
                .previewDisplayName("Small — Light")

            DivaWidgetEntryView(entry: DivaEntry(
                date: Date(),
                lastUserMessage: "C'est quoi la météo demain ?",
                lastAIResponse: "Demain il fera 18°C et ensoleillé à Paris 🌤️"
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .environment(\.colorScheme, .dark)
            .previewDisplayName("Medium — Dark")

            DivaWidgetEntryView(entry: DivaEntry(
                date: Date(),
                lastUserMessage: "C'est quoi la météo demain ?",
                lastAIResponse: "Demain il fera 18°C et ensoleillé à Paris 🌤️"
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .environment(\.colorScheme, .light)
            .previewDisplayName("Medium — Light")
        }
    }
}
