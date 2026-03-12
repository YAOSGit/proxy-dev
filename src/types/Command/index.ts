type Command = {
    id: string;
    keys: string[];
    displayKey: string;
    displayText: string;
    footer: boolean;
    isEnabled: () => boolean;
    execute: () => void;
};

export type { Command };
