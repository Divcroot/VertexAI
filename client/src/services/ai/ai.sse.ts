import type {
    AIEventData,
} from "./ai.types.js";

export interface ParsedSSEEvent {
    eventType: string;
    data: AIEventData;
}

export const parseSSEEvent = (
    eventText: string,
): ParsedSSEEvent | null => {
    if (!eventText.trim()) {
        return null;
    }

    let eventType = "message";
    let dataText = "";

    const lines = eventText.split(/\r?\n/);

    for (const line of lines) {
        if (line.startsWith("event:")) {
            eventType = line
                .slice(6)
                .trim();
        }

        if (line.startsWith("data:")) {
            const data = line
                .slice(5)
                .trim();

            if (data) {
                dataText += data;
            }
        }
    }

    if (!dataText) {
        return null;
    }

    let data: AIEventData;

    try {
        data = JSON.parse(
            dataText,
        ) as AIEventData;
    } catch {
        data = {
            content: dataText,
        };
    }

    return {
        eventType,
        data,
    };
};

export const splitSSEBuffer = (
    buffer: string,
): {
    events: string[];
    remaining: string;
} => {
    const parts = buffer.split(
        /\r?\n\r?\n/,
    );

    return {
        events: parts.slice(0, -1),
        remaining:
            parts[parts.length - 1] ?? "",
    };
};